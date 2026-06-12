import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Grid,
  message,
  Typography,
  Popconfirm,
  Alert,
  Empty,
  Progress,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SendOutlined,
  StopOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  SortAscendingOutlined,
  ArrowLeftOutlined,
} from "../../../components/common/Icon";
import ResponsiveSelect from "../../../components/common/ResponsiveSelect";
import testBatchService from "../../../services/testBatchService";
import {
  indicatorService,
  type IndicatorDto,
} from "../../../services/masterDataService";
import laboratoryTaskService from "../../../services/laboratoryTaskService";
import {
  TestBatchListDto,
  TestBatchDto,
  TestBatchStatus,
  TestBatchStatusLabels,
  TestBatchStatusColors,
} from "../../../types/testBatch";
import type { UserLookupDto } from "../../../types/laboratoryTask";
import CreateBatchModal from "./CreateBatchModal";
import EditBatchModal from "./EditBatchModal";
import SubmitConsumptionModal from "./SubmitConsumptionModal";
import BatchIndicatorTable, { type EditedValuesMap } from "./BatchIndicatorTable";
import dayjs from "dayjs";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const TestBatchTab: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const [batches, setBatches] = useState<TestBatchListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [indicatorFilter, setIndicatorFilter] = useState<string[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<string>("RequestCompletionDate desc");

  // Lookup data
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchDetail, setBatchDetail] = useState<TestBatchDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitConsumptionModalOpen, setSubmitConsumptionModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const editedValuesRef = useRef<EditedValuesMap>(new Map());

  useEffect(() => {
    indicatorService.getActive().then(setIndicators).catch(() => {});
    laboratoryTaskService
      .getTechniciansByLaboratory()
      .then(setTechnicians)
      .catch(() => {});
  }, []);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testBatchService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        filter: searchFilter || undefined,
        indicatorIds: indicatorFilter.length > 0 ? indicatorFilter : undefined,
        technicianIds:
          technicianFilter.length > 0 ? technicianFilter : undefined,
        fromDate: dateRange?.[0]
          ? dateRange[0].startOf("day").toISOString()
          : undefined,
        toDate: dateRange?.[1]
          ? dateRange[1].endOf("day").toISOString()
          : undefined,
        sorting: sorting || undefined,
      });
      setBatches(res.data?.items || []);
      setTotalCount(res.data?.totalCount || 0);
    } catch {
      message.error("Lỗi tải danh sách mẻ");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchFilter,
    indicatorFilter,
    technicianFilter,
    dateRange,
    sorting,
  ]);

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await testBatchService.get(id);
      setBatchDetail(res.data);
    } catch {
      message.error("Lỗi tải chi tiết mẻ");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatchId && !batches.some((b) => b.id === selectedBatchId)) {
      setSelectedBatchId(null);
      setBatchDetail(null);
      setSelectedItemIds([]);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId) {
      loadDetail(selectedBatchId);
    }
  }, [selectedBatchId, loadDetail]);

  const handleSelectBatch = (batch: TestBatchListDto) => {
    if (isMobile && selectedBatchId === batch.id) {
      setMobileView("detail");
      return;
    }
    setSelectedBatchId(batch.id);
    setSelectedItemIds([]);
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  const handleSearch = () => {
    setSearchFilter(searchText);
    setCurrentPage(1);
  };

  const handleOpenSubmitConsumption = () => {
    if (!batchDetail) return;
    if (selectedItemIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để gửi");
      return;
    }

    const selectedItems = batchDetail.items.filter((i) =>
      selectedItemIds.includes(i.id),
    );
    const edited = editedValuesRef.current;

    const missingResult = selectedItems.filter((i) => {
      const editedVal = edited.get(i.id);
      const result = editedVal?.result ?? i.result;
      return !result || result.trim() === "";
    });
    if (missingResult.length > 0) {
      const names = missingResult
        .map((i) => i.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng nhập kết quả cho: ${names}`);
      return;
    }

    const missingTestDate = selectedItems.filter((i) => {
      const editedVal = edited.get(i.id);
      const testDate = editedVal?.testDate ?? i.testDate;
      return !testDate;
    });
    if (missingTestDate.length > 0) {
      const names = missingTestDate
        .map((i) => i.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng chọn ngày thử nghiệm cho: ${names}`);
      return;
    }

    setSubmitConsumptionModalOpen(true);
  };

  const handleCancel = async () => {
    if (!batchDetail) return;
    try {
      await testBatchService.cancel(batchDetail.id);
      message.success("Hủy mẻ thành công");
      loadDetail(batchDetail.id);
      loadBatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi hủy mẻ");
    }
  };

  const handleDelete = async () => {
    if (!batchDetail) return;
    try {
      await testBatchService.delete(batchDetail.id);
      message.success("Xóa mẻ thành công");
      setSelectedBatchId(null);
      setBatchDetail(null);
      loadBatches();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi xóa mẻ");
    }
  };

  const canEdit =
    batchDetail?.status === TestBatchStatus.Draft ||
    batchDetail?.status === TestBatchStatus.Running;
  const canSubmit =
    batchDetail?.status === TestBatchStatus.Draft ||
    batchDetail?.status === TestBatchStatus.Running;
  const canDelete = batchDetail?.status === TestBatchStatus.Draft;
  const canCancel =
    (batchDetail?.status === TestBatchStatus.Draft ||
    batchDetail?.status === TestBatchStatus.Running ||
    batchDetail?.status === TestBatchStatus.Completed) &&
    !batchDetail?.hasApprovedIndicators;

  const renderBatchCard = (batch: TestBatchListDto) => {
    const isSelected = batch.id === selectedBatchId;
    const progress =
      batch.itemCount > 0
        ? Math.round((batch.submittedItemCount / batch.itemCount) * 100)
        : 0;

    return (
      <div
        key={batch.id}
        onClick={() => handleSelectBatch(batch)}
        style={{
          padding: "12px 14px",
          marginBottom: 8,
          borderRadius: 8,
          border: isSelected ? "2px solid #1677ff" : "1px solid #e8e8e8",
          background: isSelected ? "#e6f4ff" : "#fff",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {/* Row 1: Code + Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {batch.code}
          </Text>
          <Tag
            color={TestBatchStatusColors[batch.status]}
            style={{ margin: 0 }}
          >
            {TestBatchStatusLabels[batch.status]}
          </Tag>
        </div>

        {/* Row 2: Name */}
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 14 }}>
            {batch.name}
          </Text>
        </div>

        {/* Row 3: Counts + Creator */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 12px",
            alignItems: "center",
            marginBottom: 6,
            fontSize: 12,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <FileTextOutlined style={{ fontSize: 13 }} />
            <Text type="secondary">{batch.itemCount} chỉ tiêu</Text>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <FileTextOutlined style={{ fontSize: 13 }} />
            <Text type="secondary">{batch.contractCount} hợp đồng</Text>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <UserOutlined style={{ fontSize: 13 }} />
            <Text type="secondary">{batch.creatorName || "—"}</Text>
          </span>
        </div>

        {/* Row 4: Dates */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 12px",
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          <Text type="secondary">
            Ngày YC xong:{" "}
            {batch.requestCompletionDate
              ? dayjs(batch.requestCompletionDate).format("DD/MM/YYYY")
              : "—"}
          </Text>
          <Text type="secondary">
            Ngày tạo: {dayjs(batch.creationTime).format("DD/MM/YYYY")}
          </Text>
        </div>

        {/* Row 5: Progress */}
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Tiến độ nhập kết quả:
          </Text>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
            }}
          >
            <Progress
              percent={progress}
              size="small"
              showInfo={false}
              strokeColor={progress === 100 ? "#52c41a" : "#1677ff"}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Text style={{ fontSize: 12, flexShrink: 0 }}>
              {batch.submittedItemCount} / {batch.itemCount} chỉ tiêu
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Filter bar — same style as TestingList */}
      <Row gutter={[16, 16]} style={{ marginBottom: 0, padding: 16 }} align="middle">
        <Col xs={24} sm={12} md={5}>
          <Input.Search
            placeholder="Tìm theo số mẻ, tên mẻ..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (!e.target.value) {
                setSearchFilter("");
                setCurrentPage(1);
              }
            }}
            onSearch={handleSearch}
            allowClear
            enterButton
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              setCurrentPage(1);
            }}
            style={{ width: "100%" }}
            format="DD/MM/YY"
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn chỉ tiêu"
            value={indicatorFilter}
            onChange={(v: string[]) => {
              setIndicatorFilter(v);
              setCurrentPage(1);
            }}
            showSearch
            filterOption={(input, option) =>
              ((option?.label as string) ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={indicators.map((ind) => ({
              value: ind.id,
              label: ind.name,
            }))}
            maxTagCount="responsive"
            allowClear
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Thử nghiệm viên"
            value={technicianFilter}
            onChange={(v: string[]) => {
              setTechnicianFilter(v);
              setCurrentPage(1);
            }}
            allowClear
            maxTagCount="responsive"
            optionFilterProp="children"
            showSearch
          >
            {technicians.map((tech) => (
              <Select.Option key={tech.id} value={tech.id}>
                {tech.displayName || tech.userName}
              </Select.Option>
            ))}
          </ResponsiveSelect>
        </Col>
        <Col flex="auto" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Select
            value={sorting}
            onChange={(v) => {
              setSorting(v);
              setCurrentPage(1);
            }}
            prefix={<SortAscendingOutlined />}
          >
            <Select.Option value="RequestCompletionDate desc">Ngày hợp đồng mới nhất</Select.Option>
            <Select.Option value="RequestCompletionDate">Ngày yêu cầu xong cũ nhất</Select.Option>
            <Select.Option value="CreationTime desc">Ngày tạo mới nhất</Select.Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={16} style={{ padding: "0 16px 16px" }}>
        {/* Left: Batch List */}
        <Col
          xs={24} md={7} lg={5}
          style={isMobile && mobileView === "detail" ? { display: "none" } : undefined}
        >
          <div style={{ marginBottom: 8 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                Tạo mẻ mới
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadBatches}
              />
            </Space>
          </div>

          <div
            style={{
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Text type="secondary">Đang tải...</Text>
              </div>
            ) : batches.length === 0 ? (
              <Empty
                description="Chưa có mẻ nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              batches.map(renderBatchCard)
            )}
          </div>

          {totalCount > pageSize && (
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                borderTop: "1px solid #f0f0f0",
                paddingTop: 8,
              }}
            >
              <Space>
                <Button
                  size="small"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentPage} / {Math.ceil(totalCount / pageSize)}
                </Text>
                <Button
                  size="small"
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </Button>
              </Space>
            </div>
          )}
        </Col>

        {/* Right: Batch Detail */}
        <Col
          xs={24} md={17} lg={19}
          style={isMobile && mobileView === "list" ? { display: "none" } : undefined}
        >
          {batchDetail ? (
            <Card
              size="small"
              loading={loadingDetail}
              style={{ overflow: "hidden" }}
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isMobile && (
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBackToList}
                    />
                  )}
                  <span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {batchDetail.code}
                    </Text>
                    <br />
                    <Text strong style={{ fontSize: 16 }}>
                      {batchDetail.name}
                    </Text>
                  </span>
                </span>
              }
              extra={
                <Space wrap size={4}>
                  {canEdit && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setEditModalOpen(true)}
                    >
                      Chỉnh sửa mẻ
                    </Button>
                  )}
                  {canSubmit && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<SendOutlined />}
                      disabled={selectedItemIds.length === 0}
                      onClick={handleOpenSubmitConsumption}
                    >
                      Gửi ({selectedItemIds.length})
                    </Button>
                  )}
                  {canCancel && (
                    <Popconfirm title="Hủy mẻ này?" onConfirm={handleCancel}>
                      <Button size="small" danger icon={<StopOutlined />}>
                        Hủy
                      </Button>
                    </Popconfirm>
                  )}
                  {canDelete && (
                    <Popconfirm title="Xóa mẻ này?" onConfirm={handleDelete}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              }
            >
              {batchDetail.items.some((i) => i.isExternallyCompleted) && (
                <Alert
                  message="Một số chỉ tiêu đã được hoàn thành qua flow cũ"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                />
              )}

              <BatchIndicatorTable
                batchId={batchDetail.id}
                items={batchDetail.items}
                canEdit={canEdit}
                selectedItemIds={selectedItemIds}
                onSelectionChange={setSelectedItemIds}
                editedValuesRef={editedValuesRef}
              />

              {batchDetail.consumptionConfirmed && (
                <Alert
                  message={`Tiêu hao đã xác nhận lúc ${dayjs(batchDetail.consumptionConfirmedDate).format("DD/MM/YYYY HH:mm")}`}
                  type="success"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>
          ) : (
            <Card
              size="small"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <Empty description="Chọn mẻ thử nghiệm để xem chi tiết" />
            </Card>
          )}
        </Col>
      </Row>

      <CreateBatchModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          loadBatches();
        }}
      />

      <EditBatchModal
        open={editModalOpen}
        batch={batchDetail}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => {
          if (batchDetail) loadDetail(batchDetail.id);
          loadBatches();
        }}
      />

      {batchDetail && (
        <SubmitConsumptionModal
          open={submitConsumptionModalOpen}
          batchId={batchDetail.id}
          batchCode={batchDetail.code}
          batchName={batchDetail.name}
          selectedItemIds={selectedItemIds}
          onClose={() => setSubmitConsumptionModalOpen(false)}
          onSubmitted={() => {
            setSubmitConsumptionModalOpen(false);
            setSelectedItemIds([]);
            editedValuesRef.current.clear();
            loadDetail(batchDetail.id);
            loadBatches();
          }}
        />
      )}
    </div>
  );
};

export default TestBatchTab;
