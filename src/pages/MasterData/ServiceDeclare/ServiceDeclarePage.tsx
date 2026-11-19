import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
  testMethodService,
  type IndicatorDto,
  type IndicatorGroupDto,
  type SpecimenTypeDto,
  type TestMethodDto,
} from "../../../services/masterDataService";
import {
  serviceCatalogService,
  type BulkCreateServiceItemInput,
  type ServiceCatalogItemDto,
  type ServiceGroupDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { useHeaderHeight, useLeaveConfirm } from "../../../hooks";
import { specimenKeyOf } from "../ServiceCatalog/ServiceCatalog/utils";
import ServiceDeclareView from "./ServiceDeclare/ServiceDeclareView";
import type { IndicatorTreeGroupView } from "./ServiceDeclare/IndicatorTreePanel";
import type { PriceBlockView } from "./ServiceDeclare/PriceDeclarePanel";
import {
  ALL_SPECIMEN_COLUMN,
  SERVICE_CATALOG_URL,
  buildExistingServiceMap,
  buildIndicatorTree,
  cellKeyOf,
  filterServiceGroups,
  groupSpecimensByCategory,
  normalizeSearch,
  parseServiceDeclarePrefill,
  type DeclareColumn,
  type QuickFillScope,
} from "./ServiceDeclare/utils";

const flattenIndicators = (items: IndicatorDto[]): IndicatorDto[] => {
  const map = new Map<string, IndicatorDto>();
  for (const i of items) {
    map.set(i.id, i);
    for (const sub of i.subIndicators ?? []) map.set(sub.id, sub);
  }
  return [...map.values()];
};

const toggleInSet = <T,>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

/** 1 ô của phiếu (chỉ tiêu × nền mẫu) */
interface DeclareCell {
  key: string;
  indicatorId: string;
  columnKey: string;
  specimenTypeId: string | null;
  existing: boolean;
}

/** Container — Phiếu khai báo dịch vụ (TIHE_1811) */
const ServiceDeclarePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headerHeight = useHeaderHeight();
  const [prefill] = useState(() => parseServiceDeclarePrefill(searchParams));

  const [loading, setLoading] = useState(true);
  const [testMethods, setTestMethods] = useState<TestMethodDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupDto[]>([]);
  const [existingServices, setExistingServices] = useState<ServiceCatalogItemDto[]>([]);

  const [serviceName, setServiceName] = useState("");
  /** Tên điền sẵn từ link (?service=) — không tính là đã sửa phiếu */
  const [initialServiceName, setInitialServiceName] = useState("");
  const [testMethodId, setTestMethodId] = useState<string | undefined>(prefill.testMethodId);
  const [allSpecimens, setAllSpecimens] = useState(prefill.specimenTypeId === null);
  const [specimenIds, setSpecimenIds] = useState<string[]>(prefill.specimenTypeId ? [prefill.specimenTypeId] : []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [indicatorQuery, setIndicatorQuery] = useState("");
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<Set<string>>(
    () => new Set(prefill.indicatorId ? [prefill.indicatorId] : [])
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  /** khóa ô → ĐVT đã gõ; không có khóa = theo ĐVT của phương pháp */
  const [units, setUnits] = useState<Record<string, string>>({});
  /** khóa ô đã tích Hợp đồng phụ */
  const [subcontracts, setSubcontracts] = useState<Set<string>>(() => new Set());
  const [foldedBlocks, setFoldedBlocks] = useState<Set<string>>(() => new Set());
  const [blockPrices, setBlockPrices] = useState<Record<string, number | null>>({});
  const [quickPrice, setQuickPrice] = useState<number | null>(null);
  const [quickScope, setQuickScope] = useState<QuickFillScope>("empty");

  useEffect(() => {
    Promise.all([
      testMethodService.getAll(),
      specimenTypeService.getActive(),
      indicatorService.getActive(),
      indicatorGroupService.getActive(),
      serviceCatalogService.getServiceGroups(),
    ])
      .then(([methods, specimens, inds, groups, services]) => {
        const flat = flattenIndicators(inds);
        setTestMethods(methods);
        setSpecimenTypes(specimens.items);
        setIndicators(flat);
        setIndicatorGroups(groups);
        setServiceGroups(services);
        // "+ Thêm" trên thẻ dịch vụ của L2 → điền sẵn tên dịch vụ
        const preService = prefill.serviceGroupId ? services.find((s) => s.id === prefill.serviceGroupId) : undefined;
        if (preService) {
          setServiceName(preService.name);
          setInitialServiceName(preService.name);
        }
        // Mở sẵn nhóm của chỉ tiêu được điền sẵn (nhấp đúp ô trống ma trận)
        const pre = prefill.indicatorId ? flat.find((i) => i.id === prefill.indicatorId) : undefined;
        if (pre) setOpenGroups(new Set([pre.indicatorGroupId || "__none__"]));
      })
      .catch((error) => message.error(getApiErrorMessage(error, "Không tải được danh mục")))
      .finally(() => setLoading(false));
  }, [prefill.indicatorId, prefill.serviceGroupId]);

  // Dịch vụ đã có của phương pháp → các ô trùng hiện "Đã có dịch vụ — bỏ qua"
  useEffect(() => {
    // Bỏ danh sách của PP cũ ngay — tránh hiện nhầm "Đã có" trong lúc tải PP mới
    setExistingServices([]);
    if (!testMethodId) return;
    let cancelled = false;
    serviceCatalogService
      .getList({ testMethodId, priceDate: dayjs().format("YYYY-MM-DD") })
      .then((list) => {
        if (!cancelled) setExistingServices(list.filter((s) => s.testMethodId === testMethodId));
      })
      .catch((error) => message.error(getApiErrorMessage(error, "Không tải được dịch vụ đã có")));
    return () => {
      cancelled = true;
    };
  }, [testMethodId]);

  // ---------- Danh mục ----------
  const activeMethods = useMemo(() => testMethods.filter((m) => m.isActive && m.name !== "-"), [testMethods]);
  const methodOptions = useMemo(
    () => activeMethods.map((m) => ({ value: m.id, label: `${m.name} · ${m.code}` })),
    [activeMethods]
  );
  const selectedMethod = activeMethods.find((m) => m.id === testMethodId);
  const specimenMap = useMemo(() => new Map(specimenTypes.map((s) => [s.id, s])), [specimenTypes]);
  const activeSpecimens = useMemo(() => specimenTypes.filter((s) => s.isActive), [specimenTypes]);
  const tree = useMemo(() => buildIndicatorTree(indicators, indicatorGroups), [indicators, indicatorGroups]);
  const existingMap = useMemo(() => buildExistingServiceMap(existingServices), [existingServices]);
  const trimmedServiceName = serviceName.trim();
  /** Tên trùng dịch vụ có sẵn → gắn vào dịch vụ đó, không thì tạo dịch vụ mới */
  const matchedServiceGroup = useMemo(
    () => filterServiceGroups(serviceGroups, serviceName).exact,
    [serviceGroups, serviceName]
  );
  /** ĐVT (đơn vị tính của chỉ tiêu, in trên phiếu KQ) mặc định của mỗi dòng = ĐVT của phương pháp */
  const defaultUnit = selectedMethod?.unit?.trim() ?? "";

  // ---------- Cột nền mẫu + ô ----------
  const columns = useMemo<DeclareColumn[]>(
    () =>
      allSpecimens
        ? [ALL_SPECIMEN_COLUMN]
        : specimenIds.map((id) => ({ key: specimenKeyOf(id), specimenTypeId: id, name: specimenMap.get(id)?.name ?? "?" })),
    [allSpecimens, specimenIds, specimenMap]
  );
  const selectedIndicators = useMemo(
    () => tree.flatMap((g) => g.indicators).filter((i) => selectedIndicatorIds.has(i.id)),
    [tree, selectedIndicatorIds]
  );
  const cells = useMemo<DeclareCell[]>(
    () =>
      columns.flatMap((c) =>
        selectedIndicators.map((ind) => {
          const key = cellKeyOf(ind.id, c.specimenTypeId);
          return { key, indicatorId: ind.id, columnKey: c.key, specimenTypeId: c.specimenTypeId, existing: existingMap.has(key) };
        })
      ),
    [columns, selectedIndicators, existingMap]
  );
  const unitOf = useCallback((key: string) => (units[key] ?? defaultUnit).trim(), [units, defaultUnit]);
  const newCells = useMemo(() => cells.filter((c) => !c.existing), [cells]);

  const stats = useMemo(() => {
    const perBlock = new Map<string, { newCount: number; pendingCount: number; subcontractCount: number }>();
    let pending = 0;
    let sub = 0;
    let noUnit = 0;
    for (const c of newCells) {
      if (!unitOf(c.key)) noUnit++;
      const s = perBlock.get(c.columnKey) ?? { newCount: 0, pendingCount: 0, subcontractCount: 0 };
      s.newCount++;
      if (prices[c.key] == null) {
        s.pendingCount++;
        pending++;
      }
      if (subcontracts.has(c.key)) {
        s.subcontractCount++;
        sub++;
      }
      perBlock.set(c.columnKey, s);
    }
    return { perBlock, pending, sub, noUnit };
  }, [newCells, prices, subcontracts, unitOf]);

  const newCount = newCells.length;
  const existingCount = cells.length - newCount;

  // ---------- Cây chỉ tiêu ----------
  const treeGroups = useMemo<IndicatorTreeGroupView[]>(() => {
    const q = normalizeSearch(indicatorQuery.trim());
    return tree.flatMap((g) => {
      const groupMatch = !q || normalizeSearch(g.name).includes(q);
      const matched = groupMatch ? g.indicators : g.indicators.filter((i) => normalizeSearch(`${i.code ?? ""} ${i.name}`).includes(q));
      if (matched.length === 0) return [];
      const open = q ? true : openGroups.has(g.id);
      return [
        {
          id: g.id,
          name: g.name,
          total: g.indicators.length,
          selectedCount: g.indicators.reduce((n, i) => n + (selectedIndicatorIds.has(i.id) ? 1 : 0), 0),
          open,
          items: open ? matched : [],
        },
      ];
    });
  }, [tree, indicatorQuery, openGroups, selectedIndicatorIds]);

  const handleToggleIndicator = useCallback((id: string) => setSelectedIndicatorIds((prev) => toggleInSet(prev, id)), []);
  const handleToggleGroupOpen = useCallback((id: string) => setOpenGroups((prev) => toggleInSet(prev, id)), []);
  const handleToggleGroupSelect = useCallback(
    (groupId: string) => {
      const ids = tree.find((g) => g.id === groupId)?.indicators.map((i) => i.id) ?? [];
      setSelectedIndicatorIds((prev) => {
        const next = new Set(prev);
        const allOn = ids.every((id) => next.has(id));
        for (const id of ids) {
          if (allOn) next.delete(id);
          else next.add(id);
        }
        return next;
      });
    },
    [tree]
  );

  // ---------- Nền mẫu ----------
  const specimenGroups = useMemo(() => groupSpecimensByCategory(activeSpecimens, pickerQuery), [activeSpecimens, pickerQuery]);
  const specimenIdSet = useMemo(() => new Set(specimenIds), [specimenIds]);
  const handleToggleSpecimen = useCallback(
    (id: string) => setSpecimenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    []
  );
  const handleToggleCategory = useCallback((ids: string[], select: boolean) => {
    setSpecimenIds((prev) => (select ? [...prev, ...ids.filter((id) => !prev.includes(id))] : prev.filter((id) => !ids.includes(id))));
  }, []);

  // ---------- Giá ----------
  const handlePriceChange = useCallback(
    (key: string, value: number | null) => setPrices((prev) => ({ ...prev, [key]: value })),
    []
  );
  const handleCopyPrice = useCallback(
    (indicatorId: string, value: number) => {
      setPrices((prev) => {
        const next = { ...prev };
        for (const c of columns) {
          const key = cellKeyOf(indicatorId, c.specimenTypeId);
          if (!existingMap.has(key)) next[key] = value;
        }
        return next;
      });
    },
    [columns, existingMap]
  );
  const handleUnitChange = useCallback(
    (key: string, value: string) => setUnits((prev) => ({ ...prev, [key]: value })),
    []
  );
  const handleSubcontractChange = useCallback((key: string, checked: boolean) => {
    setSubcontracts((prev) => {
      if (prev.has(key) === checked) return prev;
      return toggleInSet(prev, key);
    });
  }, []);
  const handleToggleFold = useCallback((key: string) => setFoldedBlocks((prev) => toggleInSet(prev, key)), []);
  const handleBlockPriceChange = useCallback(
    (key: string, value: number | null) => setBlockPrices((prev) => ({ ...prev, [key]: value })),
    []
  );
  const fillPrices = (targets: DeclareCell[], value: number) =>
    setPrices((prev) => {
      const next = { ...prev };
      for (const c of targets) next[c.key] = value;
      return next;
    });
  const handleFillBlock = (columnKey: string) => {
    const value = blockPrices[columnKey];
    if (value == null) return;
    fillPrices(
      newCells.filter((c) => c.columnKey === columnKey && prices[c.key] == null),
      value
    );
  };
  const handleQuickFill = () => {
    if (quickPrice == null) return;
    fillPrices(quickScope === "all" ? newCells : newCells.filter((c) => prices[c.key] == null), quickPrice);
  };

  const blocks = useMemo<PriceBlockView[]>(
    () =>
      columns.map((column) => ({
        column,
        stats: stats.perBlock.get(column.key) ?? { newCount: 0, pendingCount: 0, subcontractCount: 0 },
        folded: foldedBlocks.has(column.key),
        blockPrice: blockPrices[column.key] ?? null,
      })),
    [columns, stats, foldedBlocks, blockPrices]
  );

  // ---------- Hủy / Tạo ----------
  const dirty =
    selectedIndicatorIds.size > 0 || specimenIds.length > 0 || allSpecimens || trimmedServiceName !== initialServiceName.trim();
  // Rời phiếu bằng mọi đường (nút quay lại, Hủy, menu sang trang khác, đóng tab) đều hỏi lại
  const allowLeave = useLeaveConfirm(dirty, {
    title: "Hủy phiếu khai báo?",
    content: "Các lựa chọn và giá đã nhập trên phiếu sẽ không được lưu.",
    okText: "Hủy phiếu",
    cancelText: "Tiếp tục khai báo",
  });
  const handleCancel = () => navigate(SERVICE_CATALOG_URL);

  const problems: string[] = [];
  if (!trimmedServiceName) problems.push("Chưa nhập tên dịch vụ");
  if (stats.noUnit > 0) problems.push(`${stats.noUnit} dòng chưa nhập ĐVT`);
  const canSubmit =
    !!testMethodId && columns.length > 0 && selectedIndicators.length > 0 && newCount > 0 && problems.length === 0;
  const handleSubmit = async () => {
    if (!canSubmit || !testMethodId) return;
    const items: BulkCreateServiceItemInput[] = newCells.map((c) => ({
      indicatorId: c.indicatorId,
      specimenTypeId: c.specimenTypeId,
      unitPrice: prices[c.key] ?? null,
      unit: unitOf(c.key),
      isSubcontract: subcontracts.has(c.key),
    }));
    try {
      const result = await serviceCatalogService.bulkCreate({
        testMethodId,
        serviceGroupId: matchedServiceGroup?.id ?? null,
        serviceGroupName: matchedServiceGroup ? null : trimmedServiceName,
        items,
      });
      message.success(
        `Đã tạo ${result.createdCount} dịch vụ${result.skippedCount ? `, bỏ qua ${result.skippedCount} đã có` : ""}`
      );
      allowLeave();
      navigate(SERVICE_CATALOG_URL);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tạo được dịch vụ"));
    }
  };

  const nameDone = !!trimmedServiceName;
  const methodDone = !!testMethodId;
  const specimenDone = columns.length > 0;
  const indicatorDone = selectedIndicators.length > 0;
  const treeLockMessage = !nameDone
    ? "Nhập tên dịch vụ ở bước ① rồi chọn phương pháp ở bước ②."
    : !methodDone
      ? "Chọn phương pháp ở bước ② trước."
      : undefined;

  return (
    <ServiceDeclareView
      headerHeight={headerHeight}
      loading={loading}
      newCount={newCount}
      onBack={handleCancel}
      setup={{
        serviceName,
        serviceGroups,
        onServiceNameChange: setServiceName,
        methodOptions,
        testMethodId,
        onTestMethodChange: setTestMethodId,
        allSpecimens,
        onAllSpecimensChange: setAllSpecimens,
        selectedSpecimens: specimenIds.map((id) => ({ id, name: specimenMap.get(id)?.name ?? "?" })),
        onRemoveSpecimen: handleToggleSpecimen,
        pickerOpen,
        onPickerOpenChange: setPickerOpen,
        picker: {
          query: pickerQuery,
          groups: specimenGroups,
          selectedIds: specimenIdSet,
          onQueryChange: setPickerQuery,
          onToggleSpecimen: handleToggleSpecimen,
          onToggleCategory: handleToggleCategory,
          onDone: () => setPickerOpen(false),
        },
        step1: { done: nameDone, active: !nameDone },
        step2: { done: methodDone, active: nameDone && !methodDone },
        step3: { done: specimenDone, active: nameDone && methodDone && !specimenDone },
      }}
      tree={{
        step: { done: indicatorDone, active: nameDone && methodDone && specimenDone && !indicatorDone },
        lockMessage: treeLockMessage,
        query: indicatorQuery,
        groups: treeGroups,
        selectedIds: selectedIndicatorIds,
        selectedCount: selectedIndicators.length,
        onQueryChange: setIndicatorQuery,
        onToggleGroupOpen: handleToggleGroupOpen,
        onToggleGroupSelect: handleToggleGroupSelect,
        onToggleIndicator: handleToggleIndicator,
      }}
      prices={{
        step: {
          done: newCount > 0 && stats.pending === 0 && stats.noUnit === 0,
          active: indicatorDone && (stats.pending > 0 || stats.noUnit > 0),
        },
        indicators: selectedIndicators,
        blocks,
        quickFill: {
          price: quickPrice,
          scope: quickScope,
          emptyCount: stats.pending,
          totalCount: newCount,
          onPriceChange: setQuickPrice,
          onScopeChange: setQuickScope,
          onApply: handleQuickFill,
        },
        shared: {
          prices,
          units,
          defaultUnit,
          subcontracts,
          existingServices: existingMap,
          canCopy: columns.length >= 2,
          onToggleFold: handleToggleFold,
          onBlockPriceChange: handleBlockPriceChange,
          onFillBlock: handleFillBlock,
          onPriceChange: handlePriceChange,
          onUnitChange: handleUnitChange,
          onCopyPrice: handleCopyPrice,
          onSubcontractChange: handleSubcontractChange,
        },
      }}
      footer={{
        problems,
        summary: {
          serviceName,
          methodName: selectedMethod?.name,
          specimenLabel: allSpecimens ? "Mọi nền mẫu" : `${columns.length} nền mẫu`,
          indicatorCount: selectedIndicators.length,
          newCount,
          existingCount,
          pendingCount: stats.pending,
          subcontractCount: stats.sub,
        },
        canSubmit,
        onCancel: handleCancel,
        onSubmit: handleSubmit,
      }}
    />
  );
};

export default ServiceDeclarePage;
