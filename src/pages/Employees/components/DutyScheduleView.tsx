import React from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Select,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  StopOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TemporaryAccessGrantDto,
  GrantStatus,
  TemporaryEmployeeType,
} from "../../../services/temporaryAccessService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

export interface DutyScheduleViewProps {
  grants: TemporaryAccessGrantDto[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  statusFilter: GrantStatus | undefined;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onStatusFilterChange: (value: GrantStatus | undefined) => void;
  onPageChange: (page: number, size: number) => void;
  onEdit: (grant: TemporaryAccessGrantDto) => void;
  onExpire: (id: string) => void;
}

const DutyScheduleView: React.FC<DutyScheduleViewProps> = ({
  grants,
  loading,
  totalCount,
  currentPage,
  pageSize,
  statusFilter,
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onStatusFilterChange,
  onPageChange,
  onEdit,
  onExpire,
}) => {
  const canEdit = authService.hasPermission(PERMISSIONS.TemporaryAccess.Edit);
  const canExpire = authService.hasPermission(PERMISSIONS.TemporaryAccess.Expire);

  const columns: ColumnsType<TemporaryAccessGrantDto> = [
    {
      title: "Nhân viên",
      key: "employee",
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.employeeFullName}</div>
          {record.employeeType === TemporaryEmployeeType.External && (
            <Tag color="orange" style={{ fontSize: 11, marginTop: 2 }}>
              Thuê ngoài
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "employeeEmail",
      key: "employeeEmail",
      width: 210,
      render: (email: string | undefined) => email || "-",
    },
    {
      title: "Điện thoại",
      dataIndex: "employeePhone",
      key: "employeePhone",
      width: 130,
      render: (phone: string | undefined) => phone || "-",
    },
    {
      title: "Ngày phân công",
      dataIndex: "startDate",
      key: "startDate",
      width: 140,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 140,
      defaultSortOrder: "descend",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: GrantStatus) =>
        status === GrantStatus.Active ? (
          <Tag color="green">Còn sử dụng</Tag>
        ) : (
          <Tag color="red">Hết hạn</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {canEdit && record.status === GrantStatus.Active && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {canExpire && record.status === GrantStatus.Active && (
            <Popconfirm
              title="Hết hạn ngay"
              description="Quyền truy cập sẽ bị thu hồi ngay lập tức. Bạn có chắc?"
              onConfirm={() => onExpire(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Hết hạn ngay">
                <Button type="link" size="small" danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo tên nhân viên..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onSearch={onSearch}
            onPressEnter={onSearch}
            allowClear
            onClear={onClearSearch}
            enterButton
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: "100%" }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={onStatusFilterChange}
            allowClear
          >
            <Select.Option value={GrantStatus.Active}>Còn sử dụng</Select.Option>
            <Select.Option value={GrantStatus.Expired}>Hết hạn</Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={grants}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total, range) => (
            <>
              Hiển thị <b>{range[0]}-{range[1]}/{total}</b>
            </>
          ),
          onChange: onPageChange,
        }}
        scroll={{ x: 1100 }}
      />
    </div>
  );
};

export default DutyScheduleView;
