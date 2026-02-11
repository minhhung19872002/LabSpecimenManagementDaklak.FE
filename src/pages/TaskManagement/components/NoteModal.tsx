import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Typography,
  Spin,
  Empty,
  Checkbox,
  message,
  Divider,
  Row,
  Col,
  Radio,
  Tooltip,
} from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { noteService } from "../../../services/noteService";
import { NoteDto } from "../../../types/note";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { stripPTags, stripHtmlTags } from "../../../utils/formatters";

const { Text } = Typography;

export interface NoteSaveInput {
  freeText: string | null;
  masterDataNoteIds: string[];
  /** true = không thay đổi MasterData (giữ nguyên), chỉ cập nhật FreeText */
  skipMasterDataUpdate?: boolean;
}

/** Thông tin MasterDataNoteIds của từng indicator */
export interface IndicatorMasterDataInfo {
  indicatorId: string;
  masterDataNoteIds: string; // comma-separated
}

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  selectedIndicatorIds: string[];
  allIndicatorIds: string[];
  onSave: (input: NoteSaveInput) => Promise<void>;
  loading?: boolean;
  title?: string;
  /** Giá trị FreeTextNote hiện có (để auto-fill) */
  initialFreeTextNote?: string;
  /**
   * Thông tin MasterDataNoteIds của các indicator được chọn
   * Dùng để detect trường hợp các indicator có MasterData khác nhau
   */
  selectedIndicatorsMasterData?: IndicatorMasterDataInfo[];
}

type MasterDataMode = "keep" | "replace";

const NoteModal: React.FC<NoteModalProps> = ({
  open,
  onClose,
  selectedIndicatorIds: _selectedIndicatorIds,
  allIndicatorIds: _allIndicatorIds,
  onSave,
  loading = false,
  title = "Ghi chú",
  initialFreeTextNote = "",
  selectedIndicatorsMasterData = [],
}) => {
  // Props kept for API compatibility
  void _selectedIndicatorIds;
  void _allIndicatorIds;

  const [freeText, setFreeText] = useState<string>("");
  const [selectedMasterNoteIds, setSelectedMasterNoteIds] = useState<
    Set<string>
  >(new Set());
  const [masterNotes, setMasterNotes] = useState<NoteDto[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [masterDataMode, setMasterDataMode] = useState<MasterDataMode>("keep");

  // Kiểm tra xem các indicator có MasterData khác nhau không
  const masterDataAnalysis = useMemo(() => {
    if (selectedIndicatorsMasterData.length <= 1) {
      // Single indicator hoặc không có data - không cần hiển thị cảnh báo
      const singleMasterData = selectedIndicatorsMasterData[0]?.masterDataNoteIds || "";
      return {
        hasMixedData: false,
        commonMasterDataIds: singleMasterData,
      };
    }

    // Multiple indicators - kiểm tra xem có khác nhau không
    const masterDataValues = selectedIndicatorsMasterData.map(
      (info) => info.masterDataNoteIds || ""
    );
    const uniqueValues = new Set(masterDataValues);
    const hasMixedData = uniqueValues.size > 1;

    // Nếu tất cả giống nhau thì lấy giá trị chung
    const commonMasterDataIds = hasMixedData ? "" : masterDataValues[0] || "";

    return {
      hasMixedData,
      commonMasterDataIds,
    };
  }, [selectedIndicatorsMasterData]);

  // Load master notes and auto-fill initial values when modal opens
  useEffect(() => {
    if (open) {
      loadMasterNotes();
      // Auto-fill FreeText
      setFreeText(initialFreeTextNote || "");

      // Auto-fill MasterData
      if (masterDataAnalysis.hasMixedData) {
        // Các indicator có MasterData khác nhau -> để trống và mặc định "Giữ nguyên"
        setSelectedMasterNoteIds(new Set());
        setMasterDataMode("keep");
      } else {
        // Tất cả giống nhau hoặc single indicator -> auto-fill
        if (masterDataAnalysis.commonMasterDataIds) {
          const ids = masterDataAnalysis.commonMasterDataIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
          setSelectedMasterNoteIds(new Set(ids));
        } else {
          setSelectedMasterNoteIds(new Set());
        }
        setMasterDataMode("replace"); // Mặc định cho phép edit
      }
    }
  }, [open, initialFreeTextNote, masterDataAnalysis]);

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

  // Handle toggle Master Data note
  const handleToggleMasterNote = (noteId: string) => {
    if (masterDataAnalysis.hasMixedData && masterDataMode === "keep") {
      // Không cho phép chọn khi đang ở mode "Giữ nguyên"
      return;
    }

    setSelectedMasterNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Check if HTML content has actual text (not just empty <p></p>)
  const hasContent = (html: string) => {
    const plain = stripPTags(html).replace(/<[^>]*>/g, "").trim();
    return plain.length > 0;
  };

  const handleSave = async () => {
    const skipMasterData = masterDataAnalysis.hasMixedData && masterDataMode === "keep";
    const hasFreeText = hasContent(freeText);

    // Validate: at least one input (nếu không skip MasterData)
    if (!hasFreeText && !skipMasterData && selectedMasterNoteIds.size === 0) {
      message.warning("Vui lòng nhập ghi chú hoặc chọn từ danh sách");
      return;
    }

    // Nếu skip MasterData nhưng không có FreeText thì cũng không cho lưu
    if (skipMasterData && !hasFreeText) {
      message.warning("Vui lòng nhập ghi chú tự do");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        freeText: hasFreeText ? freeText : null,
        masterDataNoteIds: skipMasterData ? [] : Array.from(selectedMasterNoteIds),
        skipMasterDataUpdate: skipMasterData,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
      message.error("Không thể lưu ghi chú");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFreeText("");
    setSelectedMasterNoteIds(new Set());
    setMasterDataMode("keep");
    onClose();
  };

  // Get selected master notes for preview
  const selectedMasterNotes = masterNotes
    .filter((note) => selectedMasterNoteIds.has(note.id));

  const isMasterDataDisabled =
    masterDataAnalysis.hasMixedData && masterDataMode === "keep";

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={saving || loading}
      okText="Lưu"
      cancelText="Hủy"
      width={700}
      centered
      destroyOnClose
      styles={{
        wrapper: {
          overflow: "auto",
        },
        body: {
          overflowX: "hidden",
          overflowY: "visible",
        },
      }}
    >
      <Row gutter={16}>
        {/* Left: Free Text Section */}
        <Col span={12}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Ghi chú tự do
          </Text>
          <RichTextEditor
            value={freeText}
            onChange={(html) => setFreeText(html)}
            placeholder="Nhập ghi chú tự do..."
            showToolbar
          />
        </Col>

        {/* Right: Master Data Notes Section */}
        <Col span={12}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Ghi chú từ danh sách
            {masterDataAnalysis.hasMixedData && (
              <Tooltip title="Các chỉ tiêu có ghi chú danh sách khác nhau">
                <ExclamationCircleFilled
                  style={{ color: "#faad14", fontSize: 14, marginLeft: 6, verticalAlign: "middle" }}
                />
              </Tooltip>
            )}
          </Text>

          {/* Radio chọn Giữ nguyên / Thay thế khi có MasterData khác nhau */}
          {masterDataAnalysis.hasMixedData && (
            <Radio.Group
              value={masterDataMode}
              onChange={(e) => {
                setMasterDataMode(e.target.value);
                if (e.target.value === "keep") {
                  setSelectedMasterNoteIds(new Set());
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}
            >
              <Radio value="keep">Giữ nguyên (không thay đổi)</Radio>
              <Radio value="replace">Thay thế bằng lựa chọn mới</Radio>
            </Radio.Group>
          )}

          {/* Chỉ hiển thị danh sách Master Data khi không phải mode "Giữ nguyên" */}
          {!isMasterDataDisabled && (
            <div
              style={{
                height: masterDataAnalysis.hasMixedData ? 145 : 200,
                overflowY: "auto",
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                padding: 8,
              }}
            >
              {loadingNotes ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin size="small" />
                </div>
              ) : masterNotes.length === 0 ? (
                <Empty
                  description="Không có ghi chú"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {masterNotes.map((note) => {
                    const isSelected = selectedMasterNoteIds.has(note.id);
                    return (
                      <Tooltip
                        key={note.id}
                        title={<div dangerouslySetInnerHTML={{ __html: note.content }} className="note-item-content" />}
                        placement="left"
                        overlayStyle={{ maxWidth: 400 }}
                      >
                        <div
                          onClick={() => handleToggleMasterNote(note.id)}
                          style={{
                            cursor: "pointer",
                            padding: "8px 12px",
                            borderRadius: 4,
                            backgroundColor: isSelected ? "#e6f7ff" : "transparent",
                            border: isSelected
                              ? "1px solid #91d5ff"
                              : "1px solid #f0f0f0",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Checkbox checked={isSelected} />
                          <span
                            style={{
                              color: isSelected ? "#1890ff" : "inherit",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            className="note-item-inline"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          />
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>

      {/* Preview Section */}
      <>
        <Divider style={{ margin: "12px 0" }} />
        <div
          style={{
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 6,
            border: "1px solid #d9d9d9",
          }}
        >
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Xem trước:
          </Text>
          <style>{`
            .note-preview-content ul,
            .note-preview-content ol {
              margin: 4px 0;
              padding-left: 24px;
            }
            .note-preview-content li {
              line-height: 22px;
            }
            .note-preview-content p {
              margin: 0;
            }
            .note-item-content p {
              margin: 0;
              display: inline;
            }
            .note-item-content ul,
            .note-item-content ol {
              margin: 2px 0;
              padding-left: 20px;
            }
            .note-item-inline > *:first-child {
              display: inline;
              margin: 0;
            }
            .note-item-inline > *:not(:first-child) {
              display: none;
            }
          `}</style>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hasContent(freeText) && (
              <div
                style={{ marginTop: 4 }}
                className="note-preview-content"
                dangerouslySetInnerHTML={{ __html: freeText }}
              />
            )}
            {isMasterDataDisabled ? (
              <Text type="secondary" italic>
                (Ghi chú danh sách giữ nguyên)
              </Text>
            ) : (
              selectedMasterNotes.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {selectedMasterNotes.map((note) => (
                    <div key={note.id} style={{ display: "flex", gap: 4 }}>
                      <span>-</span>
                      <span
                        className="note-preview-content"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </>
    </Modal>
  );
};

export default NoteModal;
