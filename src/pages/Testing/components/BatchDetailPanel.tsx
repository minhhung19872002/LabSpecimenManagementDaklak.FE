import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Typography,
  Popconfirm,
  Alert,
  Empty,
} from "antd";
import {
  DeleteOutlined,
  SendOutlined,
  StopOutlined,
  EditOutlined,
  ArrowLeftOutlined,
} from "../../../components/common/Icon";
import testBatchService from "../../../services/testBatchService";
import testResultValueService from "../../../services/testResultValueService";
import {
  TestBatchDto,
  TestBatchStatus,
} from "../../../types/testBatch";
import EditBatchModal from "./EditBatchModal";
import BatchIndicatorTable, { type EditedValuesMap } from "./BatchIndicatorTable";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  batchId: string | null;
  onBatchesChanged: () => void;
  isMobile?: boolean;
  onBackToList?: () => void;
}

const BatchDetailPanel = React.memo<Props>(({
  batchId,
  onBatchesChanged,
  isMobile,
  onBackToList,
}) => {
  const [batchDetail, setBatchDetail] = useState<TestBatchDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const editedValuesRef = useRef<EditedValuesMap>(new Map());
  const [resultOptions, setResultOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    testResultValueService
      .getWithIndicators()
      .then((data) =>
        setResultOptions(data.map((item) => ({ value: item.name, label: item.name })))
      )
      .catch(() => {});
  }, []);

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
    if (batchId) {
      loadDetail(batchId);
      setSelectedItemIds([]);
      editedValuesRef.current.clear();
    } else {
      setBatchDetail(null);
      setSelectedItemIds([]);
    }
  }, [batchId, loadDetail]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleResultSaved = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      onBatchesChanged();
    }, 500);
  }, [onBatchesChanged]);

  const handleOpenSubmitConsumption = async () => {
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

    setSubmitting(true);
    try {
      await testBatchService.submitItems(batchDetail.id, selectedItemIds);
      message.success(`Gửi kết quả thành công (${selectedItemIds.length} chỉ tiêu)`);
      setSelectedItemIds([]);
      editedValuesRef.current.clear();
      loadDetail(batchDetail.id);
      onBatchesChanged();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi gửi kết quả");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSingleItem = useCallback(async (itemId: string) => {
    if (!batchDetail) return;
    const item = batchDetail.items.find((i) => i.id === itemId);
    if (!item) return;

    const editedVal = editedValuesRef.current.get(itemId);
    const result = editedVal?.result ?? item.result;
    const testDate = editedVal?.testDate ?? item.testDate;

    if (!result || result.trim() === "") {
      message.warning(`Vui lòng nhập kết quả cho: ${item.indicatorName || "chỉ tiêu này"}`);
      return;
    }
    if (!testDate) {
      message.warning(`Vui lòng chọn ngày thử nghiệm cho: ${item.indicatorName || "chỉ tiêu này"}`);
      return;
    }

    try {
      await testBatchService.submitItems(batchDetail.id, [itemId]);
      message.success("Gửi kết quả thành công");
      loadDetail(batchDetail.id);
      onBatchesChanged();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi gửi kết quả");
    }
  }, [batchDetail, loadDetail, onBatchesChanged]);

  const handleCancel = async () => {
    if (!batchDetail) return;
    try {
      await testBatchService.cancel(batchDetail.id);
      message.success("Hủy mẻ thành công");
      loadDetail(batchDetail.id);
      onBatchesChanged();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi hủy mẻ");
    }
  };

  const handleDelete = async () => {
    if (!batchDetail) return;
    try {
      await testBatchService.delete(batchDetail.id);
      message.success("Xóa mẻ thành công");
      setBatchDetail(null);
      onBatchesChanged();
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

  if (!batchDetail) {
    return (
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
    );
  }

  return (
    <>
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
                onClick={onBackToList}
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
                loading={submitting}
                disabled={selectedItemIds.length === 0 || submitting}
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
          resultOptions={resultOptions}
          onResultSaved={handleResultSaved}
          onSubmitItem={canSubmit ? handleSubmitSingleItem : undefined}
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

      <EditBatchModal
        open={editModalOpen}
        batch={batchDetail}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => {
          loadDetail(batchDetail.id);
          onBatchesChanged();
        }}
      />

    </>
  );
});

export default BatchDetailPanel;
