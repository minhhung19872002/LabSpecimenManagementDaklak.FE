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
  Input,
  Row,
  Col,
} from "antd";
import { SendOutlined } from "../../../components/common/Icon";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import {
  LaboratoryTaskIndicatorDto,
  UserLookupDto,
  IndicatorApprovalStatus,
} from "../../../types/laboratoryTask";
import { sendToQualitySchema, SendToQualityFormData } from "../schemas";
import { noteService } from "../../../services/noteService";
import { IndicatorName } from "../../../components/common";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { stripHtmlTags } from "../../../utils/formatters";

const { Text } = Typography;
const { TextArea } = Input;

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

  // Note states
  const [noteContent, setNoteContent] = useState<string>("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [masterNotes, setMasterNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

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

  // Load quality managers and master notes when modal opens
  useEffect(() => {
    if (open) {
      loadQualityManagers();
      loadMasterNotes();
      // Select all approved indicators by default
      setSelectedIndicatorIds(approvedIndicators.map((ind) => ind.id));
    }
  }, [open, approvedIndicators]);

  // Build note content from selected indicators - only add, don't remove
  useEffect(() => {
    if (open && selectedIndicatorIds.length > 0) {
      const selectedInds = approvedIndicators.filter(ind =>
        selectedIndicatorIds.includes(ind.id)
      );
      const noteLines = selectedInds
        .map(ind => ind.freeTextNote)
        .filter(note => note && note.trim())
        .map(note => `- ${note}`);

      const newNoteContent = noteLines.join('\n');
      // Only update if we're adding new content (initial load or adding indicators)
      setNoteContent(prev => {
        // If current content is empty, set new content
        if (!prev.trim()) {
          return newNoteContent;
        }
        // If new content has more lines, append the difference
        const prevLines = prev.split('\n').filter(line => line.trim());
        const newLines = noteLines.filter(line => !prevLines.includes(line));
        if (newLines.length > 0) {
          return prev + '\n' + newLines.join('\n');
        }
        return prev;
      });
    }
  }, [selectedIndicatorIds, approvedIndicators, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedIndicatorIds([]);
      setNoteContent("");
      setSelectedNoteIds([]);
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

  const loadMasterNotes = async () => {
    setLoadingNotes(true);
    try {
      const notes = await noteService.getActiveNotes();
      setMasterNotes(notes || []);
    } catch (error) {
      console.error("Failed to load master notes:", error);
      message.error("Không thể tải danh sách ghi chú");
      setMasterNotes([]);
    } finally {
      setLoadingNotes(false);
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
        noteContent: noteContent.trim() || null,
        selectedNoteIds: selectedNoteIds.length > 0 ? selectedNoteIds : null,
      });

      message.success("Đã gửi kết quả đến Quản lý chất lượng");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to send to quality:", error);
      message.error(
        getApiErrorMessage(error, "Không thể gửi kết quả")
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
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
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
                          <span>
                            {indicator.indicatorCode} - <IndicatorName name={indicator.indicatorName || ""} formattedName={indicator.indicatorFormattedName} />
                          </span>
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

        <Divider />

        {/* Note Section */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Ghi chú
          </Text>
          <Row gutter={16}>
            <Col span={14}>
              <TextArea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={4}
                maxLength={2000}
                showCount
              />
            </Col>
            <Col span={10}>
              <Select
                mode="multiple"
                value={selectedNoteIds}
                onChange={setSelectedNoteIds}
                placeholder="Chọn ghi chú từ Master Data..."
                loading={loadingNotes}
                style={{ width: "100%" }}
                options={(masterNotes || []).map((note) => ({
                  value: note.id,
                  label: stripHtmlTags(note.content),
                }))}
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                showSearch
                notFoundContent={
                  loadingNotes ? (
                    <Spin size="small" />
                  ) : (
                    <Empty
                      description="Không có ghi chú"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )
                }
              />
            </Col>
          </Row>

          {/* Preview Section */}
          {(noteContent.trim() || selectedNoteIds.length > 0) && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#f5f5f5",
                borderRadius: 6,
                border: "1px solid #d9d9d9",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Xem trước nội dung ghi chú:
              </Text>
              <div style={{ whiteSpace: "pre-line" }}>
                {noteContent.trim() && (
                  <div style={{ marginBottom: 8 }}>
                    <Text>{noteContent}</Text>
                  </div>
                )}
                {selectedNoteIds.length > 0 && (
                  <div>
                    {masterNotes
                      .filter((note) => selectedNoteIds.includes(note.id))
                      .map((note) => (
                        <div key={note.id} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                          <span>-</span>
                          <span
                            className="note-preview-content"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          />
                        </div>
                      ))}
                    <style>{`
                      .note-preview-content p { margin: 0; }
                      .note-preview-content ul, .note-preview-content ol { margin: 2px 0; padding-left: 20px; }
                    `}</style>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default SendToQualityModal;
