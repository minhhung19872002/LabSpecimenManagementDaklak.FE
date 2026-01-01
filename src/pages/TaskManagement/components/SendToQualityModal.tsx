import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Select,
  Checkbox,
  Button,
  Space,
  Typography,
  Spin,
  Empty,
  Divider,
  message,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import {
  LaboratoryTaskIndicatorDto,
  UserLookupDto,
  IndicatorApprovalStatus,
} from "../../../types/laboratoryTask";
import { sendToQualitySchema, SendToQualityFormData } from "../schemas";

const { Text } = Typography;

interface SendToQualityModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  indicators: LaboratoryTaskIndicatorDto[];
  onSuccess: () => void;
}

const SendToQualityModal: React.FC<SendToQualityModalProps> = ({
  open,
  onClose,
  taskId,
  indicators,
  onSuccess,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendToQualityFormData>({
    resolver: yupResolver(sendToQualitySchema),
    defaultValues: {
      qualityManagerId: "",
    },
  });

  const [qualityManagers, setQualityManagers] = useState<UserLookupDto[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);

  // Filter only approved indicators that haven't been sent to quality yet
  const approvedIndicators = useMemo(() => {
    return indicators.filter(
      (ind) =>
        ind.approvalStatus === IndicatorApprovalStatus.Approved &&
        !ind.isSentToQuality
    );
  }, [indicators]);

  // Group approved indicators by sample for display
  const indicatorsBySample = useMemo(() => {
    const grouped: Record<string, LaboratoryTaskIndicatorDto[]> = {};
    approvedIndicators.forEach((ind) => {
      const key = ind.sampleId;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(ind);
    });
    return grouped;
  }, [approvedIndicators]);

  // Load quality managers when modal opens
  useEffect(() => {
    if (open) {
      loadQualityManagers();
      // Select all approved indicators by default
      setSelectedIndicatorIds(approvedIndicators.map((ind) => ind.id));
    }
  }, [open, approvedIndicators]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedIndicatorIds([]);
    }
  }, [open, reset]);

  const loadQualityManagers = async () => {
    setLoadingManagers(true);
    try {
      const managers = await laboratoryTaskService.getQualityManagers(taskId);
      setQualityManagers(managers || []);
    } catch (error) {
      console.error("Failed to load quality managers:", error);
      message.error("Không thể tải danh sách Quản lý chất lượng");
      setQualityManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const onSubmit = async (values: SendToQualityFormData) => {
    if (selectedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để gửi");
      return;
    }

    setSubmitting(true);
    try {
      await laboratoryTaskService.sendToQuality(taskId, {
        indicatorIds: selectedIndicatorIds,
        qualityManagerId: values.qualityManagerId,
      });

      message.success("Đã gửi kết quả đến Quản lý chất lượng");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to send to quality:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể gửi kết quả"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedIndicatorIds(approvedIndicators.map((ind) => ind.id));
  };

  const handleDeselectAll = () => {
    setSelectedIndicatorIds([]);
  };

  const handleIndicatorToggle = (indicatorId: string, checked: boolean) => {
    if (checked) {
      setSelectedIndicatorIds((prev) => [...prev, indicatorId]);
    } else {
      setSelectedIndicatorIds((prev) => prev.filter((id) => id !== indicatorId));
    }
  };

  const handleSampleToggle = (sampleId: string, checked: boolean) => {
    const sampleIndicatorIds = indicatorsBySample[sampleId]?.map((ind) => ind.id) || [];
    if (checked) {
      setSelectedIndicatorIds((prev) => {
        const newIds = new Set([...prev, ...sampleIndicatorIds]);
        return Array.from(newIds);
      });
    } else {
      setSelectedIndicatorIds((prev) =>
        prev.filter((id) => !sampleIndicatorIds.includes(id))
      );
    }
  };

  const isSampleSelected = (sampleId: string) => {
    const sampleIndicatorIds = indicatorsBySample[sampleId]?.map((ind) => ind.id) || [];
    return sampleIndicatorIds.every((id) => selectedIndicatorIds.includes(id));
  };

  const isSampleIndeterminate = (sampleId: string) => {
    const sampleIndicatorIds = indicatorsBySample[sampleId]?.map((ind) => ind.id) || [];
    const selectedCount = sampleIndicatorIds.filter((id) =>
      selectedIndicatorIds.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < sampleIndicatorIds.length;
  };

  return (
    <Modal
      title="Gửi kết quả đến Quản lý chất lượng"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit(onSubmit)}
          disabled={selectedIndicatorIds.length === 0}
        >
          Gửi kết quả ({selectedIndicatorIds.length})
        </Button>,
      ]}
      width={700}
      centered
    >
      <Form layout="vertical">
        {/* Quality Manager Selection */}
        <Form.Item
          label="Quản lý chất lượng"
          required
          validateStatus={errors.qualityManagerId ? "error" : ""}
          help={errors.qualityManagerId?.message}
        >
          <Controller
            name="qualityManagerId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn Quản lý chất lượng..."
                loading={loadingManagers}
                options={(qualityManagers || []).map((manager) => ({
                  value: manager.id,
                  label: manager.displayName || manager.userName,
                }))}
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                showSearch
                notFoundContent={
                  loadingManagers ? (
                    <Spin size="small" />
                  ) : (
                    <Empty
                      description="Không có Quản lý chất lượng"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )
                }
              />
            )}
          />
        </Form.Item>

        <Divider />

        {/* Indicator Selection */}
        <div style={{ marginBottom: 12 }}>
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text strong>
              Chọn chỉ tiêu gửi phê duyệt ({selectedIndicatorIds.length}/
              {approvedIndicators.length})
            </Text>
            <Space>
              <Button size="small" onClick={handleSelectAll}>
                Chọn tất cả
              </Button>
              <Button size="small" onClick={handleDeselectAll}>
                Bỏ chọn tất cả
              </Button>
            </Space>
          </Space>

          {approvedIndicators.length === 0 ? (
            <Empty
              description="Không có chỉ tiêu nào đã duyệt chưa gửi"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                padding: 12,
              }}
            >
              {Object.entries(indicatorsBySample).map(([sampleId, sampleIndicators]) => (
                <div key={sampleId} style={{ marginBottom: 16 }}>
                  {/* Sample Header */}
                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      padding: "8px 12px",
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  >
                    <Checkbox
                      checked={isSampleSelected(sampleId)}
                      indeterminate={isSampleIndeterminate(sampleId)}
                      onChange={(e) => handleSampleToggle(sampleId, e.target.checked)}
                    >
                      <Text strong>
                        {sampleIndicators[0]?.sampleCode} - {sampleIndicators[0]?.sampleName}
                      </Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({sampleIndicators.length} chỉ tiêu)
                      </Text>
                    </Checkbox>
                  </div>

                  {/* Indicators */}
                  <div style={{ paddingLeft: 24 }}>
                    {sampleIndicators.map((indicator) => (
                      <div key={indicator.id} style={{ marginBottom: 4 }}>
                        <Checkbox
                          checked={selectedIndicatorIds.includes(indicator.id)}
                          onChange={(e) =>
                            handleIndicatorToggle(indicator.id, e.target.checked)
                          }
                        >
                          <Text>
                            {indicator.indicatorCode} - {indicator.indicatorName}
                          </Text>
                          {indicator.result && (
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              (KQ: {indicator.result} {indicator.unit || ""})
                            </Text>
                          )}
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default SendToQualityModal;
