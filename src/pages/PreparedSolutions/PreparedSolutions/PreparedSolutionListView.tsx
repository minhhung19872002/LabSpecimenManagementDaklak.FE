import React from "react";
import { Button, Card, Col, Input, Radio, Row, Space } from "antd";
import { ExperimentOutlined, PlusOutlined } from "@ant-design/icons";
import { PreparedSolutionBatchDto } from "../../../services/preparedSolutionService";
import { TAB_STATUSES } from "./utils";
import PreparedSolutionWarningBanner from "./PreparedSolutionWarningBanner";
import PreparedSolutionTable from "./PreparedSolutionTable";
import PreparedSolutionCreateModal from "./PreparedSolutionCreateModal";
import PreparedSolutionProcessModal from "./PreparedSolutionProcessModal";
import "../../../styles/ListCard.css";

export interface PreparedSolutionListViewProps {
  warningItems: PreparedSolutionBatchDto[];
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  canCreate: boolean;
  onCreate: () => void;
  items: PreparedSolutionBatchDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (item: PreparedSolutionBatchDto) => void;
  onProcess: (item: PreparedSolutionBatchDto) => void;
  onRowDoubleClick: (item: PreparedSolutionBatchDto) => void;
  createModalOpen: boolean;
  editingItem?: PreparedSolutionBatchDto;
  onCreateModalClose: () => void;
  onSaved: () => void;
  processModalOpen: boolean;
  processItem?: PreparedSolutionBatchDto;
  onProcessModalClose: () => void;
  onProcessed: () => void;
}

const PreparedSolutionListView: React.FC<PreparedSolutionListViewProps> = ({
  warningItems,
  search,
  onSearchChange,
  onSearch,
  canCreate,
  onCreate,
  items,
  totalCount,
  page,
  pageSize,
  loading,
  activeTab,
  onTabChange,
  onPageChange,
  onEdit,
  onProcess,
  onRowDoubleClick,
  createModalOpen,
  editingItem,
  onCreateModalClose,
  onSaved,
  processModalOpen,
  processItem,
  onProcessModalClose,
  onProcessed,
}) => (
  <div style={{ padding: 16 }}>
    <PreparedSolutionWarningBanner items={warningItems} />

    <Card
      className="list-card"
      title={
        <Space>
          <ExperimentOutlined />
          Danh sách dung dịch đã pha
        </Space>
      }
      extra={
        canCreate && (
          <Button icon={<PlusOutlined />} onClick={onCreate}>
            Tạo phiếu pha
          </Button>
        )
      }
      styles={{ body: { padding: 0 } }}
    >
      {/* Tab navigation — pill style matching project standard */}
      <div className="statistics-detail-tabs" style={{ padding: "16px 16px 0" }}>
        <Radio.Group
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          optionType="button"
        >
          {TAB_STATUSES.map((t) => (
            <Radio.Button key={t.key} value={t.key}>
              {t.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
      <div style={{ borderBottom: "1px solid #f0f0f0" }} />

      {/* Search bar */}
      <Row gutter={[16, 0]} style={{ padding: "12px 16px" }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm theo tên dung dịch, mã lô..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearch}
            allowClear
            enterButton
          />
        </Col>
      </Row>

      {/* Table */}
      <PreparedSolutionTable
        items={items}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onProcess={onProcess}
        onRowDoubleClick={onRowDoubleClick}
      />
    </Card>

    <PreparedSolutionCreateModal
      open={createModalOpen}
      editingItem={editingItem}
      onClose={onCreateModalClose}
      onSaved={onSaved}
    />
    <PreparedSolutionProcessModal
      open={processModalOpen}
      item={processItem}
      onClose={onProcessModalClose}
      onProcessed={onProcessed}
    />
  </div>
);

export default PreparedSolutionListView;
