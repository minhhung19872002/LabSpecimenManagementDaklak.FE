import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, message } from "antd";
import { yearlyForecastService, type YearlyForecastListDto } from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import YearlyForecastsView from "./YearlyForecasts/YearlyForecastsView";
import { getForecastYears, groupByMethod } from "./YearlyForecasts/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = getForecastYears(CURRENT_YEAR);

/** Container L4 — Dự toán mẫu năm */
const YearlyForecastsPage: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<YearlyForecastListDto | null>(null);
  const [drafts, setDrafts] = useState<Record<string, number | null>>({});
  const [keyword, setKeyword] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [activeGroupKeys, setActiveGroupKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [calcRowId, setCalcRowId] = useState<string | null>(null);

  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);

  const load = useCallback(async (targetYear: number) => {
    setLoading(true);
    try {
      const result = await yearlyForecastService.getList({ year: targetYear });
      setData(result);
      setDrafts({});
      // Mặc định mở các phương pháp còn thiếu dự toán
      const missingMethods = new Set(
        result.items.filter((r) => !r.estimatedSamples || r.estimatedSamples <= 0).map((r) => r.testMethodId)
      );
      setActiveGroupKeys([...missingMethods]);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được dự toán mẫu năm"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [load, year]);

  const dirtyCount = Object.keys(drafts).length;

  const confirmDiscard = useCallback(
    (action: () => void) => {
      if (dirtyCount === 0) {
        action();
        return;
      }
      Modal.confirm({
        title: "Bỏ thay đổi chưa lưu?",
        content: `Có ${dirtyCount} dòng dự toán chưa lưu sẽ bị mất.`,
        okText: "Bỏ thay đổi",
        cancelText: "Ở lại",
        onOk: action,
      });
    },
    [dirtyCount]
  );

  const valueOf = useCallback(
    (id: string, saved?: number | null) => (id in drafts ? drafts[id] : saved),
    [drafts]
  );

  // Lọc phía FE theo giá trị đã lưu (dòng đang sửa vẫn giữ hiển thị)
  const groups = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const rows = (data?.items ?? []).filter((r) => {
      if (onlyMissing && r.estimatedSamples && r.estimatedSamples > 0 && !(r.testMethodIndicatorId in drafts)) {
        return false;
      }
      if (!kw) return true;
      return [r.serviceCode, r.indicatorName, r.indicatorCode, r.specimenTypeName, r.testMethodName, r.testMethodCode]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(kw));
    });
    return groupByMethod(rows, (r) => valueOf(r.testMethodIndicatorId, r.estimatedSamples));
  }, [data, keyword, onlyMissing, drafts, valueOf]);

  const missingCount = useMemo(
    () =>
      (data?.items ?? []).filter((r) => {
        const v = valueOf(r.testMethodIndicatorId, r.estimatedSamples);
        return !v || v <= 0;
      }).length,
    [data, valueOf]
  );

  const handleValueChange = useCallback(
    (id: string, value: number | null) => {
      const saved = data?.items.find((r) => r.testMethodIndicatorId === id)?.estimatedSamples ?? null;
      setDrafts((prev) => {
        const next = { ...prev };
        if ((value ?? null) === saved) delete next[id];
        else next[id] = value;
        return next;
      });
    },
    [data]
  );

  const handleSave = useCallback(async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    try {
      const items = Object.entries(drafts).map(([testMethodIndicatorId, estimatedSamples]) => ({
        testMethodIndicatorId,
        estimatedSamples,
      }));
      await yearlyForecastService.save(year, items);
      message.success(`Đã lưu dự toán ${items.length} dịch vụ`);
      await load(year);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được dự toán"));
    } finally {
      setSaving(false);
    }
  }, [dirtyCount, drafts, year, load]);

  const handleClone = useCallback(() => {
    confirmDiscard(() => {
      Modal.confirm({
        title: `Clone dự toán từ năm ${year - 1}?`,
        content: `Chỉ điền các dòng năm ${year} còn trống, không ghi đè số đã nhập.`,
        okText: "Clone",
        cancelText: "Hủy",
        onOk: async () => {
          setCloning(true);
          try {
            const result = await yearlyForecastService.clone(year);
            message.success(`Đã clone ${result.clonedCount} dòng từ năm ${year - 1}`);
            await load(year);
          } catch (error) {
            message.error(getApiErrorMessage(error, "Không clone được dự toán"));
          } finally {
            setCloning(false);
          }
        },
      });
    });
  }, [confirmDiscard, year, load]);

  const allExpanded = groups.length > 0 && groups.every((g) => activeGroupKeys.includes(g.testMethodId));
  const isLocked = data?.isLocked ?? year < CURRENT_YEAR;
  const visibleServiceCount = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const calcRow = calcRowId ? data?.items.find((r) => r.testMethodIndicatorId === calcRowId) ?? null : null;

  return (
    <YearlyForecastsView
      header={{
        year,
        showRules,
        showClone: canEdit && !isLocked && (data?.canClone ?? false),
        cloning,
        onToggleRules: () => setShowRules((v) => !v),
        onClone: handleClone,
      }}
      toolbar={{
        years: YEARS,
        currentYear: CURRENT_YEAR,
        year,
        isLocked,
        canEdit,
        keyword,
        onlyMissing,
        dirtyCount,
        loading,
        saving,
        allExpanded,
        missingCount,
        totalCount: data?.items.length ?? 0,
        countText: `${groups.length} phương pháp · ${visibleServiceCount} dịch vụ`,
        onYearChange: (y) => y !== year && confirmDiscard(() => setYear(y)),
        onKeywordChange: setKeyword,
        onOnlyMissingChange: setOnlyMissing,
        onToggleExpandAll: () => setActiveGroupKeys(allExpanded ? [] : groups.map((g) => g.testMethodId)),
        onSave: handleSave,
        onReload: () => confirmDiscard(() => load(year)),
      }}
      table={{
        groups,
        year,
        readOnly: isLocked || !canEdit,
        loading,
        drafts,
        expandedKeys: activeGroupKeys,
        onExpandedKeysChange: setActiveGroupKeys,
        onValueChange: handleValueChange,
        onViewCalculation: setCalcRowId,
      }}
      calculation={{
        row: calcRow,
        year,
        estimatedSamples: calcRow ? valueOf(calcRow.testMethodIndicatorId, calcRow.estimatedSamples) : null,
        onClose: () => setCalcRowId(null),
      }}
    />
  );
};

export default YearlyForecastsPage;
