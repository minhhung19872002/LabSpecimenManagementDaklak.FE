import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Spin,
  Input,
  Row,
  Col,
  Modal,
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  FileWordOutlined,
  UploadOutlined,
} from "../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import {
  formTemplateService,
  FormTemplateDto,
} from "../../services/masterDataService";

const FormTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await formTemplateService.getList();
      setTemplates(data);
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      message.error("Không thể tải danh sách form mẫu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const doUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await formTemplateService.upload(file);
      if (result.success) {
        message.success(
          result.isReplacing
            ? `Đã thay thế file "${result.fileName}"`
            : `Đã tải lên file "${result.fileName}"`,
        );
        fetchTemplates();
      }
    } catch (err: any) {
      console.error("Failed to upload template:", err);
      message.error("Không thể tải lên file. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    try {
      // Check if file already exists on server
      const checkResult = await formTemplateService.checkExists(file.name);
      if (checkResult.exists) {
        Modal.confirm({
          title: "File đã tồn tại",
          content: `File "${file.name}" đã tồn tại trong hệ thống. Bạn có muốn thay thế file hiện tại không?`,
          centered: true,
          okText: "Thay thế",
          cancelText: "Hủy",
          okButtonProps: { danger: true },
          onOk: () => doUpload(file),
        });
      } else {
        await doUpload(file);
      }
    } catch (err: any) {
      console.error("Failed to check file existence:", err);
      // If check fails, still allow upload
      await doUpload(file);
    }
  };

  const handleDownload = async (template: FormTemplateDto) => {
    try {
      setDownloadingFile(template.fileName);
      const blob = await formTemplateService.download(template.fileName);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success(`Đã tải ${template.name}`);
    } catch (err: any) {
      console.error("Failed to download template:", err);
      message.error("Không thể tải file. Vui lòng thử lại.");
    } finally {
      setDownloadingFile(null);
    }
  };

  const filteredTemplates = searchText
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : templates;

  const columns: ColumnsType<FormTemplateDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên file",
      dataIndex: "fileName",
      key: "fileName",
      render: (fileName: string) => (
        <Space>
          <FileWordOutlined style={{ color: "#2b579a" }} />
          {fileName}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            loading={downloadingFile === record.fileName}
          >
            Tải xuống
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
        align="middle"
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col flex="auto" style={{ textAlign: "right" }}>
          <Button
            icon={<UploadOutlined />}
            onClick={handleUploadClick}
            loading={uploading}
            style={{
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 500,
            }}
          >
            Tải lên template
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.xlsx,.xls,.pdf"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
        </Col>
      </Row>

      <Spin spinning={loading} tip="Đang tải...">
        <Table
          columns={columns}
          dataSource={filteredTemplates}
          rowKey="fileName"
          pagination={false}
          locale={{
            emptyText: "Không có form mẫu nào",
          }}
        />
      </Spin>
    </>
  );
};

export default FormTemplatesTab;
