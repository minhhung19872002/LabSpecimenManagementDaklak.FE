import React, { useState, useMemo } from "react";
import { Table, Button, Space, message, Spin, Input, Row, Col } from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formTemplateService } from "../../services/masterDataService";
import { useGetFormTemplateListQuery, FormTemplateDto } from "../../store/api/masterDataApi";
import OnlyOfficeEditor from "../../components/common/OnlyOfficeEditor";

const FormTemplatesTab: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>("");

  // RTK Query hook
  const { data: templates = [], isLoading: loading } = useGetFormTemplateListQuery();

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

  const handlePrint = (template: FormTemplateDto) => {
    setSelectedFile(template.fileName);
    setEditorVisible(true);
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setSelectedFile("");
  };

  const filteredTemplates = useMemo(() => {
    if (!searchText) return templates;
    return templates.filter((t) =>
      t.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [templates, searchText]);

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
            icon={<PrinterOutlined />}
            onClick={() => handlePrint(record)}
          >
            Xem & In
          </Button>
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
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
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

      <OnlyOfficeEditor
        visible={editorVisible}
        fileName={selectedFile}
        mode="view"
        permissions={{ print: true, download: true, edit: false }}
        onClose={handleEditorClose}
      />
    </>
  );
};

export default FormTemplatesTab;
