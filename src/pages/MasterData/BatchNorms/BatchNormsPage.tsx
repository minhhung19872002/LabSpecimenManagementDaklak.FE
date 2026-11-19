import { forwardRef, useCallback, useDeferredValue, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { message } from "antd";
import {
  batchNormService,
  type BatchNormOverviewDto,
  type ServiceBatchNormDto,
} from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import BatchNormsView from "./BatchNorms/BatchNormsView";
import type { DeleteNormTarget } from "./BatchNorms/DeleteNormConfirm";
import type { UndoToastData } from "./BatchNorms/UndoToast";
import { ALL_SPECIMEN_NAME, type FoldState } from "../ServiceCatalog/ServiceCatalog/utils";
import {
  NO_CATEGORY_NAME,
  applyAddMethodTab,
  applyStatusFilter,
  buildAddMethodOptions,
  buildCategoryOptions,
  buildNormGroups,
  buildNormMethodOptions,
  buildSpecimenFilterOptions,
  exportNormsToExcel,
  filterAddMethodOptions,
  filterNorms,
  groupCandidates,
  indicatorBlockKeyOf,
  methodNameOf,
  type AddMethodTab,
  type AddMethodTarget,
  type NormIndicatorBlock,
  type NormStatusFilter,
} from "./BatchNorms/utils";

/** Nút trên header trang Danh mục gọi vào L3 */
export interface BatchNormsActions {
  exportExcel: () => void;
  /** Thêm định mức — chờ task sau */
  openCreate: () => void;
}

type UndoAction = { type: "add"; ids: string[] } | { type: "delete"; id: string };

const EMPTY_OVERVIEW: BatchNormOverviewDto = { norms: [], candidates: [] };
const TOAST_MS = 8000;

const categoryNameOf = (n: ServiceBatchNormDto) =>
  n.specimenTypeId == null ? ALL_SPECIMEN_NAME : n.sampleTypeCategoryName || NO_CATEGORY_NAME;

const blockKeyOfNorm = (n: ServiceBatchNormDto) => indicatorBlockKeyOf(n.specimenTypeId, n.indicatorId);

/** Container L3 — Định mức theo mẻ (theo dịch vụ = nền mẫu × chỉ tiêu × phương pháp) */
const BatchNormsPage = forwardRef<BatchNormsActions>(function BatchNormsPage(_props, ref) {
  const [overview, setOverview] = useState<BatchNormOverviewDto>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const [categoryKey, setCategoryKey] = useState<string>();
  const [specimenKey, setSpecimenKey] = useState<string>();
  const [testMethodId, setTestMethodId] = useState<string>();
  const [status, setStatus] = useState<NormStatusFilter>("all");
  const [fold, setFold] = useState<FoldState>({});
  const [more, setMore] = useState<FoldState>({});
  const [allOpen, setAllOpen] = useState(true);
  /** Bộ lọc lúc bấm "Thu gọn tất cả" — lọc khác đi thì lại tự mở để thấy kết quả */
  const [collapsedFilterSig, setCollapsedFilterSig] = useState<string | null>(null);

  const [addTarget, setAddTarget] = useState<AddMethodTarget | null>(null);
  const [addSelected, setAddSelected] = useState<ReadonlySet<string>>(new Set());
  const [addKeyword, setAddKeyword] = useState("");
  const [addTab, setAddTab] = useState<AddMethodTab>("free");
  const [addTried, setAddTried] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteNormTarget | null>(null);
  const [toast, setToast] = useState<UndoToastData | null>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setOverview(await batchNormService.getOverview());
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được danh sách định mức"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const { norms } = overview;
  const candidatesByKey = useMemo(() => groupCandidates(overview.candidates), [overview.candidates]);

  const baseNorms = useMemo(
    () => filterNorms(norms, { keyword: deferredKeyword, categoryKey, specimenKey, testMethodId }),
    [norms, deferredKeyword, categoryKey, specimenKey, testMethodId]
  );
  const statusCounts = useMemo(() => {
    const on = baseNorms.filter((n) => n.isActive).length;
    return { all: baseNorms.length, on, off: baseNorms.length - on };
  }, [baseNorms]);
  const cards = useMemo(
    () => buildNormGroups(applyStatusFilter(baseNorms, status), candidatesByKey),
    [baseNorms, status, candidatesByKey]
  );
  const totals = useMemo(() => {
    const specimens = cards.flatMap((c) => c.specimens);
    return {
      specimenCount: specimens.length,
      indicatorCount: specimens.reduce((sum, s) => sum + s.indicatorCount, 0),
      normCount: cards.reduce((sum, c) => sum + c.normCount, 0),
    };
  }, [cards]);

  const categoryOptions = useMemo(() => buildCategoryOptions(norms), [norms]);
  const specimenOptions = useMemo(() => buildSpecimenFilterOptions(norms, categoryKey), [norms, categoryKey]);
  const methodOptions = useMemo(() => buildNormMethodOptions(norms), [norms]);

  const hasFilter = Boolean(keyword.trim() || categoryKey || specimenKey || testMethodId || status !== "all");
  const filterSig = [deferredKeyword.trim(), categoryKey, specimenKey, testMethodId, status].join("|");
  const filtered = hasFilter && filterSig !== collapsedFilterSig;

  const clearFilter = useCallback(() => {
    setKeyword("");
    setCategoryKey(undefined);
    setSpecimenKey(undefined);
    setTestMethodId(undefined);
    setStatus("all");
  }, []);

  const handleCategoryChange = useCallback((value?: string) => {
    setCategoryKey(value);
    setSpecimenKey(undefined);
  }, []);

  const handleToggle = useCallback((key: string, open: boolean) => setFold((prev) => ({ ...prev, [key]: open })), []);
  const handleToggleMore = useCallback(
    (key: string, expanded: boolean) => setMore((prev) => ({ ...prev, [key]: expanded })),
    []
  );
  const handleExpandAll = useCallback(() => {
    setAllOpen(true);
    setCollapsedFilterSig(null);
    setFold({});
  }, []);
  const handleCollapseAll = useCallback(() => {
    setAllOpen(false);
    setCollapsedFilterSig(filterSig);
    setFold({});
  }, [filterSig]);

  const showToast = useCallback((text: string, undo: UndoAction | null) => {
    setUndoAction(undo);
    setToast({ key: Date.now(), text, canUndo: undo != null });
  }, []);

  const handleToggleActive = useCallback(async (id: string) => {
    try {
      const updated = await batchNormService.toggleServiceActive(id);
      setOverview((prev) => ({
        ...prev,
        norms: prev.norms.map((n) => (n.id === id ? { ...n, isActive: updated.isActive } : n)),
      }));
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không đổi được trạng thái sử dụng"));
    }
  }, []);

  const loadMaterials = useCallback(
    async (testMethodIndicatorId: string) => batchNormService.getByService(testMethodIndicatorId),
    []
  );

  // ===== Xóa =====
  const handleDelete = useCallback(
    (norm: ServiceBatchNormDto) => {
      const key = blockKeyOfNorm(norm);
      setDeleteTarget({
        id: norm.id,
        indicatorName: norm.indicatorName || norm.indicatorCode || "—",
        methodName: methodNameOf(norm),
        categoryName: categoryNameOf(norm),
        specimenName: norm.specimenTypeName || ALL_SPECIMEN_NAME,
        materialCount: norm.materialCount,
        equipmentCount: norm.equipmentCount,
        isLast: norms.filter((n) => blockKeyOfNorm(n) === key).length === 1,
      });
    },
    [norms]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await batchNormService.deleteService(deleteTarget.id);
      setDeleteTarget(null);
      showToast(`Đã xóa phương pháp ${deleteTarget.methodName} của ${deleteTarget.indicatorName}`, {
        type: "delete",
        id: deleteTarget.id,
      });
      await load(true);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không xóa được phương pháp"));
    }
  }, [deleteTarget, load, showToast]);

  // ===== Thêm phương pháp =====
  const handleAddMethod = useCallback((block: NormIndicatorBlock) => {
    const first = block.norms[0];
    if (!first) return;
    setAddTarget({
      key: block.key,
      specimenTypeId: first.specimenTypeId ?? null,
      specimenName: first.specimenTypeName || ALL_SPECIMEN_NAME,
      categoryName: categoryNameOf(first),
      indicatorId: block.indicatorId,
      indicatorName: block.indicatorName,
    });
    setAddSelected(new Set());
    setAddKeyword("");
    setAddTab("free");
    setAddTried(false);
  }, []);

  const addAllOptions = useMemo(
    () => (addTarget ? buildAddMethodOptions(addTarget, norms, candidatesByKey) : []),
    [addTarget, norms, candidatesByKey]
  );
  const addKeywordOptions = useMemo(() => filterAddMethodOptions(addAllOptions, addKeyword), [addAllOptions, addKeyword]);
  const addOptions = useMemo(() => applyAddMethodTab(addKeywordOptions, addTab), [addKeywordOptions, addTab]);
  const addTabCounts = useMemo(() => {
    const has = addKeywordOptions.filter((o) => o.has).length;
    return { free: addKeywordOptions.length - has, has, all: addKeywordOptions.length };
  }, [addKeywordOptions]);
  const addVisibleFreeIds = useMemo(
    () => addOptions.filter((o) => !o.has).map((o) => o.testMethodIndicatorId),
    [addOptions]
  );

  const handleAddToggleSelect = useCallback((id: string) => {
    setAddSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddSelectAll = useCallback((ids: string[], select: boolean) => {
    setAddSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const closeAdd = useCallback(() => setAddTarget(null), []);

  const handleAddSubmit = useCallback(async () => {
    if (!addTarget) return;
    if (addSelected.size === 0) {
      setAddTried(true);
      return;
    }
    try {
      const added = await batchNormService.addServices([...addSelected]);
      setAddTarget(null);
      showToast(`Đã thêm ${added.length} phương pháp cho ${addTarget.indicatorName} – chờ khai báo định mức`, {
        type: "add",
        ids: added.map((n) => n.id),
      });
      await load(true);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thêm được phương pháp"));
      await load(true);
    }
  }, [addTarget, addSelected, load, showToast]);

  // ===== Hoàn tác =====
  const handleUndo = useCallback(async () => {
    if (!undoAction) return;
    try {
      if (undoAction.type === "delete") {
        await batchNormService.restoreService(undoAction.id);
      } else {
        await Promise.all(undoAction.ids.map((id) => batchNormService.deleteService(id)));
      }
      showToast("Đã hoàn tác", null);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không hoàn tác được"));
    }
    await load(true);
  }, [undoAction, load, showToast]);

  const closeToast = useCallback(() => setToast(null), []);

  useImperativeHandle(
    ref,
    () => ({
      exportExcel: () => {
        if (cards.length === 0) {
          message.info("Không có định mức để xuất");
          return;
        }
        exportNormsToExcel(cards);
      },
      openCreate: () => undefined,
    }),
    [cards]
  );

  return (
    <BatchNormsView
      loading={loading}
      isEmpty={norms.length === 0}
      toolbar={{
        keyword,
        categoryKey,
        specimenKey,
        testMethodId,
        status,
        categoryOptions,
        specimenOptions,
        methodOptions,
        statusCounts,
        hasFilter,
        onKeywordChange: setKeyword,
        onCategoryChange: handleCategoryChange,
        onSpecimenChange: setSpecimenKey,
        onTestMethodChange: setTestMethodId,
        onStatusChange: setStatus,
        onClearFilter: clearFilter,
      }}
      cards={cards}
      specimenCount={totals.specimenCount}
      indicatorCount={totals.indicatorCount}
      normCount={totals.normCount}
      fold={fold}
      more={more}
      allOpen={allOpen}
      filtered={filtered}
      keyword={deferredKeyword}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      onToggle={handleToggle}
      onToggleMore={handleToggleMore}
      onExpandAll={handleExpandAll}
      onCollapseAll={handleCollapseAll}
      onAddMethod={handleAddMethod}
      onToggleActive={handleToggleActive}
      onDelete={handleDelete}
      loadMaterials={loadMaterials}
      addModal={{
        target: addTarget,
        options: addOptions,
        tabCounts: addTabCounts,
        existingCount: addAllOptions.filter((o) => o.has).length,
        visibleFreeIds: addVisibleFreeIds,
        selected: addSelected,
        keyword: addKeyword,
        tab: addTab,
        tried: addTried,
        onKeywordChange: setAddKeyword,
        onTabChange: setAddTab,
        onToggleSelect: handleAddToggleSelect,
        onSelectAll: handleAddSelectAll,
        onSubmit: handleAddSubmit,
        onCancel: closeAdd,
      }}
      deleteConfirm={{
        target: deleteTarget,
        onConfirm: handleConfirmDelete,
        onCancel: () => setDeleteTarget(null),
      }}
      toast={{ toast, onUndo: handleUndo, onClose: closeToast }}
    />
  );
});

export default BatchNormsPage;
