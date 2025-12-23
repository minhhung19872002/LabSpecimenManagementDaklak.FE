import React from "react";
import { Space, Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  TestRequestDto,
  canEditTestRequest,
  canDeleteTestRequest,
  showActionsForTestRequest,
} from "../../../types/testRequest";

interface TestRequestRowActionsProps {
  record: TestRequestDto;
  isDeleting: boolean;
  onEdit: (record: TestRequestDto) => void;
  onDelete: (id: string) => void;
}

const TestRequestRowActions: React.FC<TestRequestRowActionsProps> = ({
  record,
  isDeleting,
  onEdit,
  onDelete,
}) => {
  const canEdit = canEditTestRequest(record.status);
  const canDelete = canDeleteTestRequest(record.status);
  const showActions = showActionsForTestRequest(record.status);

  if (!showActions) {
    return null;
  }

  return (
    <Space size="small">
      <Button
        type="link"
        size="small"
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
        disabled={!canEdit}
        title={!canEdit ? "Không thể chỉnh sửa ở trạng thái này" : "Chỉnh sửa"}
      />
      <Popconfirm
        title="Bạn có chắc chắn muốn xóa?"
        onConfirm={() => onDelete(record.id)}
        okText="Có"
        cancelText="Không"
        disabled={!canDelete}
      >
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          disabled={!canDelete || isDeleting}
          title={!canDelete ? "Không thể xóa ở trạng thái này" : "Xóa"}
        />
      </Popconfirm>
    </Space>
  );
};

export default TestRequestRowActions;