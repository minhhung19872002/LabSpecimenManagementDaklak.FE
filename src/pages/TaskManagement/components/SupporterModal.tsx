import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Select,
  Button,
  Space,
  List,
  Avatar,
  Tag,
  Typography,
  message,
  Spin,
  Empty,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined,
} from "../../../components/common/Icon";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import { STORAGE_KEYS } from "../../../constants";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import {
  LaboratoryTaskSupporterDto,
  UserLookupDto,
} from "../../../types/laboratoryTask";

const { Text } = Typography;

interface SupporterModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  currentSupporters: LaboratoryTaskSupporterDto[];
  onSuccess: () => void;
}

const SupporterModal: React.FC<SupporterModalProps> = ({
  open,
  onClose,
  taskId,
  currentSupporters,
  onSuccess,
}) => {
  const [availableUsers, setAvailableUsers] = useState<UserLookupDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [addingSupporter, setAddingSupporter] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Get current user ID to exclude from available users
  const currentUserId = useMemo(() => {
    try {
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo).id : null;
    } catch {
      return null;
    }
  }, []);

  // Filter out current user from available users
  const filteredAvailableUsers = useMemo(() => {
    if (!currentUserId) return availableUsers || [];
    return (availableUsers || []).filter((user) => user.id !== currentUserId);
  }, [availableUsers, currentUserId]);

  // Load available users when modal opens
  useEffect(() => {
    if (open && taskId) {
      loadAvailableUsers();
    }
  }, [open, taskId]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedUserIds([]);
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await laboratoryTaskService.getAvailableSupporters(taskId);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to load available users:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddSupporters = async () => {
    if (selectedUserIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người hỗ trợ");
      return;
    }

    setAddingSupporter(true);
    try {
      await laboratoryTaskService.addSupporters(taskId, {
        userIds: selectedUserIds,
      });
      message.success("Đã thêm người hỗ trợ thành công");
      setSelectedUserIds([]);
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to add supporters:", error);
      message.error(
        getApiErrorMessage(error, "Không thể thêm người hỗ trợ")
      );
    } finally {
      setAddingSupporter(false);
    }
  };

  const handleRemoveSupporter = async (supporterId: string) => {
    setRemovingId(supporterId);
    try {
      await laboratoryTaskService.removeSupporter(taskId, supporterId);
      message.success("Đã xóa người hỗ trợ");
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to remove supporter:", error);
      message.error(
        getApiErrorMessage(error, "Không thể xóa người hỗ trợ")
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal
      title="Quản lý người hỗ trợ"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={600}
      centered
    >
      {/* Add new supporters section */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Thêm người hỗ trợ
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Select
            mode="multiple"
            placeholder="Chọn người hỗ trợ..."
            style={{ flex: 1 }}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            loading={loadingUsers}
            options={filteredAvailableUsers.map((user) => ({
              value: user.id,
              label: user.displayName || user.userName,
            }))}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            allowClear
            tagRender={({ label, onClose }) => (
              <Tag
                closable
                onClose={onClose}
                closeIcon={<CloseOutlined style={{ fontSize: 10 }} />}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  margin: "2px 4px 2px 0",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "#F5F5F5",
                  border: "1px solid #D9D9D9",
                }}
              >
                {label}
              </Tag>
            )}
            notFoundContent={
              loadingUsers ? (
                <Spin size="small" />
              ) : (
                <Empty
                  description="Không có người dùng khả dụng"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSupporters}
            loading={addingSupporter}
            disabled={selectedUserIds.length === 0}
          >
            Thêm
          </Button>
        </Space.Compact>
      </div>

      {/* Current supporters list */}
      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Danh sách người hỗ trợ hiện tại ({(currentSupporters || []).length})
        </Text>
        {(currentSupporters || []).length === 0 ? (
          <Empty
            description="Chưa có người hỗ trợ nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={currentSupporters || []}
            renderItem={(supporter) => (
              <List.Item
                key={supporter.id}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Xác nhận xóa người hỗ trợ này?"
                    onConfirm={() => handleRemoveSupporter(supporter.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removingId === supporter.id}
                      size="small"
                    >
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={supporter.fullName || supporter.userName}
                  description={supporter.email}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

export default SupporterModal;
