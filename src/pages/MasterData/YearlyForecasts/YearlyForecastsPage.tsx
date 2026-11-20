import {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { message } from "antd";
import {
  yearlyForecastService,
  type YearlyForecastListDto,
  type YearlyForecastRowDto,
} from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import YearlyForecastsView from "./YearlyForecasts/YearlyForecastsView";
import type { DeleteForecastTarget } from "./YearlyForecasts/DeleteForecastConfirm";
import type { UndoToastData } from "../BatchNorms/BatchNorms/UndoToast";
import { specimenKeyOf } from "../ServiceCatalog/ServiceCatalog/utils";
import {
  applyScope,
  buildCategoryOptions,
  buildForecastGroups,
  buildMethodOptions,
  buildPaletteMap,
  buildSpecimenOptions,
  categoryKeyOf,
  computeKpis,
  exportForecastsToExcel,
  filterForecasts,
  getForecastYears,
  hasForecast,
  indicatorBlockKeyOf,
  indicatorNameOf,
  methodNameOf,
  samplesOf,
  specimenNameOf,
  type FoldState,
  type ForecastScope,
} from "./YearlyForecasts/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = getForecastYears(CURRENT_YEAR);
const TOAST_MS = 6000;

/** Nút trên header trang Danh mục gọi vào L4 */
export interface YearlyForecastActions {
  exportExcel: () => void;
}

/** Hoàn tác xóa = ghi lại số mẫu cũ */
interface UndoAction {
  id: string;
  year: number;
  value: number;
}

/** Container L4 — Dự toán mẫu năm */
const YearlyForecastsPage = forwardRef<YearlyForecastActions>(function YearlyForecastsPage(_props, ref) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<YearlyForecastListDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const [categoryKey, setCategoryKey] = useState<string>();
  const [specimenKey, setSpecimenKey] = useState<string>();
  const [testMethodId, setTestMethodId] = useState<string>();
  const [scope, setScope] = useState<ForecastScope>("has");
  const [fold, setFold] = useState<FoldState>({});
  const [more, setMore] = useState<FoldState>({});
  const [allOpen, setAllOpen] = useState(true);
  /** Bộ lọc lúc bấm "Thu gọn tất cả" — lọc khác đi thì lại tự mở để thấy kết quả */
  const [collapsedFilterSig, setCollapsedFilterSig] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteForecastTarget | null>(null);
  const [toast, setToast] = useState<UndoToastData | null>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  // Đang tải năm mới thì data vẫn là năm cũ → chỉ tin isLocked của đúng năm đang xem
  const isLocked = data?.year === year ? data.isLocked : year < CURRENT_YEAR;
  const editable = canEdit && !isLocked;

  /** Đổi năm liên tục: chỉ nhận kết quả của lần tải mới nhất */
  const requestSeq = useRef(0);
  /** Năm đang xem — xóa / hoàn tác xong tải lại đúng năm này (người dùng có thể đã đổi năm lúc chờ) */
  const yearRef = useRef(year);
  yearRef.current = year;
  const load = useCallback(async (targetYear: number, silent = false) => {
    const seq = ++requestSeq.current;
    if (!silent) setLoading(true);
    try {
      const result = await yearlyForecastService.getList({ year: targetYear });
      if (seq === requestSeq.current) setData(result);
    } catch (error) {
      if (seq === requestSeq.current) message.error(getApiErrorMessage(error, "Không tải được dự toán mẫu năm"));
    } finally {
      if (!silent && seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [load, year]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const rows = useMemo(() => data?.items ?? [], [data]);
  const palettes = useMemo(() => buildPaletteMap(rows), [rows]);
  const kpis = useMemo(() => computeKpis(rows, data?.previousYearTotal ?? 0), [rows, data]);

  /** Danh sách chọn theo phạm vi đang xem (đã có / chưa có dự toán) */
  const scopeRows = useMemo(() => applyScope(rows, scope), [rows, scope]);
  const categoryOptions = useMemo(() => buildCategoryOptions(scopeRows), [scopeRows]);
  const specimenOptions = useMemo(() => buildSpecimenOptions(scopeRows, categoryKey), [scopeRows, categoryKey]);
  const methodOptions = useMemo(() => buildMethodOptions(scopeRows), [scopeRows]);

  const baseRows = useMemo(
    () => filterForecasts(rows, { keyword: deferredKeyword, categoryKey, specimenKey, testMethodId }),
    [rows, deferredKeyword, categoryKey, specimenKey, testMethodId]
  );
  const scopeCounts = useMemo(() => {
    const has = baseRows.filter(hasForecast).length;
    return { has, missing: baseRows.length - has };
  }, [baseRows]);
  const cards = useMemo(() => buildForecastGroups(applyScope(baseRows, scope), palettes), [baseRows, scope, palettes]);

  const hasFilter = Boolean(keyword.trim() || categoryKey || specimenKey || testMethodId || scope !== "has");
  const filterSig = [deferredKeyword.trim(), categoryKey, specimenKey, testMethodId, scope].join("|");
  const filtered = hasFilter && filterSig !== collapsedFilterSig;
  const showAll = Boolean(deferredKeyword.trim() || testMethodId);

  const emptyText = useMemo(() => {
    if (scopeRows.length > 0) return "Không có dự toán khớp bộ lọc.";
    return scope === "has" ? `Chưa có dự toán năm ${year}.` : "Mọi dịch vụ có định mức đều đã có dự toán.";
  }, [scopeRows, scope, year]);

  const clearFilter = useCallback(() => {
    setKeyword("");
    setCategoryKey(undefined);
    setSpecimenKey(undefined);
    setTestMethodId(undefined);
    setScope("has");
  }, []);

  const handleCategoryChange = useCallback((value?: string) => {
    setCategoryKey(value);
    setSpecimenKey(undefined);
  }, []);

  /** Đổi phạm vi: giữ bộ lọc, chỉ bỏ lựa chọn không còn trong danh sách chọn của phạm vi mới */
  const handleScopeChange = useCallback(
    (value: ForecastScope) => {
      const next = applyScope(rows, value);
      const keep = (current: string | undefined, keyOf: (r: YearlyForecastRowDto) => string) =>
        current && next.some((r) => keyOf(r) === current) ? current : undefined;
      setScope(value);
      setCategoryKey((v) => keep(v, categoryKeyOf));
      setSpecimenKey((v) => keep(v, (r) => specimenKeyOf(r.specimenTypeId)));
      setTestMethodId((v) => keep(v, (r) => r.testMethodId));
    },
    [rows]
  );

  const handleYearChange = useCallback((value: number) => {
    setYear(value);
    setDeleteTarget(null);
    setToast(null);
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

  // ===== Xóa =====
  const handleDelete = useCallback(
    (row: YearlyForecastRowDto) => {
      const key = indicatorBlockKeyOf(row);
      setDeleteTarget({
        id: row.testMethodIndicatorId,
        indicatorName: indicatorNameOf(row),
        methodName: methodNameOf(row),
        specimenName: specimenNameOf(row),
        samples: samplesOf(row),
        isLast: rows.filter((r) => hasForecast(r) && indicatorBlockKeyOf(r) === key).length === 1,
        year,
      });
    },
    [rows, year]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, year: targetYear, samples, methodName, indicatorName, specimenName } = deleteTarget;
    try {
      await yearlyForecastService.save(targetYear, [{ testMethodIndicatorId: id, estimatedSamples: null }]);
      setDeleteTarget(null);
      showToast(`Đã xóa ${methodName} của ${indicatorName} – ${specimenName}`, { id, year: targetYear, value: samples });
      await load(yearRef.current, true);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không xóa được dự toán"));
    }
  }, [deleteTarget, load, showToast]);

  const handleUndo = useCallback(async () => {
    if (!undoAction) return;
    try {
      await yearlyForecastService.save(undoAction.year, [
        { testMethodIndicatorId: undoAction.id, estimatedSamples: undoAction.value },
      ]);
      showToast("Đã hoàn tác", null);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không hoàn tác được"));
    }
    await load(yearRef.current, true);
  }, [undoAction, load, showToast]);

  const closeToast = useCallback(() => setToast(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  useImperativeHandle(
    ref,
    () => ({
      exportExcel: () => {
        if (cards.length === 0) {
          message.info("Không có dự toán để xuất");
          return;
        }
        exportForecastsToExcel(cards, year);
      },
    }),
    [cards, year]
  );

  return (
    <YearlyForecastsView
      loading={loading}
      yearBar={{ years: YEARS, currentYear: CURRENT_YEAR, year, isLocked, kpis, onYearChange: handleYearChange }}
      toolbar={{
        keyword,
        categoryKey,
        specimenKey,
        testMethodId,
        scope,
        categoryOptions,
        specimenOptions,
        methodOptions,
        scopeCounts,
        hasFilter,
        onKeywordChange: setKeyword,
        onCategoryChange: handleCategoryChange,
        onSpecimenChange: setSpecimenKey,
        onTestMethodChange: setTestMethodId,
        onScopeChange: handleScopeChange,
        onClearFilter: clearFilter,
        onExpandAll: handleExpandAll,
        onCollapseAll: handleCollapseAll,
      }}
      cards={cards}
      emptyText={emptyText}
      fold={fold}
      more={more}
      allOpen={allOpen}
      filtered={filtered}
      showAll={showAll}
      editable={editable}
      onToggle={handleToggle}
      onToggleMore={handleToggleMore}
      onDelete={handleDelete}
      deleteConfirm={{ target: deleteTarget, onConfirm: handleConfirmDelete, onCancel: closeDelete }}
      toast={{ toast, onUndo: handleUndo, onClose: closeToast }}
    />
  );
});

export default YearlyForecastsPage;
