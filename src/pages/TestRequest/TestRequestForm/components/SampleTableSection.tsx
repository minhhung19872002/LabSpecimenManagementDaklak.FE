// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Button,
  Input,
  Table,
  Space,
  Popconfirm,
  Typography,
  Tooltip,
  Popover,
  AutoComplete,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  BarcodeOutlined,
} from "../../../../components/common/Icon";
import { Icon } from "@iconify/react";
import {
  SampleFormData,
  LaboratoryAssignment,
  IndicatorMethodKey,
  IndicatorMethodInfo,
  AttachmentInfo,
} from "../types";
import {
  IndicatorDto,
  SpecimenTypeDto,
} from "../../../../services/masterDataService";
import SampleImageUpload from "./SampleImageUpload";
import BarcodeQRModal, { SampleCodeInfo } from "./BarcodeQRModal";

const { Text } = Typography;

// Default column widths
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  sortOrder: 60,
  sampleCode: 130,
  sampleName: 180,
  specimenTypeName: 180,
  attachments: 140,
  samplingAddress: 200,
  sampleQuantity: 90,
  statusText: 140,
  indicatorMethods: 200,
  notes: 150,
  actions: 100,
};

interface SampleTableSectionProps {
  samples: SampleFormData[];
  sampleCodePrefix: string;
  isSamplesLocked: () => boolean;
  addSample: () => void;
  removeSample: (key: string) => void;
  updateSample: (key: string, field: keyof SampleFormData, value: any) => void;
  duplicateSample: (key: string) => void;
  openIndicatorModal: (sampleKey: string) => void;
  getIndicatorInfo: (indicatorId: string) => any;
  getIndicatorMethodInfo: (key: IndicatorMethodKey) => {
    indicator: IndicatorDto | undefined;
    method: IndicatorMethodInfo | undefined;
    indicatorId: string;
    testMethodId: string;
  };
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  specimenTypes: SpecimenTypeDto[];
  specimenTypeOptions: { value: string; label: string }[];
  handleSpecimenTypeSearch: (searchText: string) => void;
  handleSpecimenTypeSelect: (sampleKey: string, value: string) => void;
}

const SampleTableSection: React.FC<SampleTableSectionProps> = ({
  samples,
  sampleCodePrefix,
  isSamplesLocked,
  addSample,
  removeSample,
  updateSample,
  duplicateSample,
  openIndicatorModal,
  getIndicatorInfo,
  getIndicatorMethodInfo,
  indicatorLaboratoryMap,
  specimenTypes,
  specimenTypeOptions,
  handleSpecimenTypeSearch,
  handleSpecimenTypeSelect,
}) => {
  // Barcode/QR Modal state
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [selectedSampleForBarcode, setSelectedSampleForBarcode] =
    useState<SampleCodeInfo | null>(null);

  // Column widths state for resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(DEFAULT_COLUMN_WIDTHS);
  const resizingRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);

  // Handle column resize
  const handleResize = useCallback((column: string) => (e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
    setColumnWidths((prev) => ({
      ...prev,
      [column]: size.width,
    }));
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column] || 100,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { column: col, startX, startWidth } = resizingRef.current;
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [col]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [columnWidths]);

  // Resizable header cell component
  const ResizableTitle = ({ onResize, width, columnKey, children, ...restProps }: any) => {
    if (!width || columnKey === "actions") {
      return <th {...restProps}>{children}</th>;
    }

    return (
      <th {...restProps} style={{ ...restProps.style, position: "relative" }}>
        {children}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            cursor: "col-resize",
            zIndex: 1,
          }}
          onMouseDown={(e) => handleResizeStart(e, columnKey)}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: "absolute",
              right: 3,
              top: "30%",
              bottom: "30%",
              width: 2,
              background: "#d9d9d9",
              borderRadius: 1,
            }}
          />
        </div>
      </th>
    );
  };

  const openBarcodeModal = (sampleInfo: SampleCodeInfo) => {
    setSelectedSampleForBarcode(sampleInfo);
    setBarcodeModalVisible(true);
  };

  const closeBarcodeModal = () => {
    setBarcodeModalVisible(false);
    setSelectedSampleForBarcode(null);
  };

  // Generate columns with dynamic widths and onHeaderCell
  const getColumnWidth = (key: string) => columnWidths[key] || DEFAULT_COLUMN_WIDTHS[key] || 100;

  const sampleColumns = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: getColumnWidth("sortOrder"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "sortOrder",
      }),
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: getColumnWidth("sampleCode"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "sampleCode",
      }),
      render: (value: string, _record: SampleFormData) => {
        // Hiển thị sampleCode đã lưu trong data (không tính lại từ index)
        const displayCode = value || "--";
        return (
          <Input
            value={displayCode}
            disabled
            size="small"
            style={{ backgroundColor: "#f5f5f5" }}
          />
        );
      },
    },
    {
      title: (
        <span>
          Tên mẫu <span style={{ color: "#ff4d4f" }}>*</span>
        </span>
      ),
      dataIndex: "sampleName",
      key: "sampleName",
      width: getColumnWidth("sampleName"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "sampleName",
      }),
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleName", e.target.value)
          }
          placeholder="Tên mẫu"
          size="small"
        />
      ),
    },
    {
      title: "Loại mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: getColumnWidth("specimenTypeName"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "specimenTypeName",
      }),
      render: (value: string, record: SampleFormData) => (
        <AutoComplete
          value={value || ""}
          options={specimenTypeOptions}
          onSearch={handleSpecimenTypeSearch}
          onSelect={(val) => handleSpecimenTypeSelect(record.key, val)}
          onChange={(val) =>
            updateSample(record.key, "specimenTypeName", val || "")
          }
          placeholder="Nhập loại mẫu..."
          style={{ width: "100%" }}
          size="small"
          disabled={isSamplesLocked()}
          filterOption={false}
          allowClear
        />
      ),
    },
    {
      title: "Hình ảnh",
      dataIndex: "attachments",
      key: "attachments",
      width: getColumnWidth("attachments"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "attachments",
      }),
      render: (_: AttachmentInfo[], record: SampleFormData) => (
        <SampleImageUpload
          attachments={record.attachments || []}
          onChange={(attachments) =>
            updateSample(record.key, "attachments", attachments)
          }
          disabled={isSamplesLocked()}
        />
      ),
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: getColumnWidth("samplingAddress"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "samplingAddress",
      }),
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "samplingAddress", e.target.value)
          }
          placeholder="Địa chỉ"
          size="small"
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Lượng mẫu</span>,
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: getColumnWidth("sampleQuantity"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "sampleQuantity",
      }),
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleQuantity", e.target.value)
          }
          placeholder="Số lượng"
          size="small"
        />
      ),
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: getColumnWidth("statusText"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "statusText",
      }),
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "statusText", e.target.value)
          }
          placeholder="Tình trạng"
          size="small"
        />
      ),
    },
    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          Chỉ tiêu kiểm nghiệm <span style={{ color: "#ff4d4f" }}>*</span>
        </span>
      ),
      dataIndex: "indicatorMethods",
      key: "indicatorMethods",
      width: getColumnWidth("indicatorMethods"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "indicatorMethods",
      }),
      render: (_: IndicatorMethodKey[], record: SampleFormData) => {
        // Use indicatorMethods if available, fallback to indicatorIds for backward compat
        const methods = record.indicatorMethods || [];
        const hasData = methods.length > 0;

        const unsentMethods = methods.filter(
          (key) => !indicatorLaboratoryMap[`${record.key}_${key}`]
        );
        const sentMethods = methods.filter(
          (key) => indicatorLaboratoryMap[`${record.key}_${key}`]
        );
        const groupedByLab: Record<
          string,
          { labName: string; methods: IndicatorMethodKey[] }
        > = {};
        sentMethods.forEach((key) => {
          const labInfo = indicatorLaboratoryMap[`${record.key}_${key}`];
          if (!groupedByLab[labInfo.laboratoryId]) {
            groupedByLab[labInfo.laboratoryId] = {
              labName: labInfo.laboratoryName,
              methods: [],
            };
          }
          groupedByLab[labInfo.laboratoryId].methods.push(key);
        });

        const popoverContent = (
          <div style={{ maxHeight: 300, overflowY: "auto", minWidth: 320 }}>
            {!hasData ? (
              <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
            ) : (
              <>
                {unsentMethods.map((key) => {
                  const { indicator, method } = getIndicatorMethodInfo(key);
                  return indicator && method ? (
                    <div
                      key={key}
                      style={{
                        padding: "4px 0",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ flex: 1 }}>- {indicator.name}</span>
                      <span style={{ color: "#1890ff", fontSize: 12 }}>
                        {method.testMethodName}
                      </span>
                    </div>
                  ) : null;
                })}
                {Object.entries(groupedByLab).map(
                  ([labId, { labName, methods: labMethods }]) => (
                    <div key={labId}>
                      <div
                        style={{
                          padding: "6px 0 4px 0",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#000",
                          borderBottom: "1px solid #f0f0f0",
                          marginTop: unsentMethods.length > 0 ? 8 : 0,
                        }}
                      >
                        {labName} ({labMethods.length})
                      </div>
                      {labMethods.map((key) => {
                        const { indicator, method } =
                          getIndicatorMethodInfo(key);
                        return indicator && method ? (
                          <div
                            key={key}
                            style={{
                              padding: "4px 0 4px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ flex: 1 }}>- {indicator.name}</span>
                            <span style={{ color: "#1890ff", fontSize: 12 }}>
                              {method.testMethodName}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        );

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {hasData ? (
              <Popover
                content={popoverContent}
                title={`Chỉ tiêu kiểm nghiệm (${methods.length})`}
                trigger="click"
                placement="bottomLeft"
              >
                <Button
                  type="text"
                  icon={<Icon icon="mdi:clipboard-check-outline" width={20} />}
                  style={{
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    padding: 0,
                  }}
                />
              </Popover>
            ) : (
              <Text
                type="secondary"
                style={{ fontSize: 12, width: "100%", textAlign: "center" }}
              >
                Chưa chọn
              </Text>
            )}
            <Tooltip title="Thêm chỉ tiêu">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openIndicatorModal(record.key)}
                style={{ flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: getColumnWidth("notes"),
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "notes",
      }),
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => updateSample(record.key, "notes", e.target.value)}
          placeholder="Ghi chú"
          size="small"
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: getColumnWidth("actions"),
      fixed: "right" as const,
      onHeaderCell: (column: any) => ({
        width: column.width,
        columnKey: "actions",
      }),
      render: (_: any, record: SampleFormData) => {
        // Sử dụng sampleCode từ record (đã được lưu cố định)
        const sampleCode = record.sampleCode || "--";
        return (
          <Space size={0}>
            <Tooltip title="Nhân đôi">
              <Button
                type="link"
                icon={<CopyOutlined />}
                size="small"
                onClick={() => duplicateSample(record.key)}
              />
            </Tooltip>
            <Tooltip title="In mã mẫu">
              <Button
                type="link"
                icon={<BarcodeOutlined />}
                size="small"
                onClick={() =>
                  openBarcodeModal({
                    sampleCode,
                    sampleName: record.sampleName,
                    samplingAddress: record.samplingAddress,
                    sampleQuantity: record.sampleQuantity,
                    storageLocation: record.storageLocation,
                  })
                }
              />
            </Tooltip>
            <Popconfirm
              title="Xóa mẫu này?"
              onConfirm={() => removeSample(record.key)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="form-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography.Title
          level={5}
          className="section-title"
          style={{
            marginBottom: 0,
            borderBottom: "none",
            paddingBottom: 0,
          }}
        >
          Thông tin mẫu ({samples.length} mẫu)
        </Typography.Title>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={addSample}
          disabled={isSamplesLocked()}
          title={
            isSamplesLocked() ? "Không thể thêm mẫu khi đang thực hiện" : ""
          }
        >
          Thêm mẫu
        </Button>
      </div>

      {isSamplesLocked() && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 16px",
            background: "#fff7e6",
            borderRadius: 4,
            border: "1px solid #ffd591",
          }}
        >
          <Text type="warning">
            Không thể thêm/sửa/xóa mẫu khi phiếu đang thực hiện. Chỉ có thể sửa
            các thông tin khác.
          </Text>
        </div>
      )}

      <Table
        dataSource={samples}
        columns={sampleColumns}
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        pagination={false}
        scroll={{ x: "max-content", y: 220 }}
        size="small"
        bordered
        className="sample-table-fixed-height"
        locale={{
          emptyText: (
            <div style={{ padding: "60px 0" }}>
              Chưa có mẫu nào. Nhấn "Thêm mẫu" để thêm.
            </div>
          ),
        }}
      />

      {/* Barcode/QR Code Modal */}
      <BarcodeQRModal
        visible={barcodeModalVisible}
        onClose={closeBarcodeModal}
        sampleInfo={selectedSampleForBarcode}
      />
    </div>
  );
};

export default SampleTableSection;
