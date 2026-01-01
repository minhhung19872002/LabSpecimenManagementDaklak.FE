import { useState, useEffect } from "react";
import { Modal, Button, Spin, Table, Input, message } from "antd";
import {
  testRequestService,
  SampleForSelectionDto,
} from "../../../services/testRequestService";
import { API_BASE_URL } from "../../../services/api";
import { getSampleSelectionColumns } from "../columns";

interface MixedResultModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
  onSuccess: () => void;
}

const MixedResultModal: React.FC<MixedResultModalProps> = ({
  open,
  onClose,
  testRequestId,
  onSuccess,
}) => {
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [samplesForSelection, setSamplesForSelection] = useState<
    SampleForSelectionDto[]
  >([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [generatingMixed, setGeneratingMixed] = useState(false);
  const [mixedNote, setMixedNote] = useState<string>("");

  const sampleSelectionColumns = getSampleSelectionColumns();

  useEffect(() => {
    if (open && testRequestId) {
      loadData();
    }
  }, [open, testRequestId]);

  const loadData = async () => {
    setLoadingSamples(true);
    setSelectedSampleIds([]);
    setMixedNote("");

    try {
      const samples = await testRequestService.getSamplesForResultForm(testRequestId);
      setSamplesForSelection(samples);
    } catch (error: any) {
      console.error("Error loading samples:", error);
      message.error("Không thể tải danh sách mẫu");
      onClose();
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleClose = () => {
    setSelectedSampleIds([]);
    setMixedNote("");
    setSamplesForSelection([]);
    onClose();
  };

  const handleGenerateMixedResult = async () => {
    if (!testRequestId || selectedSampleIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một mẫu");
      return;
    }

    // Validate all selected samples can generate result
    const invalidSamples = selectedSampleIds.filter((sampleId) => {
      const sample = samplesForSelection.find((s) => s.id === sampleId);
      return sample && !sample.canGenerateResult;
    });

    if (invalidSamples.length > 0) {
      message.error("Có mẫu chưa xét nghiệm xong, không thể xuất báo cáo");
      return;
    }

    setGeneratingMixed(true);

    // Open new tab immediately to avoid popup blocker
    const newTab = window.open("about:blank", "_blank");

    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu kết quả...</p></div></body>
        </html>
      `);
    }

    try {
      const result = await testRequestService.generateMixedSamplesResultForm(
        testRequestId,
        selectedSampleIds,
        mixedNote || undefined
      );
      message.success(
        `Đã tạo phiếu kết quả hỗn hợp cho ${selectedSampleIds.length} mẫu`
      );

      handleClose();

      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        result.fileName
      )}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error generating mixed result form:", error);
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu kết quả. Vui lòng thử lại."
      );
    } finally {
      setGeneratingMixed(false);
    }
  };

  return (
    <Modal
      title="Chọn mẫu để xuất báo cáo kết quả hỗn hợp"
      open={open}
      onCancel={handleClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={generatingMixed}
          disabled={selectedSampleIds.length === 0}
          onClick={handleGenerateMixedResult}
        >
          Xuất báo cáo ({selectedSampleIds.length} mẫu)
        </Button>,
      ]}
    >
      <Spin spinning={loadingSamples}>
        <Table
          dataSource={samplesForSelection}
          columns={sampleSelectionColumns}
          rowKey="id"
          pagination={false}
          size="small"
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: selectedSampleIds,
            onChange: (selectedRowKeys) => {
              setSelectedSampleIds(selectedRowKeys as string[]);
            },
            getCheckboxProps: (record: SampleForSelectionDto) => ({
              disabled: !record.canGenerateResult,
            }),
          }}
          onRow={(record) => ({
            onClick: () => {
              if (record.canGenerateResult) {
                setSelectedSampleIds((prev) => {
                  if (prev.includes(record.id)) {
                    return prev.filter((id) => id !== record.id);
                  }
                  return [...prev, record.id];
                });
              }
            },
            style: {
              cursor: record.canGenerateResult ? "pointer" : "not-allowed",
              opacity: record.canGenerateResult ? 1 : 0.6,
            },
          })}
          locale={{ emptyText: "Không có mẫu nào" }}
        />
        {samplesForSelection.some((s) => !s.canGenerateResult) && (
          <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
            * Chỉ có thể xuất báo cáo cho các mẫu có trạng thái "Đã gửi kết quả"
          </div>
        )}

        {/* Note input field */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
          >
            Ghi chú (không bắt buộc)
          </label>
          <Input.TextArea
            value={mixedNote}
            onChange={(e) => setMixedNote(e.target.value)}
            placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
            rows={3}
            maxLength={500}
            showCount
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default MixedResultModal;
