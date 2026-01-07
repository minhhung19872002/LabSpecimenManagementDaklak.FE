import React from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
} from "antd";
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { QualityManagementStatusLabels } from "../../types/qualityManagement";
import HistoryModal from "./components/HistoryModal";
import ChangeApprovalModal from "./components/ChangeApprovalModal";
import { useQualityManagementList } from "./hooks";

const { Title } = Typography;

const QualityManagementList: React.FC = () => {
  const {
    loading,
    tasks,
    statistics,
    statusFilter,
    pagination,
    historyModalVisible,
    selectedTask,
    changeApprovalModalVisible,
    selectedChangeApprovalTaskId,
    columns,
    loadData,
    handleSearch,
    handleStatusFilter,
    handleTableChange,
    handleRowDoubleClick,
    isUrgent,
    closeHistoryModal,
    closeChangeApprovalModal,
  } = useQualityManagementList();

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Quản lý chất lượng
        </Title>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Chờ phê duyệt"
              value={statistics?.pendingApprovalCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Trễ hạn"
              value={statistics?.overdueCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Chờ phát hành"
              value={statistics?.pendingPublishCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="Đã phát hành"
              value={statistics?.publishedCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#13c2c2" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm theo hợp đồng, QLKT..."
              prefix={<SearchOutlined />}
              allowClear
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lọc theo trạng thái"
              allowClear
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              {Object.entries(QualityManagementStatusLabels).map(
                ([key, label]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {label}
                  </Select.Option>
                )
              )}
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            pageSizeOptions: ["20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: "pointer" },
            className: isUrgent(record) ? "urgent-row" : "",
          })}
          size="small"
        />
      </Card>

      {/* History Modal */}
      <HistoryModal
        visible={historyModalVisible}
        task={selectedTask}
        onClose={closeHistoryModal}
      />

      {/* Change Approval Modal */}
      <ChangeApprovalModal
        visible={changeApprovalModalVisible}
        taskId={selectedChangeApprovalTaskId}
        onClose={closeChangeApprovalModal}
        onUpdated={loadData}
      />

      <style>{`
        .urgent-row {
          background-color: #fff2f0 !important;
        }
        .urgent-row:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default QualityManagementList;
