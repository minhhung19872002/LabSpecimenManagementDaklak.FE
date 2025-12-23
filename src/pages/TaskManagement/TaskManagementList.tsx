import React from "react";
import { Card, Button, Space } from "antd";
import { ExperimentOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTaskManagementList } from "./hooks";
import {
  TaskStatistics,
  TaskFilters,
  TaskTable,
  TaskUpdateModal,
} from "./components";

const TaskManagementList: React.FC = () => {
  const {
    // Data
    tasks,
    totalCount,
    stats,
    loading,
    isFetching,
    isUpdating,
    isDeleting,

    // Filter states
    searchText,
    setSearchText,
    statusFilter,
    pagination,

    // Modal states
    updateModalVisible,
    selectedTask,
    updateForm,

    // Handlers
    handleSearch,
    handleStatusFilterChange,
    handleTableChange,
    handleRefresh,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateTask,
    handleDelete,
    handleRowDoubleClick,
  } = useTaskManagementList();

  return (
    <div>
      <TaskStatistics stats={stats} />

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý công việc khoa phòng
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isFetching}
          >
            Làm mới
          </Button>
        }
      >
        <TaskFilters
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />

        <TaskTable
          tasks={tasks}
          loading={loading || isFetching}
          pagination={pagination}
          totalCount={totalCount}
          isDeleting={isDeleting}
          onTableChange={handleTableChange}
          onRowDoubleClick={handleRowDoubleClick}
          onEdit={handleOpenUpdateModal}
          onDelete={handleDelete}
        />
      </Card>

      <TaskUpdateModal
        visible={updateModalVisible}
        selectedTask={selectedTask}
        form={updateForm}
        isUpdating={isUpdating}
        onCancel={handleCloseUpdateModal}
        onOk={handleUpdateTask}
      />

      <style>{`
        .urgent-row > td {
          background-color: #fff2f0 !important;
        }
        .urgent-row:hover > td {
          background-color: #ffebe8 !important;
        }
      `}</style>
    </div>
  );
};

export default TaskManagementList;
