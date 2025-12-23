import React from "react";
import { Card, Button, Space } from "antd";
import { ExperimentOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTestingList } from "./hooks";
import {
  TestingStatistics,
  TestingFilters,
  TestingTable,
} from "./components";

const TestingList: React.FC = () => {
  const {
    // Data
    tasks,
    totalCount,
    stats,
    loading,
    isFetching,
    technicians,
    loadingTechnicians,

    // Filter states
    searchText,
    setSearchText,
    statusFilter,
    technicianFilter,
    activeTab,
    pagination,

    // Handlers
    handleSearch,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
  } = useTestingList();

  return (
    <div>
      <TestingStatistics stats={stats} />

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý xét nghiệm
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
        <TestingFilters
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          technicianFilter={technicianFilter}
          onTechnicianFilterChange={handleTechnicianFilterChange}
          technicians={technicians}
          loadingTechnicians={loadingTechnicians}
        />

        <TestingTable
          tasks={tasks}
          loading={loading || isFetching}
          pagination={pagination}
          totalCount={totalCount}
          onTableChange={handleTableChange}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </Card>

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

export default TestingList;
