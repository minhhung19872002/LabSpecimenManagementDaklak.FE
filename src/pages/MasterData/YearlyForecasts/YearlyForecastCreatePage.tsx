import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderHeight, useLeaveConfirm } from "../../../hooks";
import type { ProductType } from "../../../services/productService";
import {
  ForecastQuantityMode,
  yearlyForecastService,
  type BatchNormProductOptionDto,
  type ForecastComboDto,
  type ForecastCreateOptionsDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { foldText } from "../ServiceCatalog/ServiceCatalog/utils";
import {
  EMPTY_PICK_FILTER,
  MATERIAL_TYPES,
  buildPickFilterOptions,
  comboCategoryNameOf,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboSpecimenNameOf,
  materialTypeName,
  productNameOf,
  sortCombos,
  uniqueNames,
} from "../BatchNorms/BatchNormCreate/utils";
import type { AddItemKind, AddItemRowView, AddItemTypeTab } from "./YearlyForecastCreate/AddItemModal";
import type { ApplyRowView } from "./YearlyForecastCreate/ApplyModal";
import type { SummaryChip } from "./YearlyForecastCreate/CreateFooter";
import type { MethodCardHandlers, MethodCardView } from "./YearlyForecastCreate/MethodCard";
import YearlyForecastCreateView from "./YearlyForecastCreate/YearlyForecastCreateView";
import {
  EMPTY_CONFIG,
  YEARLY_FORECAST_LIST_URL,
  applyForecastPickTab,
  buildEquipmentRows,
  buildForecastTree,
  buildMaterialRows,
  comboKeyOf,
  comboPathOf,
  comboSearchText,
  configFromSaved,
  defaultUnitOf,
  filterForecastPick,
  fmt,
  hasNorm,
  hasSavedForecast,
  hiddenCounts,
  linkOf,
  savedLinkGroupOf,
  srcCountOf,
  toSaveItem,
  type ComboConfigState,
  type EquipmentRowView,
  type FoldState,
  type ForecastSavedState,
  type MaterialRowView,
  type PickFilter,
  type PickTab,
} from "./YearlyForecastCreate/utils";

const byId = (items: readonly BatchNormProductOptionDto[]): Map<string, BatchNormProductOptionDto> =>
  new Map(items.map((p) => [p.id, p]));

/** Tóm tắt ≤ 2 tên thì liệt kê, nhiều hơn thì đếm */
const listText = (names: string[]): string => (names.length <= 2 ? names.join(", ") || "—" : `${names.length} mục`);

const without = <T,>(record: Readonly<Record<string, T>>, drop: (key: string, value: T) => boolean): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([k, v]) => !drop(k, v)));

const parseYear = (raw: string | null): number | null => {
  const n = raw ? Number(raw) : NaN;
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null;
};

interface AddState {
  id: string;
  kind: AddItemKind;
}

/** Container — Phiếu tạo / sửa dự toán mẫu năm */
const YearlyForecastCreatePage = () => {
  const navigate = useNavigate();
  const headerHeight = useHeaderHeight();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit") ?? "";
  const isEdit = Boolean(editId);
  /** Mở từ bút chì của dòng "Chưa có dự toán" → chọn sẵn bộ đó */
  const addId = searchParams.get("add") ?? "";
  const thisYear = new Date().getFullYear();
  const urlYear = parseYear(searchParams.get("year"));

  // ---------- Dữ liệu nguồn ----------
  const [year, setYear] = useState<number>(() =>
    isEdit ? urlYear ?? thisYear : urlYear === thisYear + 1 ? thisYear + 1 : thisYear
  );
  const [options, setOptions] = useState<ForecastCreateOptionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const initializedRef = useRef(false);

  // ---------- Phiếu ----------
  const [selected, setSelected] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, ComboConfigState>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [currentKey, setCurrentKey] = useState("");
  const [touched, setTouched] = useState(false);
  const [tried, setTried] = useState(false);
  /** Phiếu sửa: các bộ mở sẵn (không bị khóa trong popup chọn bộ) */
  const [editGroup, setEditGroup] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ---------- Thu gọn ----------
  const [treeFold, setTreeFold] = useState<FoldState>({});
  const [methodFold, setMethodFold] = useState<FoldState>({});
  const [subFold, setSubFold] = useState<FoldState>({});

  // ---------- Popup chọn bộ ----------
  const [pickOpen, setPickOpen] = useState(false);
  const [pickFilter, setPickFilter] = useState<PickFilter>(EMPTY_PICK_FILTER);
  const [pickTab, setPickTab] = useState<PickTab>("all");

  // ---------- Popup thêm vật tư / thiết bị ----------
  const [add, setAdd] = useState<AddState | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [addType, setAddType] = useState<ProductType | null>(null);
  const [addSelected, setAddSelected] = useState<ReadonlySet<string>>(new Set());

  // ---------- Popup áp dụng tiêu hao ----------
  const [applySourceId, setApplySourceId] = useState<string | null>(null);
  const [applyQuery, setApplyQuery] = useState("");
  const [applySameMethod, setApplySameMethod] = useState(true);
  const [applySelected, setApplySelected] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    yearlyForecastService
      .getCreateOptions(year)
      .then((data) => {
        if (cancelled) return;
        setOptions(data);
        const map = new Map(data.combos.map((c) => [c.testMethodIndicatorId, c]));
        if (isEdit) {
          if (initializedRef.current) return;
          initializedRef.current = true;
          const combo = map.get(editId);
          if (!combo || !hasSavedForecast(combo)) {
            message.warning(`Không tìm thấy dự toán năm ${year} của bộ cần sửa`);
            return;
          }
          // Phiếu sửa theo Nền mẫu × Chỉ tiêu: mọi phương pháp đã có dự toán năm này (+ nhóm áp dụng tiêu hao)
          const key = comboKeyOf(combo);
          const sameCt = data.combos.filter((c) => comboKeyOf(c) === key && hasSavedForecast(c)).map((c) => c.testMethodIndicatorId);
          const group = [...new Set(sameCt.flatMap((id) => savedLinkGroupOf(id, map)))];
          setEditGroup(new Set(group));
          setSelected(group);
          setConfigs(Object.fromEntries(group.map((id) => [id, configFromSaved(map.get(id)?.forecast)])));
          const saved: Record<string, string> = {};
          for (const id of group) {
            const src = map.get(id)?.forecast?.sourceTestMethodIndicatorId;
            if (src && src !== id) saved[id] = src;
          }
          setLinks(saved);
          setCurrentKey(comboKeyOf(combo));
        } else {
          // Phiếu tạo: bỏ các bộ vừa có dự toán (đổi năm / người khác vừa lưu)
          const free = (id: string) => map.has(id) && !hasSavedForecast(map.get(id)!);
          const preselect = !initializedRef.current && addId && free(addId) ? addId : "";
          initializedRef.current = true;
          setSelected((prev) => [...prev.filter(free), ...(preselect && !prev.includes(preselect) ? [preselect] : [])]);
          if (preselect) setCurrentKey(comboKeyOf(map.get(preselect)!));
        }
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được dữ liệu phiếu dự toán"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, reloadToken, isEdit, editId, addId]);

  // ---------- Dẫn xuất ----------
  const combos = useMemo(() => options?.combos ?? [], [options]);
  const comboById = useMemo(() => new Map(combos.map((c) => [c.testMethodIndicatorId, c])), [combos]);
  const sortedCombos = useMemo(() => sortCombos(combos) as ForecastComboDto[], [combos]);
  const materialById = useMemo(() => byId(options?.materials ?? []), [options]);
  const equipmentById = useMemo(() => byId(options?.equipments ?? []), [options]);
  const inSheet = useMemo<ReadonlySet<string>>(() => new Set(selected), [selected]);
  const chosen = useMemo(() => sortedCombos.filter((c) => inSheet.has(c.testMethodIndicatorId)), [sortedCombos, inSheet]);

  const configOf = useCallback((id: string): ComboConfigState => configs[id] ?? EMPTY_CONFIG, [configs]);
  const sourceOf = useCallback((id: string): string => linkOf(id, links, inSheet), [links, inSheet]);

  /** Vật tư / thiết bị hiệu lực của từng bộ trên phiếu (theo bộ nguồn nếu đang áp dụng) */
  const rowsById = useMemo(() => {
    const map = new Map<string, { materials: MaterialRowView[]; equipments: EquipmentRowView[] }>();
    for (const c of chosen) {
      const id = c.testMethodIndicatorId;
      const bk = sourceOf(id) || id;
      const bkCombo = comboById.get(bk) ?? c;
      const bkConfig = configOf(bk);
      map.set(id, {
        materials: buildMaterialRows(bkCombo, bkConfig, configOf(id).samples, materialById),
        equipments: buildEquipmentRows(bkCombo, bkConfig, equipmentById),
      });
    }
    return map;
  }, [chosen, sourceOf, comboById, configOf, materialById, equipmentById]);

  const tree = useMemo(() => buildForecastTree(chosen, (id) => configOf(id).samples), [chosen, configOf]);
  const indicatorKeys = useMemo(() => [...new Set(chosen.map(comboKeyOf))], [chosen]);
  const activeKey = indicatorKeys.includes(currentKey) ? currentKey : indicatorKeys[0] ?? "";
  const currentCombos = useMemo(() => chosen.filter((c) => comboKeyOf(c) === activeKey), [chosen, activeKey]);

  const missingCount = chosen.filter((c) => !((configOf(c.testMethodIndicatorId).samples ?? 0) > 0)).length;
  const totalSamples = chosen.reduce((sum, c) => sum + (configOf(c.testMethodIndicatorId).samples ?? 0), 0);

  // ---------- Thao tác phiếu ----------
  const updateConfig = useCallback((id: string, fn: (c: ComboConfigState) => ComboConfigState) => {
    setConfigs((prev) => ({ ...prev, [id]: fn(prev[id] ?? EMPTY_CONFIG) }));
    setTouched(true);
  }, []);

  /** Thêm bộ vào phiếu; bộ đã có dự toán lấy cấu hình đã lưu */
  const addToSheet = useCallback(
    (ids: string[], keepSavedLinks: boolean) => {
      setSelected((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
      setConfigs((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          if (next[id]) continue;
          const c = comboById.get(id);
          next[id] = c && hasSavedForecast(c) ? configFromSaved(c.forecast) : EMPTY_CONFIG;
        }
        return next;
      });
      if (keepSavedLinks) {
        setLinks((prev) => {
          const next = { ...prev };
          for (const id of ids) {
            const c = comboById.get(id);
            const src = c && hasSavedForecast(c) ? c.forecast?.sourceTestMethodIndicatorId : null;
            if (src && src !== id && !next[id]) next[id] = src;
          }
          return next;
        });
      }
      setTouched(true);
    },
    [comboById]
  );

  const removeFromSheet = useCallback((ids: string[]) => {
    const drop = new Set(ids);
    setSelected((prev) => prev.filter((id) => !drop.has(id)));
    // Bỏ bộ khỏi phiếu → ngắt mọi liên kết áp dụng của nó
    setLinks((prev) => without(prev, (k, v) => drop.has(k) || drop.has(v)));
    setTouched(true);
  }, []);

  const scrollToMethod = (id: string) =>
    window.setTimeout(() => document.getElementById(`yfc-method-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

  const handlers: MethodCardHandlers = {
    onToggle: (id) => setMethodFold((p) => ({ ...p, [id]: !p[id] })),
    onToggleMaterials: (id) => setSubFold((p) => ({ ...p, [`${id}#vt`]: !p[`${id}#vt`] })),
    onToggleEquipments: (id) => setSubFold((p) => ({ ...p, [`${id}#tb`]: !p[`${id}#tb`] })),
    onSamples: (id, samples) => updateConfig(id, (c) => ({ ...c, samples })),
    onOpenApply: (id) => {
      setApplySourceId(id);
      setApplyQuery("");
      setApplySameMethod(true);
      setApplySelected(new Set(selected.filter((t) => t !== id && sourceOf(t) === id)));
    },
    onRemoveCombo: (id) => removeFromSheet([id]),
    onGoSource: (srcId) => {
      const src = comboById.get(srcId);
      if (!src) return;
      setCurrentKey(comboKeyOf(src));
      setMethodFold((p) => ({ ...p, [srcId]: false }));
      scrollToMethod(srcId);
    },
    onUnlink: (id) => {
      setLinks((prev) => without(prev, (k) => k === id));
      setTouched(true);
      const c = comboById.get(id);
      setToast(`Đã ngắt áp dụng – ${c ? comboMethodNameOf(c) : "phương pháp"} dùng lại định mức riêng`);
    },
    onAddMaterial: (id) => {
      setAdd({ id, kind: "material" });
      setAddQuery("");
      setAddType(null);
      setAddSelected(new Set());
    },
    onAddEquipment: (id) => {
      setAdd({ id, kind: "equipment" });
      setAddQuery("");
      setAddType(null);
      setAddSelected(new Set());
    },
    onExtraQuantity: (id, productId, quantity) =>
      updateConfig(id, (c) => ({
        ...c,
        extraMaterials: c.extraMaterials.map((m) => (m.productId === productId ? { ...m, quantity } : m)),
      })),
    onExtraUnit: (id, productId, unitId) =>
      updateConfig(id, (c) => ({
        ...c,
        extraMaterials: c.extraMaterials.map((m) => (m.productId === productId ? { ...m, unitId } : m)),
      })),
    onExtraMode: (id, productId, mode) =>
      updateConfig(id, (c) => ({
        ...c,
        extraMaterials: c.extraMaterials.map((m) => (m.productId === productId ? { ...m, mode } : m)),
      })),
    onRemoveMaterial: (id, productId, isExtra) =>
      updateConfig(id, (c) =>
        isExtra
          ? { ...c, extraMaterials: c.extraMaterials.filter((m) => m.productId !== productId) }
          : { ...c, hiddenMaterialIds: [...new Set([...c.hiddenMaterialIds, productId])] }
      ),
    onRemoveEquipment: (id, productId, isExtra) =>
      updateConfig(id, (c) =>
        isExtra
          ? { ...c, extraEquipmentIds: c.extraEquipmentIds.filter((e) => e !== productId) }
          : { ...c, hiddenEquipmentIds: [...new Set([...c.hiddenEquipmentIds, productId])] }
      ),
    onRestoreMaterials: (id) => updateConfig(id, (c) => ({ ...c, hiddenMaterialIds: [] })),
    onRestoreEquipments: (id) => updateConfig(id, (c) => ({ ...c, hiddenEquipmentIds: [] })),
  };

  // ---------- ② Thẻ phương pháp ----------
  const methodViews: MethodCardView[] = currentCombos.map((c) => {
    const id = c.testMethodIndicatorId;
    const src = sourceOf(id);
    const srcCombo = src ? comboById.get(src) : undefined;
    const rows = rowsById.get(id) ?? { materials: [], equipments: [] };
    const own = configOf(id);
    const hidden = hiddenCounts(c, own);
    return {
      id,
      methodName: comboMethodNameOf(c),
      status: src ? "linked" : hasNorm(c) ? "norm" : "none",
      srcCount: srcCountOf(id, links, inSheet),
      samples: own.samples,
      samplesError: tried && !((own.samples ?? 0) > 0),
      sourceId: src,
      sourceLabel: srcCombo ? comboPathOf(srcCombo) : "",
      canApply: !src && rows.materials.length + rows.equipments.length > 0,
      open: !methodFold[id],
      materialOpen: !subFold[`${id}#vt`],
      equipmentOpen: !subFold[`${id}#tb`],
      materials: rows.materials,
      equipments: rows.equipments,
      materialExtraCount: rows.materials.filter((r) => r.isExtra).length,
      equipmentExtraCount: rows.equipments.filter((r) => r.isExtra).length,
      hiddenMaterials: hidden.materials,
      hiddenEquipments: hidden.equipments,
    };
  });
  const currentFirst = currentCombos[0];

  // ---------- Popup chọn bộ ----------
  /** Bộ đã có dự toán năm này bị khóa (phiếu sửa: trừ các bộ của Nền mẫu × Chỉ tiêu đang sửa) */
  const lockedIds = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        combos.filter((c) => hasSavedForecast(c) && !editGroup.has(c.testMethodIndicatorId)).map((c) => c.testMethodIndicatorId)
      ),
    [combos, editGroup]
  );
  const isLocked = useCallback((c: ForecastComboDto) => lockedIds.has(c.testMethodIndicatorId), [lockedIds]);
  const pickBase = useMemo(() => filterForecastPick(sortedCombos, pickFilter), [sortedCombos, pickFilter]);
  const pickRows = useMemo(() => applyForecastPickTab(pickBase, pickTab, inSheet, isLocked), [pickBase, pickTab, inSheet, isLocked]);
  const pickFilterOptions = useMemo(() => buildPickFilterOptions(sortedCombos, pickFilter), [sortedCombos, pickFilter]);
  const tabCounts = useMemo(
    () => ({
      all: pickBase.length,
      free: applyForecastPickTab(pickBase, "free", inSheet, isLocked).length,
      sel: applyForecastPickTab(pickBase, "sel", inSheet, isLocked).length,
    }),
    [pickBase, inSheet, isLocked]
  );
  const visibleFreeIds = useMemo(() => pickRows.filter((c) => !isLocked(c)).map((c) => c.testMethodIndicatorId), [pickRows, isLocked]);

  /** Phiếu sửa: bộ đã có dự toán luôn mở kèm cả nhóm áp dụng tiêu hao */
  const expandPick = (ids: string[]): string[] =>
    isEdit ? [...new Set(ids.flatMap((id) => savedLinkGroupOf(id, comboById)))] : ids;

  const handlePickToggle = (id: string) => {
    if (inSheet.has(id)) removeFromSheet([id]);
    else addToSheet(expandPick([id]), isEdit);
  };
  const handlePickSelectAll = (ids: string[], select: boolean) => {
    if (select) addToSheet(expandPick(ids.filter((id) => !inSheet.has(id))), isEdit);
    else removeFromSheet(ids);
  };

  // ---------- Popup thêm vật tư / thiết bị ----------
  const addCombo = add ? comboById.get(add.id) : undefined;
  const addCandidates = useMemo(() => {
    if (!add || !addCombo) return [];
    const cfg = configOf(add.id);
    if (add.kind === "material") {
      const exclude = new Set([...addCombo.normMaterials.map((m) => m.productId), ...cfg.extraMaterials.map((m) => m.productId)]);
      return (options?.materials ?? []).filter((p) => !exclude.has(p.id) && p.units.length > 0);
    }
    const exclude = new Set([...addCombo.normEquipmentIds, ...cfg.extraEquipmentIds]);
    return (options?.equipments ?? []).filter((p) => !exclude.has(p.id));
  }, [add, addCombo, configOf, options]);
  const addQueryMatched = useMemo(() => {
    const q = foldText(addQuery.trim());
    return q
      ? addCandidates.filter((p) => foldText(`${p.code} ${p.name} ${materialTypeName(p.productType)} ${p.categories ?? ""}`).includes(q))
      : addCandidates;
  }, [addCandidates, addQuery]);
  const addTypeTabs: AddItemTypeTab[] = useMemo(() => {
    if (add?.kind !== "material") return [];
    const tabs: AddItemTypeTab[] = [{ type: null, label: "Tất cả", count: addQueryMatched.length }];
    for (const type of MATERIAL_TYPES) {
      const count = addQueryMatched.filter((p) => p.productType === type).length;
      if (count > 0) tabs.push({ type, label: materialTypeName(type), count });
    }
    return tabs;
  }, [add, addQueryMatched]);
  const addRows: AddItemRowView[] = useMemo(
    () =>
      addQueryMatched
        .filter((p) => addType == null || p.productType === addType)
        .map((p) => ({
          id: p.id,
          code: p.code,
          name: productNameOf(p),
          productType: p.productType,
          typeName: materialTypeName(p.productType),
          unitText: p.units.find((u) => u.id === p.defaultUnitId)?.name ?? p.units[0]?.name ?? "",
        })),
    [addQueryMatched, addType]
  );

  const handleAddConfirm = () => {
    if (!add || !addSelected.size) return;
    const ids = [...addSelected];
    if (add.kind === "material") {
      updateConfig(add.id, (c) => ({
        ...c,
        extraMaterials: [
          ...c.extraMaterials,
          ...ids.flatMap((productId) => {
            const p = materialById.get(productId);
            const unitId = p ? defaultUnitOf(p) : null;
            return unitId ? [{ productId, unitId, quantity: null, mode: ForecastQuantityMode.PerSample }] : [];
          }),
        ],
      }));
      setSubFold((p) => ({ ...p, [`${add.id}#vt`]: false }));
    } else {
      updateConfig(add.id, (c) => ({ ...c, extraEquipmentIds: [...new Set([...c.extraEquipmentIds, ...ids])] }));
      setSubFold((p) => ({ ...p, [`${add.id}#tb`]: false }));
    }
    setToast(
      `Đã thêm ${ids.length} ${add.kind === "material" ? "vật tư" : "thiết bị"} cho ${addCombo ? comboMethodNameOf(addCombo) : ""}`.trim()
    );
    setAdd(null);
  };

  // ---------- Popup áp dụng tiêu hao ----------
  const applySource = applySourceId ? comboById.get(applySourceId) : undefined;
  /** Số bộ đã lưu (ngoài phiếu) đang áp dụng theo `id` */
  const savedTargetsOutside = useCallback(
    (id: string) =>
      combos.filter(
        (c) => !inSheet.has(c.testMethodIndicatorId) && hasSavedForecast(c) && c.forecast?.sourceTestMethodIndicatorId === id
      ).length,
    [combos, inSheet]
  );
  const currentSourceOf = useCallback(
    (c: ForecastComboDto): string => {
      const id = c.testMethodIndicatorId;
      if (inSheet.has(id)) return sourceOf(id);
      return hasSavedForecast(c) ? c.forecast?.sourceTestMethodIndicatorId ?? "" : "";
    },
    [inSheet, sourceOf]
  );
  const applyRows: ApplyRowView[] = useMemo(() => {
    if (!applySource) return [];
    const srcId = applySource.testMethodIndicatorId;
    const q = foldText(applyQuery.trim());
    return sortedCombos
      .filter(
        (c) =>
          c.testMethodIndicatorId !== srcId &&
          (inSheet.has(c.testMethodIndicatorId) || !isLocked(c)) &&
          (!applySameMethod || c.testMethodId === applySource.testMethodId) &&
          (!q || comboSearchText(c).includes(q))
      )
      .map((c) => {
        const id = c.testMethodIndicatorId;
        const isTargetOf = srcCountOf(id, links, inSheet) + savedTargetsOutside(id);
        const cur = currentSourceOf(c);
        const curCombo = cur && cur !== srcId ? comboById.get(cur) : undefined;
        const isSel = applySelected.has(id);
        const base = {
          id,
          categoryName: comboCategoryNameOf(c),
          specimenName: comboSpecimenNameOf(c),
          indicatorName: comboIndicatorNameOf(c),
          methodName: comboMethodNameOf(c),
        };
        if (isTargetOf > 0) {
          return { ...base, selected: false, disabled: true, statusText: `Đang là nguồn cho ${isTargetOf} bộ khác`, tone: "muted" as const };
        }
        if (isSel) {
          const statusText = curCombo ? "Sẽ thay nguồn áp dụng" : inSheet.has(id) ? "Sẽ áp dụng" : "Sẽ thêm vào phiếu & áp dụng";
          return { ...base, selected: true, disabled: false, statusText, tone: "selected" as const };
        }
        if (curCombo) {
          return {
            ...base,
            selected: false,
            disabled: false,
            statusText: `Đang áp dụng từ ${comboSpecimenNameOf(curCombo)} · ${comboIndicatorNameOf(curCombo)}`,
            tone: "warn" as const,
          };
        }
        return {
          ...base,
          selected: false,
          disabled: false,
          statusText: inSheet.has(id) ? "Đã có trong phiếu" : "Chưa có trong phiếu",
          tone: "normal" as const,
        };
      });
  }, [
    applySource,
    applyQuery,
    applySameMethod,
    applySelected,
    sortedCombos,
    isLocked,
    inSheet,
    links,
    savedTargetsOutside,
    currentSourceOf,
    comboById,
  ]);
  const applyAddCount = [...applySelected].filter((id) => !inSheet.has(id)).length;
  const applyHadTargets = applySourceId ? srcCountOf(applySourceId, links, inSheet) > 0 : false;

  const handleApplyConfirm = () => {
    if (!applySource) return;
    const srcId = applySource.testMethodIndicatorId;
    const targets = [...applySelected];
    const toAdd = targets.filter((id) => !inSheet.has(id));
    if (toAdd.length) addToSheet(toAdd, false);
    setLinks((prev) => {
      const next = without(prev, (k, v) => v === srcId && !applySelected.has(k));
      for (const id of targets) next[id] = srcId;
      return next;
    });
    setTouched(true);
    setToast(
      targets.length
        ? `Đã áp dụng tiêu hao của ${comboMethodNameOf(applySource)} (${comboSpecimenNameOf(applySource)} · ${comboIndicatorNameOf(applySource)}) cho ${targets.length} bộ`
        : "Đã gỡ áp dụng"
    );
    setApplySourceId(null);
  };

  // ---------- Kiểm tra / tóm tắt ----------
  const problems: string[] = [];
  if (!chosen.length) problems.push("Chưa chọn bộ nào");
  if (missingCount) problems.push(`${missingCount} bộ chưa nhập số mẫu`);
  const invalid = problems.length > 0;

  const materialSet = new Set<string>();
  const equipmentSet = new Set<string>();
  for (const r of rowsById.values()) {
    for (const m of r.materials) materialSet.add(m.productId);
    for (const e of r.equipments) equipmentSet.add(e.productId);
  }
  const specimenNames = uniqueNames(chosen, comboSpecimenNameOf);
  const indicatorNames = uniqueNames(chosen, comboIndicatorNameOf);
  const methodNames = uniqueNames(chosen, comboMethodNameOf);
  const chips: SummaryChip[] = [
    { key: "Năm", value: String(year), title: `Dự toán năm ${year}`, colors: ["#e6f4ff", "#0958d9", "#91caff"] },
    { key: "Nền mẫu", value: listText(specimenNames), title: specimenNames.join(", "), colors: ["#fff7e6", "#873800", "#ffd591"] },
    { key: "Chỉ tiêu", value: listText(indicatorNames), title: indicatorNames.join(", "), colors: ["#fafafa", "#262626", "#d9d9d9"] },
    { key: "Phương pháp", value: listText(methodNames), title: methodNames.join(", "), colors: ["#e6fffb", "#00474f", "#87e8de"] },
    { key: "Tổng mẫu/năm", value: fmt(totalSamples), title: `${fmt(totalSamples)} mẫu / năm`, colors: ["#f6ffed", "#237804", "#b7eb8f"] },
    { key: "Vật tư", value: String(materialSet.size), title: `${materialSet.size} vật tư`, colors: ["#f0f5ff", "#10239e", "#adc6ff"] },
    { key: "Thiết bị", value: String(equipmentSet.size), title: `${equipmentSet.size} thiết bị`, colors: ["#e6fffb", "#006d75", "#87e8de"] },
  ];

  // ---------- Hủy / Lưu ----------
  const dirty = touched;
  const allowLeave = useLeaveConfirm(dirty, {
    title: isEdit ? "Hủy sửa dự toán?" : "Hủy phiếu tạo dự toán?",
    content: "Số mẫu, vật tư và thiết bị đã nhập trên phiếu sẽ không được lưu.",
    okText: "Hủy phiếu",
    cancelText: "Tiếp tục nhập",
  });
  const handleBack = useCallback(() => navigate(YEARLY_FORECAST_LIST_URL), [navigate]);

  const handleYearChange = (next: number) => {
    if (next === year) return;
    setYear(next);
  };

  const handleSubmit = async (): Promise<void> => {
    if (invalid) {
      setTried(true);
      return;
    }
    const items = chosen.map((c) => toSaveItem(c, configOf(c.testMethodIndicatorId), sourceOf(c.testMethodIndicatorId)));
    try {
      const result = isEdit
        ? await yearlyForecastService.updateDetails(year, items)
        : await yearlyForecastService.createDetails(year, items);
      const state: ForecastSavedState = {
        forecastYear: year,
        savedToast: isEdit
          ? `Đã tự động lưu thay đổi dự toán năm ${year} · ${fmt(result.totalSamples)} mẫu`
          : `Đã tạo ${result.count} dự toán năm ${year} · ${fmt(result.totalSamples)} mẫu`,
      };
      allowLeave();
      navigate(YEARLY_FORECAST_LIST_URL, { state });
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được dự toán"));
      if (!isEdit) setReloadToken((t) => t + 1);
    }
  };

  // Chỉ năm chưa khóa sổ (năm hiện tại và năm sau)
  const yearOptions = isEdit
    ? [{ value: year, label: `Năm ${year}` }]
    : [thisYear, thisYear + 1].map((y) => ({ value: y, label: `Năm ${y}` }));
  const yearNote = `${year === thisYear ? "Năm tài chính hiện tại · " : ""}Đang mở · năm đã khóa sổ không chọn được`;

  return (
    <YearlyForecastCreateView
      headerHeight={headerHeight}
      loading={loading}
      pageTitle={isEdit ? `Sửa dự toán mẫu năm ${year}` : "Phiếu tạo dự toán mẫu năm"}
      pageSub={
        isEdit
          ? `Sửa số mẫu / năm và vật tư, thiết bị theo từng phương pháp · năm tài chính ${year} đang mở`
          : "Tạo 1 hoặc nhiều dự toán cùng lúc · chọn nền mẫu × chỉ tiêu × phương pháp và nhập số mẫu · vật tư, thiết bị tự tính theo Định mức theo mẻ"
      }
      headerSummary={`${chosen.length} dự toán · ${fmt(totalSamples)} mẫu / năm`}
      onBack={handleBack}
      left={{
        step: { done: chosen.length > 0, active: chosen.length === 0 },
        year,
        yearOptions,
        yearLocked: isEdit,
        yearNote,
        tree,
        selectedCount: chosen.length,
        currentKey: activeKey,
        fold: treeFold,
        showError: tried && chosen.length === 0,
        onYearChange: handleYearChange,
        onOpenPick: () => setPickOpen(true),
        onToggleFold: (key, collapse) => setTreeFold((p) => ({ ...p, [key]: collapse })),
        onExpandAll: () => setTreeFold({}),
        onCollapseAll: () => setTreeFold(Object.fromEntries(tree.map((g) => [g.foldKey, true]))),
        onSelectIndicator: setCurrentKey,
      }}
      methods={{
        ...handlers,
        step: { done: chosen.length > 0 && missingCount === 0, active: chosen.length > 0 && missingCount > 0 },
        current: currentFirst
          ? { specimenName: comboSpecimenNameOf(currentFirst), indicatorName: comboIndicatorNameOf(currentFirst) }
          : null,
        methods: methodViews,
        onExpandAll: () => {
          const ids = currentCombos.map((c) => c.testMethodIndicatorId);
          setMethodFold((p) => without(p, (k) => ids.includes(k)));
          setSubFold((p) => without(p, (k) => ids.some((id) => k.startsWith(`${id}#`))));
        },
        onCollapseAll: () =>
          setMethodFold((p) => ({ ...p, ...Object.fromEntries(currentCombos.map((c) => [c.testMethodIndicatorId, true])) })),
      }}
      footer={{
        chips,
        problems: tried ? problems : [],
        invalid,
        toast,
        submitLabel: isEdit ? "Lưu thay đổi" : chosen.length > 1 ? `Tạo ${chosen.length} dự toán` : "Tạo dự toán",
        onCancel: handleBack,
        onSubmit: handleSubmit,
      }}
      pick={{
        open: pickOpen,
        year,
        filter: pickFilter,
        filterOptions: pickFilterOptions,
        tab: pickTab,
        tabCounts,
        rows: pickRows,
        visibleFreeIds,
        selected: inSheet,
        lockedIds,
        onFilterChange: (patch) => setPickFilter((prev) => ({ ...prev, ...patch })),
        onClearFilter: () => setPickFilter((prev) => ({ ...EMPTY_PICK_FILTER, onlyFree: prev.onlyFree })),
        onTabChange: setPickTab,
        onToggle: handlePickToggle,
        onSelectAll: handlePickSelectAll,
        onClearSelected: () => removeFromSheet(selected),
        onClose: () => setPickOpen(false),
      }}
      add={{
        open: Boolean(add),
        kind: add?.kind ?? "material",
        contextPath: addCombo ? comboPathOf(addCombo) : "",
        query: addQuery,
        typeFilter: addType,
        typeTabs: addTypeTabs,
        rows: addRows,
        selected: addSelected,
        onQuery: setAddQuery,
        onTypeFilter: setAddType,
        onToggle: (id) =>
          setAddSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          }),
        onClearSelected: () => setAddSelected(new Set()),
        onClose: () => setAdd(null),
        onConfirm: handleAddConfirm,
      }}
      apply={{
        open: Boolean(applySource),
        source: applySource
          ? {
              specimenName: comboSpecimenNameOf(applySource),
              indicatorName: comboIndicatorNameOf(applySource),
              methodName: comboMethodNameOf(applySource),
              materialCount: rowsById.get(applySource.testMethodIndicatorId)?.materials.length ?? 0,
              equipmentCount: rowsById.get(applySource.testMethodIndicatorId)?.equipments.length ?? 0,
            }
          : null,
        query: applyQuery,
        sameMethod: applySameMethod,
        rows: applyRows,
        selectedCount: applySelected.size,
        addCount: applyAddCount,
        hadTargets: applyHadTargets,
        onQuery: setApplyQuery,
        onSameMethod: setApplySameMethod,
        onToggle: (id) =>
          setApplySelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          }),
        onClose: () => setApplySourceId(null),
        onConfirm: handleApplyConfirm,
      }}
    />
  );
};

export default YearlyForecastCreatePage;
