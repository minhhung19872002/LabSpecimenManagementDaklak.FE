// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Popconfirm,
  List,
  Collapse,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import { sampleStorageService } from "../../../services/sampleStorageService";
import { formatDate } from "../../../utils/formatters";
import type {
  SampleStorageDetailDto,
  SampleStorageItemDto,
} from "../../../types/sampleStorage";
import {
  SampleStorageStatus,
  SampleStorageStatusLabels,
  SampleStorageStatusColors,
} from "../../../types/sampleStorage";
import SampleCard from "./SampleCard";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface SampleStorageDetailModalProps {
  open: boolean;
  testRequestId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SampleStorageDetailModal: React.FC<SampleStorageDetailModalProps> = ({
  open,
  testRequestId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SampleStorageDetailDto | null>(null);
  const [cancellingAll, setCancellingAll] = useState(false);

  const canEdit = authService.hasPermission(PERMISSIONS.Specimens.Edit);

  // Load detail when modal opens
  useEffect(() => {
    if (open && testRequestId) {
      loadDetail();
    } else {
      setDetail(null);
    }
  }, [open, testRequestId]);

  const loadDetail = async () => {
    if (!testRequestId) return;

    setLoading(true);
    try {
      const data = await sampleStorageService.get(testRequestId);
      setDetail(data);
    } catch (error) {
      console.error("Error loading sample storage detail:", error);
      message.error("Không thể tải thông tin chi tiết");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSample = async (sampleId: string) => {
    try {
      await sampleStorageService.cancelSample(sampleId);
      message.success("Đã hủy mẫu thành công");
      await loadDetail();
      onSuccess();
    } catch (error) {
      console.error("Error cancelling sample:", error);
      message.error("Không thể hủy mẫu");
    }
  };

  const handleCancelAllSamples = async () => {
    if (!testRequestId) return;

    setCancellingAll(true);
    try {
      await sampleStorageService.cancelAllSamples(testRequestId);
      message.success("Đã hủy tất cả mẫu thành công");
      await loadDetail();
      onSuccess();
    } catch (error) {
      console.error("Error cancelling all samples:", error);
      message.error("Không thể hủy tất cả mẫu");
    } finally {
      setCancellingAll(false);
    }
  };

  const getStatusTag = (status: SampleStorageStatus) => (
    <StatusTag color={SampleStorageStatusColors[status]}>
      {SampleStorageStatusLabels[status]}
    </StatusTag>
  );

  // Get samples that are not cancelled (for cancel all confirmation)
  const uncancelledSamples = detail?.samples.filter((s) => !s.isCancelled) || [];
  const showCancelAllButton =
    canEdit &&
    detail?.status === SampleStorageStatus.PendingDisposal &&
    uncancelledSamples.length > 0;

  // Render confirm content for cancel all
  const renderCancelAllConfirmContent = () => (
    <div style={{ maxHeight: 200, overflowY: "auto" }}>
      <p>Bạn có chắc chắn muốn hủy tất cả các mẫu sau?</p>
      <List
        size="small"
        dataSource={uncancelledSamples}
        renderItem={(sample: SampleStorageItemDto) => (
          <List.Item>
            <span>
              <strong>{sample.sampleCode}</strong> - {sample.sampleName}
            </span>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Modal
      title="Chi tiết quản lý mẫu"
      open={open}
      onCancel={onClose}
      width={1000}
      centered
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          {showCancelAllButton && (
            <Popconfirm
              title="Xác nhận hủy tất cả mẫu"
              description={renderCancelAllConfirmContent()}
              onConfirm={handleCancelAllSamples}
              okText="Xác nhận hủy tất cả"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: cancellingAll }}
            >
              <Button type="primary" danger loading={cancellingAll}>
                Xác nhận hủy tất cả mẫu
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <Spin spinning={loading}>
        {detail && (
          <>
            {/* Header Info */}
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 2 }}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Số hợp đồng">
                {detail.contractNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số mẫu">
                {detail.totalSampleCount}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày lưu kho">
                {formatDate(detail.storageDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng" span={{ xs: 1, sm: 2, md: 2 }}>
                {detail.customerName}
              </Descriptions.Item>
            </Descriptions>

            {/* Sample Cards with Collapse */}
            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
              <Collapse
                defaultActiveKey={detail.samples.map((s) => s.id)}
                items={detail.samples.map((sample) => ({
                  key: sample.id,
                  label: (
                    <Space>
                      <span style={{ fontWeight: 500 }}>{sample.sampleCode}</span>
                      <span>-</span>
                      <span>{sample.sampleName}</span>
                      {sample.isCancelled && <Tag color="error">Đã hủy</Tag>}
                    </Space>
                  ),
                  children: (
                    <SampleCard
                      sample={sample}
                      parentStatus={detail.status}
                      onCancel={handleCancelSample}
                      canEdit={canEdit}
                    />
                  ),
                }))}
              />
            </div>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default SampleStorageDetailModal;
