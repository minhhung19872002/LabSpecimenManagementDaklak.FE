import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useHeaderHeight, useLeaveConfirm } from "../../../hooks";
import type { ProductType } from "../../../services/productService";
import {
  batchNormService,
  type BatchNormComboDto,
  type BatchNormProductOptionDto,
  type BatchNormServiceGroupOptionDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import BatchNormCreateView from "./BatchNormCreate/BatchNormCreateView";
import type { SummaryChip } from "./BatchNormCreate/CreateFooter";
import {
  BATCH_NORM_LIST_URL,
  EMPTY_PICK_FILTER,
  applyPickTab,
  buildPickFilterOptions,
  buildSelectedTree,
  buildServiceGroupOptions,
  codeAt,
  codeRangeText,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboSpecimenNameOf,
  filterPickBase,
  filterProductOptions,
  isMaterialMissing,
  isEquipmentMissing,
  serviceGroupKeyOf,
  sortCombos,
  uniqueNames,
  type BatchNormCreatedState,
  type FoldState,
  type PickFilter,
  type PickTab,
  type PickedEquipment,
  type PickedMaterial,
} from "./BatchNormCreate/utils";

const toggleInSet = <T,>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const byId = (items: readonly BatchNormProductOptionDto[]): Map<string, BatchNormProductOptionDto> =>
  new Map(items.map((p) => [p.id, p]));

/** Tóm tắt ≤ 2 tên thì liệt kê, nhiều hơn thì đếm */
const listText = (names: string[]): string => (names.length <= 2 ? names.join(", ") || "—" : `${names.length} mục`);

/** Container — Phiếu khai báo định mức theo mẻ */
const BatchNormCreatePage = () => {
  const navigate = useNavigate();
  const headerHeight = useHeaderHeight();

  // ---------- Dữ liệu nguồn ----------
  const [loading, setLoading] = useState(true);
  const [serviceGroups, setServiceGroups] = useState<BatchNormServiceGroupOptionDto[]>([]);
  const [materialOptions, setMaterialOptions] = useState<BatchNormProductOptionDto[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<BatchNormProductOptionDto[]>([]);
  const [capacityUnits, setCapacityUnits] = useState<string[]>([]);
  const [nextCode, setNextCode] = useState("");
  const [serviceGroupKey, setServiceGroupKey] = useState<string>();
  const [combos, setCombos] = useState<BatchNormComboDto[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // ---------- ① Áp dụng cho ----------
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [selFold, setSelFold] = useState<FoldState>({});
  const [pickOpen, setPickOpen] = useState(false);
  const [pickFilter, setPickFilter] = useState<PickFilter>(EMPTY_PICK_FILTER);
  const [pickTab, setPickTab] = useState<PickTab>("all");

  // ---------- ② Vật tư & thiết bị ----------
  const [materials, setMaterials] = useState<PickedMaterial[]>([]);
  const [equipments, setEquipments] = useState<PickedEquipment[]>([]);
  const [typeFilter, setTypeFilter] = useState<ProductType | null>(null);
  const [materialOpen, setMaterialOpen] = useState(true);
  const [equipmentOpen, setEquipmentOpen] = useState(true);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    batchNormService
      .getCreateOptions()
      .then((data) => {
        if (cancelled) return;
        setServiceGroups(data.serviceGroups);
        setMaterialOptions(data.materials);
        setEquipmentOptions(data.equipments);
        setCapacityUnits(data.capacityUnits);
        setNextCode(data.nextCode);
        // Mặc định: tên dịch vụ đầu tiên còn bộ chưa có định mức
        const first = data.serviceGroups.find((g) => g.freeCount > 0) ?? data.serviceGroups[0];
        if (first) setServiceGroupKey(serviceGroupKeyOf(first));
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được dữ liệu phiếu định mức"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const serviceGroup = useMemo(
    () => serviceGroups.find((g) => serviceGroupKeyOf(g) === serviceGroupKey),
    [serviceGroups, serviceGroupKey]
  );

  useEffect(() => {
    if (!serviceGroup) {
      setCombos([]);
      return;
    }
    let cancelled = false;
    setCombosLoading(true);
    batchNormService
      .getCreateOptions(serviceGroup.id ? { serviceGroupId: serviceGroup.id } : { ungrouped: true })
      .then((data) => {
        if (cancelled) return;
        setCombos(data.combos);
        setNextCode(data.nextCode);
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được danh sách bộ của tên dịch vụ"));
      })
      .finally(() => {
        if (!cancelled) setCombosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceGroup, reloadToken]);

  const handleServiceGroupChange = useCallback((key: string) => {
    setServiceGroupKey(key);
    setSelected(new Set());
    setSelFold({});
    setPickFilter(EMPTY_PICK_FILTER);
    setPickTab("all");
  }, []);

  // ---------- Bộ đã chọn ----------
  const sortedCombos = useMemo(() => sortCombos(combos), [combos]);
  /** Đã sắp xếp đúng thứ tự BE gán mã */
  const chosen = useMemo(
    () => sortedCombos.filter((c) => selected.has(c.testMethodIndicatorId) && !c.existingNormCode),
    [sortedCombos, selected]
  );
  const createCount = chosen.length;
  const tree = useMemo(() => buildSelectedTree(chosen, nextCode), [chosen, nextCode]);
  const codeById = useMemo(
    () => new Map(chosen.map((c, i) => [c.testMethodIndicatorId, codeAt(nextCode, i)])),
    [chosen, nextCode]
  );
  const codeRange = codeRangeText(nextCode, createCount);

  const handleToggleFold = useCallback((key: string, collapse: boolean) => {
    setSelFold((prev) => ({ ...prev, [key]: collapse }));
  }, []);
  const handleCollapseAll = useCallback(() => {
    setSelFold(Object.fromEntries(tree.map((g) => [g.foldKey, true])));
  }, [tree]);
  const handleRemove = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ---------- Popup chọn bộ ----------
  const pickBase = useMemo(() => filterPickBase(sortedCombos, pickFilter), [sortedCombos, pickFilter]);
  const pickRows = useMemo(() => applyPickTab(pickBase, pickTab, selected), [pickBase, pickTab, selected]);
  const pickFilterOptions = useMemo(() => buildPickFilterOptions(sortedCombos, pickFilter), [sortedCombos, pickFilter]);
  const tabCounts = useMemo(
    () => ({
      all: pickBase.length,
      free: applyPickTab(pickBase, "free", selected).length,
      sel: applyPickTab(pickBase, "sel", selected).length,
    }),
    [pickBase, selected]
  );
  const visibleFreeIds = useMemo(
    () => pickRows.filter((c) => !c.existingNormCode).map((c) => c.testMethodIndicatorId),
    [pickRows]
  );

  const handleToggleCombo = useCallback((id: string) => setSelected((prev) => toggleInSet(prev, id)), []);
  const handleSelectAll = useCallback((ids: string[], select: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  // ---------- Vật tư & thiết bị ----------
  const materialById = useMemo(() => byId(materialOptions), [materialOptions]);
  const equipmentById = useMemo(() => byId(equipmentOptions), [equipmentOptions]);
  const materialAddOptions = useMemo(
    () => filterProductOptions(materialOptions, new Set(materials.map((m) => m.productId)), "", typeFilter, () => ""),
    [materialOptions, materials, typeFilter]
  );
  const equipmentAddOptions = useMemo(
    () => filterProductOptions(equipmentOptions, new Set(equipments.map((e) => e.productId)), "", null, () => ""),
    [equipmentOptions, equipments]
  );
  const typeCounts = useMemo(() => {
    const map = new Map<ProductType, number>();
    for (const m of materials) {
      const type = materialById.get(m.productId)?.productType;
      if (type != null) map.set(type, (map.get(type) ?? 0) + 1);
    }
    return map;
  }, [materials, materialById]);

  const handleAddMaterial = useCallback(
    (productId: string) => {
      const p = materialById.get(productId);
      if (!p) return;
      const unitId = p.units.some((u) => u.id === p.defaultUnitId) ? p.defaultUnitId ?? null : p.units[0]?.id ?? null;
      setMaterials((prev) => (prev.some((m) => m.productId === productId) ? prev : [...prev, { productId, quantity: null, unitId }]));
      setMaterialOpen(true);
    },
    [materialById]
  );
  const handleQuantity = useCallback((productId: string, quantity: number | null) => {
    setMaterials((prev) => prev.map((m) => (m.productId === productId ? { ...m, quantity } : m)));
  }, []);
  const handleUnit = useCallback((productId: string, unitId: string | null) => {
    setMaterials((prev) => prev.map((m) => (m.productId === productId ? { ...m, unitId } : m)));
  }, []);
  const handleRemoveMaterial = useCallback((productId: string) => {
    setMaterials((prev) => prev.filter((m) => m.productId !== productId));
  }, []);

  const handleAddEquipment = useCallback(
    (productId: string) => {
      setEquipments((prev) =>
        prev.some((e) => e.productId === productId)
          ? prev
          : [...prev, { productId, capacity: null, capacityUnit: capacityUnits[0] ?? "" }]
      );
      setEquipmentOpen(true);
    },
    [capacityUnits]
  );
  const handleCapacity = useCallback((productId: string, capacity: number | null) => {
    setEquipments((prev) => prev.map((e) => (e.productId === productId ? { ...e, capacity } : e)));
  }, []);
  const handleCapacityUnit = useCallback((productId: string, capacityUnit: string) => {
    setEquipments((prev) => prev.map((e) => (e.productId === productId ? { ...e, capacityUnit } : e)));
  }, []);
  const handleRemoveEquipment = useCallback((productId: string) => {
    setEquipments((prev) => prev.filter((e) => e.productId !== productId));
  }, []);

  // ---------- Kiểm tra / tóm tắt ----------
  const materialMissing = materials.filter(isMaterialMissing).length;
  const equipmentMissing = equipments.filter(isEquipmentMissing).length;
  const problems: string[] = [];
  if (!createCount) problems.push("Chưa chọn bộ áp dụng");
  if (!materials.length) problems.push("Chưa có vật tư");
  if (materialMissing) problems.push(`${materialMissing} vật tư chưa nhập lượng hoặc đơn vị`);
  if (equipmentMissing) problems.push(`${equipmentMissing} thiết bị chưa nhập công suất sử dụng`);
  const invalid = problems.length > 0;
  const missingText = [
    materialMissing ? `${materialMissing} vật tư chưa nhập lượng` : "",
    equipmentMissing ? `${equipmentMissing} thiết bị chưa nhập công suất` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const specimenNames = uniqueNames(chosen, comboSpecimenNameOf);
  const indicatorNames = uniqueNames(chosen, comboIndicatorNameOf);
  const methodNames = uniqueNames(chosen, comboMethodNameOf);
  const chips: SummaryChip[] = [
    { key: "Dịch vụ", value: serviceGroup?.name ?? "—", title: serviceGroup?.name ?? "", colors: ["#e6f4ff", "#0958d9", "#91caff"] },
    { key: "Nền mẫu", value: listText(specimenNames), title: specimenNames.join(", "), colors: ["#fff7e6", "#873800", "#ffd591"] },
    { key: "Chỉ tiêu", value: listText(indicatorNames), title: indicatorNames.join(", "), colors: ["#fafafa", "#262626", "#d9d9d9"] },
    { key: "Phương pháp", value: listText(methodNames), title: methodNames.join(", "), colors: ["#e6fffb", "#00474f", "#87e8de"] },
    { key: "Vật tư", value: String(materials.length), title: `${materials.length} vật tư`, colors: ["#f0f5ff", "#10239e", "#adc6ff"] },
    { key: "Thiết bị", value: String(equipments.length), title: `${equipments.length} thiết bị`, colors: ["#e6fffb", "#006d75", "#87e8de"] },
  ];

  // ---------- Hủy / Tạo ----------
  const dirty = selected.size > 0 || materials.length > 0 || equipments.length > 0;
  // Rời phiếu bằng mọi đường (quay lại, Hủy, menu, đóng tab) đều hỏi lại
  const allowLeave = useLeaveConfirm(dirty, {
    title: "Hủy phiếu khai báo định mức?",
    content: "Các bộ đã chọn, vật tư và thiết bị đã nhập trên phiếu sẽ không được lưu.",
    okText: "Hủy phiếu",
    cancelText: "Tiếp tục khai báo",
  });
  const handleBack = useCallback(() => navigate(BATCH_NORM_LIST_URL), [navigate]);

  const handleSubmit = async (): Promise<void> => {
    if (invalid) {
      setTried(true);
      return;
    }
    try {
      const created = await batchNormService.bulkCreate({
        testMethodIndicatorIds: chosen.map((c) => c.testMethodIndicatorId),
        materials: materials.map((m) => ({ productId: m.productId, quantity: m.quantity ?? 0, unitId: m.unitId ?? "" })),
        equipments: equipments.map((e) => ({ productId: e.productId, capacity: e.capacity ?? 0, capacityUnit: e.capacityUnit })),
      });
      const codes = created.map((n) => n.code).sort();
      const range = codes.length > 1 ? `${codes[0]} → ${codes[codes.length - 1]}` : codes[0] ?? "";
      const state: BatchNormCreatedState = {
        createdToast: `Đã tạo ${created.length} định mức${range ? ` (${range})` : ""}`,
        createdIds: created.map((n) => n.id),
      };
      allowLeave();
      navigate(BATCH_NORM_LIST_URL, { state });
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tạo được định mức"));
      // Bộ có thể vừa được người khác tạo định mức / mã kế tiếp đã đổi → tải lại
      setReloadToken((t) => t + 1);
    }
  };

  return (
    <BatchNormCreateView
      headerHeight={headerHeight}
      loading={loading || combosLoading}
      headerSummary={`${createCount} định mức · ${materials.length} vật tư · ${equipments.length} thiết bị`}
      onBack={handleBack}
      apply={{
        step: { done: createCount > 0, active: createCount === 0 },
        serviceGroupKey,
        serviceGroupOptions: buildServiceGroupOptions(serviceGroups),
        tree,
        selectedCount: createCount,
        fold: selFold,
        showError: tried && createCount === 0,
        onServiceGroupChange: handleServiceGroupChange,
        onOpenPick: () => setPickOpen(true),
        onToggleFold: handleToggleFold,
        onExpandAll: () => setSelFold({}),
        onCollapseAll: handleCollapseAll,
        onRemove: handleRemove,
      }}
      items={{
        step: {
          done: materials.length > 0 && !materialMissing && !equipmentMissing,
          active: createCount > 0 && (materialMissing + equipmentMissing > 0 || materials.length === 0),
        },
        createCount,
        missingText,
        materials: {
          picked: materials,
          productById: materialById,
          addOptions: materialAddOptions,
          typeFilter,
          typeCounts,
          missingCount: materialMissing,
          open: materialOpen,
          tried,
          onToggleOpen: () => setMaterialOpen((o) => !o),
          onTypeFilter: setTypeFilter,
          onAdd: handleAddMaterial,
          onQuantity: handleQuantity,
          onUnit: handleUnit,
          onRemove: handleRemoveMaterial,
        },
        equipments: {
          picked: equipments,
          productById: equipmentById,
          addOptions: equipmentAddOptions,
          capacityUnits,
          missingCount: equipmentMissing,
          open: equipmentOpen,
          tried,
          onToggleOpen: () => setEquipmentOpen((o) => !o),
          onAdd: handleAddEquipment,
          onCapacity: handleCapacity,
          onCapacityUnit: handleCapacityUnit,
          onRemove: handleRemoveEquipment,
        },
      }}
      footer={{
        chips,
        createCount,
        problems: tried ? problems : [],
        invalid,
        onCancel: handleBack,
        onSubmit: handleSubmit,
      }}
      pick={{
        open: pickOpen,
        serviceGroupName: serviceGroup?.name ?? "",
        filter: pickFilter,
        filterOptions: pickFilterOptions,
        tab: pickTab,
        tabCounts,
        rows: pickRows,
        visibleFreeIds,
        selected,
        codeById,
        codeRange,
        onFilterChange: (patch) => setPickFilter((prev) => ({ ...prev, ...patch })),
        onClearFilter: () => setPickFilter((prev) => ({ ...EMPTY_PICK_FILTER, onlyFree: prev.onlyFree })),
        onTabChange: setPickTab,
        onToggle: handleToggleCombo,
        onSelectAll: handleSelectAll,
        onClearSelected: () => setSelected(new Set()),
        onClose: () => setPickOpen(false),
      }}
    />
  );
};

export default BatchNormCreatePage;
