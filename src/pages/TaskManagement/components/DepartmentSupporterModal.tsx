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
  DatePicker,
} from "antd";
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined,
} from "../../../components/common/Icon";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import { employeeService, EmployeeDto } from "../../../services/employeeService";
import { STORAGE_KEYS } from "../../../constants";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { LaboratoryDepartmentSupporterDto } from "../../../types/laboratoryTask";
import dayjs, { Dayjs } from "dayjs";

const { Text } = Typography;

interface DepartmentSupporterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DepartmentSupporterModal: React.FC<DepartmentSupporterModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [availableUsers, setAvailableUsers] = useState<EmployeeDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expirationDate, setExpirationDate] = useState<Dayjs | null>(null);
  const [addingSupporter, setAddingSupporter] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentSupporters, setCurrentSupporters] = useState<LaboratoryDepartmentSupporterDto[]>([]);
  const [loadingSupporters, setLoadingSupporters] = useState(false);

  // Get current user ID to exclude from available users
  const currentUserId = useMemo(() => {
    try {
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo).id : null;
    } catch {
      return null;
    }
  }, []);

  // Filter out current user and existing supporters from available users
  const filteredAvailableUsers = useMemo(() => {
    const existingSupporterUserIds = new Set(currentSupporters.map((s) => s.userId));
    return (availableUsers || []).filter(
      (user) => user.id !== currentUserId && !existingSupporterUserIds.has(user.id)
    );
  }, [availableUsers, currentUserId, currentSupporters]);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadAvailableUsers();
      loadCurrentSupporters();
    }
  }, [open]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedUserIds([]);
      setExpirationDate(null);
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await employeeService.getList({ maxResultCount: 1000, sorting: "CreationTime DESC" });
      setAvailableUsers(result.items?.filter((u: EmployeeDto) => u.isActive) || []);
    } catch (error) {
      console.error("Failed to load available users:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCurrentSupporters = async () => {
    setLoadingSupporters(true);
    try {
      const supporters = await laboratoryTaskService.getDepartmentSupporters();
      setCurrentSupporters(Array.isArray(supporters) ? supporters : []);
    } catch (error) {
      console.error("Failed to load department supporters:", error);
    } finally {
      setLoadingSupporters(false);
    }
  };

  const handleAddSupporters = async () => {
    if (selectedUserIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người hỗ trợ");
      return;
    }

    if (!expirationDate) {
      message.warning("Vui lòng chọn ngày hết hạn");
      return;
    }

    setAddingSupporter(true);
    try {
      await laboratoryTaskService.addDepartmentSupporters({
        entries: selectedUserIds.map((userId) => ({
          userId,
          expirationDate: expirationDate.format("YYYY-MM-DD"),
        })),
      });
      message.success("Đã thêm người hỗ trợ khoa phòng thành công");
      setSelectedUserIds([]);
      setExpirationDate(null);
      await loadCurrentSupporters();
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to add department supporters:", error);
      message.error(
        getApiErrorMessage(error, "Không thể thêm người hỗ trợ khoa phòng")
      );
    } finally {
      setAddingSupporter(false);
    }
  };

  const handleRemoveSupporter = async (supporterId: string) => {
    setRemovingId(supporterId);
    try {
      await laboratoryTaskService.removeDepartmentSupporter(supporterId);
      message.success("Đã xóa người hỗ trợ khoa phòng");
      setCurrentSupporters((prev) => prev.filter((s) => s.id !== supporterId));
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to remove department supporter:", error);
      message.error(
        getApiErrorMessage(error, "Không thể xóa người hỗ trợ khoa phòng")
      );
    } finally {
      setRemovingId(null);
    }
  };

  // Disable past dates
  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf("day");
  };

  return (
    <Modal
      title="Quản lý người hỗ trợ khoa phòng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
      styles={{ body: { overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "70vh" } }}
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
              label: user.fullName || user.username,
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
          <DatePicker
            placeholder="Ngày hết hạn"
            value={expirationDate}
            onChange={setExpirationDate}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            style={{ width: 160 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSupporters}
            loading={addingSupporter}
            disabled={selectedUserIds.length === 0 || !expirationDate}
          />
        </Space.Compact>
      </div>

      {/* Current supporters list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Danh sách người hỗ trợ hiện tại ({currentSupporters.length})
        </Text>
        <Spin spinning={loadingSupporters}>
          {currentSupporters.length === 0 ? (
            <Empty
              description="Chưa có người hỗ trợ khoa phòng nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={currentSupporters}
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
                    description={
                      <Space size={4}>
                        <span>{supporter.email}</span>
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          Hết hạn: {dayjs(supporter.expirationDate).subtract(1, 'day').format("DD/MM/YYYY")}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>
    </Modal>
  );
};

export default DepartmentSupporterModal;
