import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message, Modal } from "antd";
import {
  CompleteSupplementaryTaskDto,
  CreateSupplementaryTaskDto,
  SupplementaryTaskDto,
  SupplementaryTaskPriority,
  SupplementaryTaskStatsDto,
  UpdateSupplementaryTaskDto,
  supplementaryTaskService,
} from "../../services/supplementaryTaskService";
import { employeeService } from "../../services/employeeService";
import { TAB_STATUS_OPTIONS } from "./SupplementaryTask/utils";
import SupplementaryTaskView from "./SupplementaryTask/SupplementaryTaskView";

const EMPTY_STATS: SupplementaryTaskStatsDto = {
  total: 0, pending: 0, overdue: 0, completed: 0, waitingForConfirmation: 0, rejected: 0, cancelled: 0, isDirector: false,
};

const SupplementaryTaskPage: React.FC = () => {
  const [items, setItems] = useState<SupplementaryTaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<SupplementaryTaskStatsDto>(EMPTY_STATS);
  const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string }[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<SupplementaryTaskPriority | undefined>();
  const [assignedToId, setAssignedToId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState<"dueDate" | "creationTime" | undefined>("dueDate");
  const [sortDescending, setSortDescending] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplementaryTaskDto | undefined>();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingItem, setCancellingItem] = useState<SupplementaryTaskDto | undefined>();
  const [cancelling, setCancelling] = useState(false);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingItem, setCompletingItem] = useState<SupplementaryTaskDto | undefined>();
  const [completing, setCompleting] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<SupplementaryTaskDto | undefined>();
  const [rejecting, setRejecting] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<SupplementaryTaskDto | undefined>();

  const activeStatus = useMemo(() => {
    const tab = TAB_STATUS_OPTIONS.find((t) => t.key === activeTab);
    return tab?.status;
  }, [activeTab]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplementaryTaskService.getList({
        search: search || undefined,
        priority,
        assignedToId,
        status: activeStatus,
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
        sortField,
        sortDescending,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch {
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  }, [search, priority, assignedToId, activeStatus, page, pageSize, sortField, sortDescending]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await supplementaryTaskService.getStats();
      setStats(s);
    } catch {
      // stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    employeeService.getList({ isActive: true, maxResultCount: 200 }).then((res) => {
      setEmployeeOptions((res.items ?? []).map((e) => ({ label: e.fullName || e.username, value: e.id })));
    }).catch(() => {});
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const handleSearchInputChange = useCallback((val: string) => {
    setSearchInput(val);
    if (val === "") {
      setSearch("");
      setPage(1);
    }
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handlePriorityChange = useCallback((val?: SupplementaryTaskPriority) => {
    setPriority(val);
    setPage(1);
  }, []);

  const handleAssignedToChange = useCallback((val?: string) => {
    setAssignedToId(val);
    setPage(1);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingItem(undefined);
    setModalOpen(true);
  }, []);

  const handleEditClick = useCallback((item: SupplementaryTaskDto) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingItem(undefined);
  }, []);

  const handleSaved = useCallback(() => {
    fetchList();
    fetchStats();
  }, [fetchList, fetchStats]);

  const handleCreate = useCallback(async (input: CreateSupplementaryTaskDto) => {
    await supplementaryTaskService.create(input);
    message.success("Đã tạo công việc thành công");
  }, []);

  const handleUpdate = useCallback(async (id: string, input: UpdateSupplementaryTaskDto) => {
    await supplementaryTaskService.update(id, input);
    message.success("Đã cập nhật công việc thành công");
  }, []);

  const handleCancelClick = useCallback((item: SupplementaryTaskDto) => {
    setCancellingItem(item);
    setCancelModalOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancellingItem) return;
    setCancelling(true);
    try {
      await supplementaryTaskService.cancel(cancellingItem.id);
      message.success("Đã hủy công việc");
      setCancelModalOpen(false);
      setCancellingItem(undefined);
      fetchList();
      fetchStats();
    } catch {
      message.error("Không thể hủy công việc");
    } finally {
      setCancelling(false);
    }
  }, [cancellingItem, fetchList, fetchStats]);

  const handleCancelModalClose = useCallback(() => {
    setCancelModalOpen(false);
    setCancellingItem(undefined);
  }, []);

  const handleCompleteClick = useCallback((item: SupplementaryTaskDto) => {
    setCompletingItem(item);
    setCompleteModalOpen(true);
  }, []);

  const handleCompleteConfirm = useCallback(async (id: string, input: CompleteSupplementaryTaskDto) => {
    setCompleting(true);
    try {
      await supplementaryTaskService.complete(id, input);
      message.success("Đã gửi xác nhận, đang chờ phê duyệt");
      setCompleteModalOpen(false);
      setCompletingItem(undefined);
      fetchList();
      fetchStats();
    } catch {
      message.error("Không thể cập nhật trạng thái");
    } finally {
      setCompleting(false);
    }
  }, [fetchList, fetchStats]);

  const handleCompleteModalClose = useCallback(() => {
    setCompleteModalOpen(false);
    setCompletingItem(undefined);
  }, []);

  const handleApprove = useCallback((item: SupplementaryTaskDto) => {
    Modal.confirm({
      title: "Xác nhận hoàn thành",
      content: `Bạn có chắc chắn công việc "${item.title}" đã hoàn thành?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await supplementaryTaskService.approve(item.id);
          message.success("Đã xác nhận hoàn thành");
          fetchList();
          fetchStats();
        } catch {
          message.error("Không thể xác nhận hoàn thành");
        }
      },
    });
  }, [fetchList, fetchStats]);

  const handleRejectClick = useCallback((item: SupplementaryTaskDto) => {
    setRejectingItem(item);
    setRejectModalOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async (id: string, reason: string) => {
    setRejecting(true);
    try {
      await supplementaryTaskService.reject(id, { reason });
      message.success("Đã từ chối");
      setRejectModalOpen(false);
      setRejectingItem(undefined);
      fetchList();
      fetchStats();
    } catch {
      message.error("Không thể từ chối");
    } finally {
      setRejecting(false);
    }
  }, [fetchList, fetchStats]);

  const handleRejectModalClose = useCallback(() => {
    setRejectModalOpen(false);
    setRejectingItem(undefined);
  }, []);

  const handleViewHistory = useCallback((item: SupplementaryTaskDto) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
  }, []);

  const handleHistoryModalClose = useCallback(() => {
    setHistoryModalOpen(false);
    setHistoryItem(undefined);
  }, []);

  const handleSortChange = useCallback((field: "dueDate" | "creationTime", descending: boolean) => {
    setSortField(field);
    setSortDescending(descending);
    setPage(1);
  }, []);

  return (
    <SupplementaryTaskView
      items={items}
      loading={loading}
      statsLoading={statsLoading}
      totalCount={totalCount}
      stats={stats}
      page={page}
      pageSize={pageSize}
      searchInput={searchInput}
      priority={priority}
      assignedToId={assignedToId}
      activeTab={activeTab}
      employeeOptions={employeeOptions}
      modalOpen={modalOpen}
      editingItem={editingItem}
      cancelModalOpen={cancelModalOpen}
      cancellingItem={cancellingItem}
      cancelling={cancelling}
      sortField={sortField}
      sortDescending={sortDescending}
      onPageChange={handlePageChange}
      onSortChange={handleSortChange}
      onTabChange={handleTabChange}
      onSearchInputChange={handleSearchInputChange}
      onSearch={handleSearch}
      onPriorityChange={handlePriorityChange}
      onAssignedToChange={handleAssignedToChange}
      onCreateClick={handleCreateClick}
      onEditClick={handleEditClick}
      onCancelClick={handleCancelClick}
      onCancelConfirm={handleCancelConfirm}
      onCancelModalClose={handleCancelModalClose}
      onCompleteClick={handleCompleteClick}
      completeModalOpen={completeModalOpen}
      completingItem={completingItem}
      completing={completing}
      onCompleteConfirm={handleCompleteConfirm}
      onCompleteModalClose={handleCompleteModalClose}
      onApprove={handleApprove}
      onRejectClick={handleRejectClick}
      rejectModalOpen={rejectModalOpen}
      rejectingItem={rejectingItem}
      rejecting={rejecting}
      onRejectConfirm={handleRejectConfirm}
      onRejectModalClose={handleRejectModalClose}
      onViewHistory={handleViewHistory}
      historyModalOpen={historyModalOpen}
      historyItem={historyItem}
      onHistoryModalClose={handleHistoryModalClose}
      onModalClose={handleModalClose}
      onSaved={handleSaved}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    />
  );
};

export default SupplementaryTaskPage;
