import React from "react";
import { Card, Table, Button, Space, Input } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useUserList } from "./hooks";
import { UserFormModal } from "./components";

const UserList: React.FC = () => {
  const {
    data,
    departments,
    loading,
    searchText,
    isModalOpen,
    editingItem,
    form,
    columns,
    handleSearchChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    loadData,
  } = useUserList();

  return (
    <div>
      <Card
        title="Quản lý người dùng"
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm người dùng
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <UserFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        departments={departments}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default UserList;
