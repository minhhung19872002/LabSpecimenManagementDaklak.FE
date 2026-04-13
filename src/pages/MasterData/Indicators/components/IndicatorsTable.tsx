import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { Table, Button, Space, Checkbox, Spin, Tag, Typography, Tooltip, Popconfirm, Empty, Input, Select, Row, Col } from "antd";
import {
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto, GroupedIndicatorData } from "../types";
import {
  indicatorService,
  IndicatorMethodDto,
  IndicatorWithMethodsDto,
} from "../../../../services/masterDataService";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import { formatCurrency } from "../../../../utils/formatters";
import "./IndicatorsTable.css";

export interface IndicatorsTableRef {
  invalidateMethodsCache: () => void;
}

interface IndicatorsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedIndicatorData[];
  expandedRowKeys: string[];
  selectedRowKeys: string[];
  indicators: IndicatorDto[];
  groupColumns: ColumnsType<GroupedIndicatorData>;
  indicatorColumns: ColumnsType<IndicatorDto>;
  onExpandedRowsChange: (keys: string[]) => void;
  onSelectedRowsChange: (keys: string[]) => void;
  onBatchDelete: () => void;
  onBatchDeactivate: () => void;
  onBatchActivate: () => void;
  onAddMethod?: (
    indicatorId: string,
    indicatorName: string,
    indicatorFormattedName: string | undefined,
    existingMethods: IndicatorMethodDto[]
  ) => void;
  onEditMethod?: (
    record: IndicatorMethodDto,
    indicatorId: string,
    indicatorName: string,
    indicatorFormattedName: string | undefined,
    existingMethods: IndicatorMethodDto[]
  ) => void;
  onDeleteMethod?: (record: IndicatorMethodDto, indicatorId: string) => void;
  onToggleMethodActive?: (record: IndicatorMethodDto, indicatorId: string) => void;
  // Search & Filter
  searchText?: string;
  filterSpecimenTypeIds?: string[];
  filterTestMethodIds?: string[];
  specimenTypeOptions?: { value: string; label: string }[];
  testMethodOptions?: { value: string; label: string }[];
  onSearchChange?: (value: string) => void;
  onFilterSpecimenTypeChange?: (values: string[]) => void;
  onFilterTestMethodChange?: (values: string[]) => void;
  // Pagination
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

// Build method columns with action handlers
const getMethodColumns = (
  _indicatorId: string,
  onEdit?: (record: IndicatorMethodDto) => void,
  onDelete?: (record: IndicatorMethodDto) => void,
  onToggleActive?: (record: IndicatorMethodDto) => void
): ColumnsType<IndicatorMethodDto> => {
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);
  const showActions = (canEdit || canDelete) && (onEdit || onDelete || onToggleActive);

  const cols: ColumnsType<IndicatorMethodDto> = [
    {
      title: "Nền mẫu",
      key: "specimenTypeName",
      width: 150,
      render: (_, record) => record.specimenTypeName || "-",
    },
    {
      title: "Tên phương pháp",
      key: "testMethodName",
      width: 200,
      render: (_, record) => (
        <IndicatorName
          name={record.testMethodName}
          formattedName={record.testMethodFormattedName}
        />
      ),
    },
    {
      title: "Đơn vị tính",
      key: "unit",
      width: 120,
      render: (_, record) => {
        if (record.formattedUnit) {
          return (
            <span dangerouslySetInnerHTML={{ __html: record.formattedUnit }} />
          );
        }
        return record.unit || "-";
      },
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      width: 120,
      render: (_, record) => formatCurrency(record.unitPrice),
    },
    {
      title: "Trạng thái",
      key: "isActive",
      width: 100,
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
  ];

  if (showActions) {
    cols.push({
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {canEdit && onEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {canEdit && onToggleActive && (
            <Tooltip title={record.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}>
              <Button
                type="link"
                size="small"
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => onToggleActive(record)}
              />
            </Tooltip>
          )}
          {canDelete && onDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa phương pháp này?"
              onConfirm={() => onDelete(record)}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return cols;
};

// Sub-component to render expandable method table per indicator
const IndicatorMethodsTable: React.FC<{
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  methodsMap: Map<string, IndicatorMethodDto[]>;
  methodsLoaded: boolean;
  filterSpecimenTypeIds?: string[];
  filterTestMethodIds?: string[];
  onAddMethod?: (
    indicatorId: string,
    indicatorName: string,
    indicatorFormattedName: string | undefined,
    existingMethods: IndicatorMethodDto[]
  ) => void;
  onEditMethod?: (record: IndicatorMethodDto) => void;
  onDeleteMethod?: (record: IndicatorMethodDto) => void;
  onToggleActive?: (record: IndicatorMethodDto) => void;
}> = ({
  indicatorId,
  indicatorName,
  indicatorFormattedName,
  methodsMap,
  methodsLoaded,
  filterSpecimenTypeIds,
  filterTestMethodIds,
  onAddMethod,
  onEditMethod,
  onDeleteMethod,
  onToggleActive,
}) => {
  const allMethods = methodsMap.get(indicatorId);

  // Filter methods by active filters
  const methods = useMemo(() => {
    if (!allMethods) return undefined;
    let result = allMethods;
    if (filterSpecimenTypeIds?.length) {
      result = result.filter((m) => m.specimenTypeId && filterSpecimenTypeIds.includes(m.specimenTypeId));
    }
    if (filterTestMethodIds?.length) {
      result = result.filter((m) => filterTestMethodIds.includes(m.testMethodId));
    }
    return result;
  }, [allMethods, filterSpecimenTypeIds, filterTestMethodIds]);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const columns = getMethodColumns(indicatorId, onEditMethod, onDeleteMethod, onToggleActive);

  if (!methods || methods.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          !methodsLoaded ? (
            "Đang tải dữ liệu..."
          ) : canEdit && onAddMethod ? (
            <span>
              Chưa có phương pháp thử.{" "}
              <Typography.Link
                onClick={() =>
                  onAddMethod(indicatorId, indicatorName, indicatorFormattedName, [])
                }
              >
                Click vào đây
              </Typography.Link>{" "}
              để thêm dữ liệu mới
            </span>
          ) : (
            "Chưa có phương pháp thử"
          )
        }
      />
    );
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={methods}
        rowKey={(record) =>
          `${record.testMethodId}-${record.specimenTypeId || "none"}`
        }
        pagination={false}
        size="small"
        className="methods-subtable"
      />
      {canEdit && onAddMethod && (
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          style={{ marginTop: 8, marginBottom: 4 }}
          onClick={() =>
            onAddMethod(
              indicatorId,
              indicatorName,
              indicatorFormattedName,
              allMethods || []
            )
          }
        >
          Thêm phương pháp
        </Button>
      )}
    </>
  );
};

const IndicatorsTable = forwardRef<IndicatorsTableRef, IndicatorsTableProps>(
  (
    {
      loading,
      batchLoading,
      groupedData,
      expandedRowKeys,
      selectedRowKeys,
      indicators,
      groupColumns,
      indicatorColumns,
      onExpandedRowsChange,
      onSelectedRowsChange,
      onBatchDelete,
      onBatchDeactivate,
      onBatchActivate,
      onAddMethod,
      onEditMethod,
      onDeleteMethod,
      onToggleMethodActive,
      searchText,
      filterSpecimenTypeIds,
      filterTestMethodIds,
      specimenTypeOptions,
      testMethodOptions,
      onSearchChange,
      onFilterSpecimenTypeChange,
      onFilterTestMethodChange,
      totalCount,
      currentPage,
      pageSize: pageSizeProp,
      onPageChange,
    },
    ref
  ) => {
    // Store methods data keyed by indicator ID
    const [methodsMap, setMethodsMap] = useState<
      Map<string, IndicatorMethodDto[]>
    >(new Map());
    const [methodsLoading, setMethodsLoading] = useState(false);
    const [methodsLoaded, setMethodsLoaded] = useState(false);

    // Expose invalidation to parent
    useImperativeHandle(ref, () => ({
      invalidateMethodsCache: () => setMethodsLoaded(false),
    }));

    // Fetch methods data
    const fetchMethodsData = useCallback(async () => {
      if (methodsLoaded) return;
      setMethodsLoading(true);
      try {
        const data: IndicatorWithMethodsDto[] =
          await indicatorService.getWithMethods();
        const map = new Map<string, IndicatorMethodDto[]>();
        data.forEach((item) => {
          map.set(item.id, item.methods);
        });
        setMethodsMap(map);
        setMethodsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch indicator methods:", error);
      } finally {
        setMethodsLoading(false);
      }
    }, [methodsLoaded]);

    // Reload methods when indicators change
    useEffect(() => {
      setMethodsLoaded(false);
    }, [indicators]);

    // Lazy load methods when any indicator row is expanded
    const [expandedIndicatorKeys, setExpandedIndicatorKeys] = useState<
      string[]
    >([]);

    useEffect(() => {
      if (expandedIndicatorKeys.length > 0 && !methodsLoaded) {
        fetchMethodsData();
      }
    }, [expandedIndicatorKeys, methodsLoaded, fetchMethodsData]);

    return (
      <>
        {onSearchChange && (
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: 16, padding: "16px 16px 0" }}
          >
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên chỉ tiêu..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Select
                mode="multiple"
                placeholder="Nền mẫu"
                value={filterSpecimenTypeIds}
                onChange={onFilterSpecimenTypeChange}
                options={specimenTypeOptions}
                allowClear
                showSearch
                maxTagCount={undefined}
                filterOption={(input, option) =>
                  ((option?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Select
                mode="multiple"
                placeholder="Phương pháp"
                value={filterTestMethodIds}
                onChange={onFilterTestMethodChange}
                options={testMethodOptions}
                allowClear
                showSearch
                maxTagCount={undefined}
                filterOption={(input, option) =>
                  ((option?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              />
            </Col>
          </Row>
        )}
      <Spin spinning={loading}>
        <Table
          columns={groupColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => {
              const groupIndicatorIds = record.indicators.map(
                (ind: IndicatorDto) => ind.id
              );
              const allSelected =
                groupIndicatorIds.length > 0 &&
                groupIndicatorIds.every((id: string) =>
                  selectedRowKeys.includes(id)
                );
              const someSelected = groupIndicatorIds.some((id: string) =>
                selectedRowKeys.includes(id)
              );
              const hasSelectedInThisGroup = someSelected;

              const selectedIndicators = indicators.filter((ind) =>
                selectedRowKeys.includes(ind.id)
              );
              const hasInactiveSelected = selectedIndicators.some(
                (ind) => !ind.isActive
              );
              const hasActiveSelected = selectedIndicators.some(
                (ind) => ind.isActive
              );

              return (
                <div style={{ position: "relative" }}>
                  {hasSelectedInThisGroup && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        height: 39,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingLeft: 8,
                        paddingRight: 12,
                        zIndex: 100,
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newKeys = [
                                ...new Set([
                                  ...selectedRowKeys,
                                  ...groupIndicatorIds,
                                ]),
                              ];
                              onSelectedRowsChange(newKeys);
                            } else {
                              const newKeys = selectedRowKeys.filter(
                                (key) => !groupIndicatorIds.includes(key)
                              );
                              onSelectedRowsChange(newKeys);
                            }
                          }}
                        />
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#1890ff",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Đã chọn {selectedRowKeys.length}
                        </span>
                      </div>
                      <Space size="small">
                        {hasInactiveSelected && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={onBatchActivate}
                            loading={batchLoading}
                          >
                            Kích hoạt
                          </Button>
                        )}
                        {hasActiveSelected && (
                          <Button
                            size="small"
                            icon={<StopOutlined />}
                            onClick={onBatchDeactivate}
                            loading={batchLoading}
                          >
                            Ngưng
                          </Button>
                        )}
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={onBatchDelete}
                          loading={batchLoading}
                        >
                          Xóa
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => onSelectedRowsChange([])}
                        />
                      </Space>
                    </div>
                  )}
                  <Table
                    columns={indicatorColumns}
                    dataSource={record.indicators}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    expandable={{
                      expandedRowRender: (indicatorRecord) => (
                        <Spin spinning={methodsLoading} size="small">
                          <IndicatorMethodsTable
                            indicatorId={indicatorRecord.id}
                            indicatorName={indicatorRecord.name}
                            indicatorFormattedName={
                              indicatorRecord.formattedName
                            }
                            methodsMap={methodsMap}
                            methodsLoaded={methodsLoaded}
                            filterSpecimenTypeIds={filterSpecimenTypeIds}
                            filterTestMethodIds={filterTestMethodIds}
                            onAddMethod={onAddMethod}
                            onEditMethod={
                              onEditMethod
                                ? (record) =>
                                    onEditMethod(
                                      record,
                                      indicatorRecord.id,
                                      indicatorRecord.name,
                                      indicatorRecord.formattedName,
                                      methodsMap.get(indicatorRecord.id) || []
                                    )
                                : undefined
                            }
                            onDeleteMethod={
                              onDeleteMethod
                                ? (record) =>
                                    onDeleteMethod(record, indicatorRecord.id)
                                : undefined
                            }
                            onToggleActive={
                              onToggleMethodActive
                                ? (record) =>
                                    onToggleMethodActive(record, indicatorRecord.id)
                                : undefined
                            }
                          />
                        </Spin>
                      ),
                      rowExpandable: () => true,
                      expandedRowKeys: expandedIndicatorKeys,
                      onExpandedRowsChange: (keys) =>
                        setExpandedIndicatorKeys(keys as string[]),
                    }}
                  />
                </div>
              );
            },
            rowExpandable: () => true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) =>
              onExpandedRowsChange(keys as string[]),
          }}
          pagination={
            onPageChange
              ? {
                  current: currentPage,
                  pageSize: pageSizeProp,
                  total: totalCount,
                  showSizeChanger: true,
                  pageSizeOptions: [50, 100, 150],
                  showTotal: (total, range) => (
                    <>
                      Hiển thị{" "}
                      <b>
                        {range[0]}-{range[1]}/{total}
                      </b>
                    </>
                  ),
                  onChange: onPageChange,
                  onShowSizeChange: onPageChange,
                }
              : {
                  pageSize: 50,
                  showSizeChanger: true,
                  pageSizeOptions: [50, 100, 150],
                  showTotal: (total, range) => (
                    <>
                      Hiển thị{" "}
                      <b>
                        {range[0]}-{range[1]}/{total}
                      </b>
                    </>
                  ),
                }
          }
        />
      </Spin>
      </>
    );
  }
);

IndicatorsTable.displayName = "IndicatorsTable";

export default IndicatorsTable;
