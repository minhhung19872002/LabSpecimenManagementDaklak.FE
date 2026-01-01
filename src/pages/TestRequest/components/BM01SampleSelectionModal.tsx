import { useState, useEffect } from "react";
import { Modal, Button, Spin, Table, Select, Input, message } from "antd";
import {
  testRequestService,
  SampleForSelectionDto,
  TemplateDto,
} from "../../../services/testRequestService";
import { API_BASE_URL } from "../../../services/api";
import { getSampleSelectionColumns } from "../columns";

interface BM01SampleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
  onSuccess: () => void;
}

const BM01SampleSelectionModal: React.FC<BM01SampleSelectionModalProps> = ({
  open,
  onClose,
  testRequestId,
  onSuccess,
}) => {
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [samplesForSelection, setSamplesForSelection] = useState<
    SampleForSelectionDto[]
  >([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [generatingBM01, setGeneratingBM01] = useState(false);
  const [bm01Note, setBm01Note] = useState<string>("");

  // Template selection states
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    undefined
  );
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const sampleSelectionColumns = getSampleSelectionColumns();

  useEffect(() => {
    if (open && testRequestId) {
      loadData();
    }
  }, [open, testRequestId]);

  const loadData = async () => {
    setLoadingSamples(true);
    setSelectedSampleId(null);
    setBm01Note("");
    setSelectedTemplate(undefined);

    try {
      const [samples] = await Promise.all([
        testRequestService.getSamplesForResultForm(testRequestId),
        loadTemplates(),
      ]);
      setSamplesForSelection(samples);
    } catch (error: any) {
      console.error("Error loading samples:", error);
      message.error("Không thể tải danh sách mẫu");
      onClose();
    } finally {
      setLoadingSamples(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await testRequestService.getTemplates();
      setTemplates(result);
      if (result.length > 0) {
        setSelectedTemplate(result[0].name);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleClose = () => {
    setSelectedSampleId(null);
    setBm01Note("");
    setSelectedTemplate(undefined);
    setSamplesForSelection([]);
    onClose();
  };

  const handleGenerateBM01 = async () => {
    if (!testRequestId || !selectedSampleId) {
      message.warning("Vui lòng chọn một mẫu");
      return;
    }

    const selectedSample = samplesForSelection.find(
      (s) => s.id === selectedSampleId
    );
    if (selectedSample && !selectedSample.canGenerateResult) {
      message.error("Mẫu chưa xét nghiệm xong");
      return;
    }

    setGeneratingBM01(true);

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
      const result = await testRequestService.generateBM01ResultForm(
        testRequestId,
        selectedSampleId,
        bm01Note || undefined,
        selectedTemplate
      );
      message.success(`Đã tạo phiếu kết quả cho mẫu ${result.sampleCode}`);

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
      console.error("Error generating BM01 result form:", error);
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu kết quả. Vui lòng thử lại."
      );
    } finally {
      setGeneratingBM01(false);
    }
  };

  return (
    <Modal
      title="Chọn mẫu để xuất báo cáo"
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
          loading={generatingBM01}
          disabled={
            !selectedSampleId ||
            !samplesForSelection.find((s) => s.id === selectedSampleId)
              ?.canGenerateResult
          }
          onClick={handleGenerateBM01}
        >
          Xuất báo cáo
        </Button>,
      ]}
    >
      <Spin spinning={loadingSamples}>
        {/* Template selection */}
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
          >
            Chọn biểu mẫu
          </label>
          <Select
            style={{ width: "100%" }}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            loading={loadingTemplates}
            placeholder="Chọn biểu mẫu"
          >
            {templates.map((template) => (
              <Select.Option key={template.name} value={template.name}>
                {template.displayName}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Table
          dataSource={samplesForSelection}
          columns={sampleSelectionColumns}
          rowKey="id"
          pagination={false}
          size="small"
          rowSelection={{
            type: "radio",
            selectedRowKeys: selectedSampleId ? [selectedSampleId] : [],
            onChange: (selectedRowKeys) => {
              setSelectedSampleId(selectedRowKeys[0] as string);
            },
            getCheckboxProps: (record: SampleForSelectionDto) => ({
              disabled: !record.canGenerateResult,
            }),
          }}
          onRow={(record) => ({
            onClick: () => {
              if (record.canGenerateResult) {
                setSelectedSampleId(record.id);
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
            value={bm01Note}
            onChange={(e) => setBm01Note(e.target.value)}
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

export default BM01SampleSelectionModal;
