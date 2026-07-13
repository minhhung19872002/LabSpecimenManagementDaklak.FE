import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import {
  CreateSupplementaryTaskDto,
  SupplementaryTaskDto,
  SupplementaryTaskPriority,
  SupplementaryTaskStatsDto,
  SupplementaryTaskStatus,
  UpdateSupplementaryTaskDto,
  supplementaryTaskService,
} from "../../services/supplementaryTaskService";
import { employeeService } from "../../services/employeeService";
import { TAB_STATUS_OPTIONS } from "./SupplementaryTask/utils";
import SupplementaryTaskView from "./SupplementaryTask/SupplementaryTaskView";

const EMPTY_STATS: SupplementaryTaskStatsDto = {
  total: 0, pending: 0, overdue: 0, completed: 0, isDirector: false,
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplementaryTaskDto | undefined>();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingItem, setCancellingItem] = useState<SupplementaryTaskDto | undefined>();
  const [cancelling, setCancelling] = useState(false);

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
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch {
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  }, [search, priority, assignedToId, activeStatus, page, pageSize]);

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

  const handleCompleteClick = useCallback(async (item: SupplementaryTaskDto) => {
    try {
      await supplementaryTaskService.complete(item.id);
      message.success("Đã xác nhận hoàn thành");
      fetchList();
      fetchStats();
    } catch {
      message.error("Không thể cập nhật trạng thái");
    }
  }, [fetchList, fetchStats]);

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
      onPageChange={handlePageChange}
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
      onModalClose={handleModalClose}
      onSaved={handleSaved}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    />
  );
};

export default SupplementaryTaskPage;
