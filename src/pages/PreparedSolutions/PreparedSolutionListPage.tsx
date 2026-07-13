import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import {
  PreparedSolutionBatchDto,
  preparedSolutionService,
} from "../../services/preparedSolutionService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { TAB_STATUSES } from "./PreparedSolutions/utils";
import PreparedSolutionListView from "./PreparedSolutions/PreparedSolutionListView";

const PAGE_SIZE = 20;

const PreparedSolutionListPage: React.FC = () => {
  const canCreate = authService.hasPermission(PERMISSIONS.PreparedSolutions.Create);

  const [items, setItems] = useState<PreparedSolutionBatchDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [warningItems, setWarningItems] = useState<PreparedSolutionBatchDto[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreparedSolutionBatchDto | undefined>();
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processItem, setProcessItem] = useState<PreparedSolutionBatchDto | undefined>();

  const loadWarnings = useCallback(async () => {
    try {
      const warnings = await preparedSolutionService.getWarnings();
      setWarningItems(warnings);
    } catch {
      // warnings are non-critical, silently ignore
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const tabInfo = TAB_STATUSES.find((t) => t.key === activeTab);
      const params = {
        page,
        limit: pageSize,
        search: appliedSearch || undefined,
        status: tabInfo?.status,
        isHetOrHetHan: tabInfo?.isHetOrHetHan,
      };
      const result = await preparedSolutionService.getList(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      message.error("Không thể tải danh sách dung dịch");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab, appliedSearch]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadWarnings();
  }, [loadWarnings]);

  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);

  const handleSearch = useCallback(() => {
    setAppliedSearch(search);
    setPage(1);
  }, [search]);

  const handleEdit = useCallback((item: PreparedSolutionBatchDto) => {
    setEditingItem(item);
    setCreateModalOpen(true);
  }, []);

  const handleProcess = useCallback((item: PreparedSolutionBatchDto) => {
    setProcessItem(item);
    setProcessModalOpen(true);
  }, []);

  const handleCreateModalClose = useCallback(() => {
    setCreateModalOpen(false);
    setEditingItem(undefined);
  }, []);

  const handleProcessModalClose = useCallback(() => {
    setProcessModalOpen(false);
    setProcessItem(undefined);
  }, []);

  const handleSaved = useCallback(() => {
    loadList();
    loadWarnings();
  }, [loadList, loadWarnings]);

  const handleProcessed = useCallback(() => {
    loadList();
    loadWarnings();
    message.success("Đã xử lý dung dịch thành công");
  }, [loadList, loadWarnings]);

  return (
    <PreparedSolutionListView
      warningItems={warningItems}
      search={search}
      onSearchChange={setSearch}
      onSearch={handleSearch}
      canCreate={canCreate}
      onCreate={() => setCreateModalOpen(true)}
      items={items}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      loading={loading}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onPageChange={handlePageChange}
      onEdit={handleEdit}
      onProcess={handleProcess}
      createModalOpen={createModalOpen}
      editingItem={editingItem}
      onCreateModalClose={handleCreateModalClose}
      onSaved={handleSaved}
      processModalOpen={processModalOpen}
      processItem={processItem}
      onProcessModalClose={handleProcessModalClose}
      onProcessed={handleProcessed}
    />
  );
};

export default PreparedSolutionListPage;
