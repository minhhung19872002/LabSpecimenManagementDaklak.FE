import React from "react";
import { Space, Button } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ImportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

interface TestRequestToolbarProps {
  isFetching: boolean;
  downloadingTemplate: boolean;
  onRefresh: () => void;
  onDownloadTemplate: () => void;
  onImport: () => void;
  onCreate: () => void;
}

const TestRequestToolbar: React.FC<TestRequestToolbarProps> = ({
  isFetching,
  downloadingTemplate,
  onRefresh,
  onDownloadTemplate,
  onImport,
  onCreate,
}) => {
  return (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={isFetching}>
        Làm mới
      </Button>
      <Button
        icon={<DownloadOutlined />}
        onClick={onDownloadTemplate}
        loading={downloadingTemplate}
      >
        Tải Template
      </Button>
      <Button icon={<ImportOutlined />} onClick={onImport}>
        Import Excel
      </Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        Tạo mới
      </Button>
    </Space>
  );
};

export default TestRequestToolbar;