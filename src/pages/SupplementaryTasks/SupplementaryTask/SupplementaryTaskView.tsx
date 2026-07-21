import React from "react";
import { Button, Card, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  CompleteSupplementaryTaskDto,
  CreateSupplementaryTaskDto,
  SupplementaryTaskDto,
  SupplementaryTaskPriority,
  SupplementaryTaskStatsDto,
  UpdateSupplementaryTaskDto,
} from "../../../services/supplementaryTaskService";
import Icon from "../../../components/common/Icon";
import SupplementaryTaskToolbar from "./SupplementaryTaskToolbar";
import SupplementaryTaskTable from "./SupplementaryTaskTable";
import SupplementaryTaskModal from "./SupplementaryTaskModal";
import SupplementaryTaskCancelModal from "./SupplementaryTaskCancelModal";
import SupplementaryTaskCompleteModal from "./SupplementaryTaskCompleteModal";
import SupplementaryTaskRejectModal from "./SupplementaryTaskRejectModal";
import SupplementaryTaskHistoryModal from "./SupplementaryTaskHistoryModal";
import SupplementaryTaskDetailModal from "./SupplementaryTaskDetailModal";
import "../../Dashboard/Dashboard.css";
import "../../../styles/ListCard.css";
import "../SupplementaryTask.css";

const { Text } = Typography;

export interface SupplementaryTaskViewProps {
  items: SupplementaryTaskDto[];
  loading: boolean;
  statsLoading: boolean;
  totalCount: number;
  stats: SupplementaryTaskStatsDto;
  page: number;
  pageSize: number;
  searchInput: string;
  priority?: SupplementaryTaskPriority;
  assignedToId?: string;
  activeTab: string;
  employeeOptions: { label: string; value: string }[];
  modalOpen: boolean;
  editingItem?: SupplementaryTaskDto;
  cancelModalOpen: boolean;
  cancellingItem?: SupplementaryTaskDto;
  cancelling: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onTabChange: (tab: string) => void;
  onSearchInputChange: (val: string) => void;
  onSearch: (val: string) => void;
  onPriorityChange: (val?: SupplementaryTaskPriority) => void;
  onAssignedToChange: (val?: string) => void;
  onCreateClick: () => void;
  onEditClick: (item: SupplementaryTaskDto) => void;
  onCancelClick: (item: SupplementaryTaskDto) => void;
  onCancelConfirm: () => void;
  onCancelModalClose: () => void;
  sortField?: "dueDate" | "creationTime";
  sortDescending?: boolean;
  onSortChange: (field: "dueDate" | "creationTime", descending: boolean) => void;
  onCompleteClick: (item: SupplementaryTaskDto) => void;
  completeModalOpen: boolean;
  completingItem?: SupplementaryTaskDto;
  completing: boolean;
  onCompleteConfirm: (id: string, input: CompleteSupplementaryTaskDto) => Promise<void>;
  onCompleteModalClose: () => void;
  onApprove: (item: SupplementaryTaskDto) => void;
  onRejectClick: (item: SupplementaryTaskDto) => void;
  rejectModalOpen: boolean;
  rejectingItem?: SupplementaryTaskDto;
  rejecting: boolean;
  onRejectConfirm: (id: string, reason: string) => Promise<void>;
  onRejectModalClose: () => void;
  onViewHistory: (item: SupplementaryTaskDto) => void;
  historyModalOpen: boolean;
  historyItem?: SupplementaryTaskDto;
  onHistoryModalClose: () => void;
  onRowDoubleClick: (item: SupplementaryTaskDto) => void;
  detailModalOpen: boolean;
  detailItem?: SupplementaryTaskDto;
  onDetailModalClose: () => void;
  onModalClose: () => void;
  onSaved: () => void;
  onCreate: (input: CreateSupplementaryTaskDto) => Promise<void>;
  onUpdate: (id: string, input: UpdateSupplementaryTaskDto) => Promise<void>;
}

const STAT_CARDS = [
  {
    tabKey: "all",
    title: "Tổng công việc",
    iconBg: "contract",
    icon: "check2-square",
    valueColor: undefined,
    getValue: (s: SupplementaryTaskStatsDto) => s.total,
  },
  {
    tabKey: "pending",
    title: "Chờ xử lý",
    iconBg: "blue",
    icon: "clock",
    valueColor: "#1677ff",
    getValue: (s: SupplementaryTaskStatsDto) => s.pending,
  },
  {
    tabKey: "waitingForConfirmation",
    title: "Chờ xác nhận",
    iconBg: "yellow",
    icon: "hourglass",
    valueColor: "#faad14",
    getValue: (s: SupplementaryTaskStatsDto) => s.waitingForConfirmation,
  },
  {
    tabKey: "completed",
    title: "Hoàn thành",
    iconBg: "green",
    icon: "check-circle",
    valueColor: "#52c41a",
    getValue: (s: SupplementaryTaskStatsDto) => s.completed,
  },
  {
    tabKey: "overdue",
    title: "Quá hạn",
    iconBg: "red",
    icon: "exclamation-circle",
    valueColor: "#f5222d",
    getValue: (s: SupplementaryTaskStatsDto) => s.overdue,
  },
];

const SupplementaryTaskView: React.FC<SupplementaryTaskViewProps> = (props) => {
  const { stats, statsLoading, activeTab } = props;

  return (
    <div>
      {/* Stat Cards */}
      <div className="dashboard-stats-grid supplementary-stats-grid">
        {STAT_CARDS.map((card) => {
          const isActive = activeTab === card.tabKey;
          const value = card.getValue(stats);
          return (
            <Card
              key={card.tabKey}
              className={`dashboard-stat-card supplementary-stat-clickable${isActive ? " supplementary-stat-active" : ""}`}
              bordered={false}
              onClick={() => props.onTabChange(card.tabKey)}
            >
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{card.title}</Text>
                  <div
                    className="dashboard-stat-value"
                    style={
                      card.valueColor
                        ? {
                            background: "none",
                            WebkitBackgroundClip: "unset",
                            WebkitTextFillColor: card.valueColor,
                            backgroundClip: "unset",
                            color: card.valueColor,
                          }
                        : undefined
                    }
                  >
                    {statsLoading ? "—" : value}
                  </div>
                </div>
                <div className={`dashboard-stat-icon ${card.iconBg}`}>
                  <Icon name={card.icon} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main card */}
      <Card
        className="list-card"
        title={
          <Space>
            <Icon name="check2-square" />
            Công việc bổ sung
          </Space>
        }
        extra={
          stats.isDirector && (
            <Button type="primary" icon={<PlusOutlined />} onClick={props.onCreateClick}>
              Giao công việc
            </Button>
          )
        }
        styles={{ body: { padding: 0 } }}
      >
        <SupplementaryTaskToolbar
          searchInput={props.searchInput}
          activeTab={props.activeTab}
          priority={props.priority}
          assignedToId={props.assignedToId}
          isDirector={stats.isDirector}
          employeeOptions={props.employeeOptions}
          onSearchInputChange={props.onSearchInputChange}
          onSearch={props.onSearch}
          onTabChange={props.onTabChange}
          onPriorityChange={props.onPriorityChange}
          onAssignedToChange={props.onAssignedToChange}
        />

        <SupplementaryTaskTable
          items={props.items}
          loading={props.loading}
          totalCount={props.totalCount}
          page={props.page}
          pageSize={props.pageSize}
          isDirector={stats.isDirector}
          sortField={props.sortField}
          sortDescending={props.sortDescending}
          onPageChange={props.onPageChange}
          onSortChange={props.onSortChange}
          onEdit={props.onEditClick}
          onCancel={props.onCancelClick}
          onComplete={props.onCompleteClick}
          onApprove={props.onApprove}
          onReject={props.onRejectClick}
          onViewHistory={props.onViewHistory}
          onRowDoubleClick={props.onRowDoubleClick}
        />
      </Card>

      <SupplementaryTaskModal
        open={props.modalOpen}
        editingItem={props.editingItem}
        employeeOptions={props.employeeOptions}
        onClose={props.onModalClose}
        onSaved={props.onSaved}
        onCreate={props.onCreate}
        onUpdate={props.onUpdate}
      />

      <SupplementaryTaskCancelModal
        open={props.cancelModalOpen}
        item={props.cancellingItem}
        loading={props.cancelling}
        onConfirm={props.onCancelConfirm}
        onClose={props.onCancelModalClose}
      />

      <SupplementaryTaskCompleteModal
        open={props.completeModalOpen}
        item={props.completingItem}
        completing={props.completing}
        onConfirm={props.onCompleteConfirm}
        onClose={props.onCompleteModalClose}
      />

      <SupplementaryTaskRejectModal
        open={props.rejectModalOpen}
        item={props.rejectingItem}
        rejecting={props.rejecting}
        onConfirm={props.onRejectConfirm}
        onClose={props.onRejectModalClose}
      />

      <SupplementaryTaskHistoryModal
        open={props.historyModalOpen}
        item={props.historyItem}
        onClose={props.onHistoryModalClose}
      />

      <SupplementaryTaskDetailModal
        open={props.detailModalOpen}
        item={props.detailItem}
        isDirector={stats.isDirector}
        onClose={props.onDetailModalClose}
        onComplete={props.onCompleteClick}
        onApprove={props.onApprove}
        onReject={props.onRejectClick}
      />
    </div>
  );
};

export default SupplementaryTaskView;
