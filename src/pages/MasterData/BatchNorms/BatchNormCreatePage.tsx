import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHeaderHeight, useLeaveConfirm } from "../../../hooks";
import type { ProductType } from "../../../services/productService";
import {
  batchNormService,
  type BatchNormComboDto,
  type BatchNormMaterialLineInput,
  type BatchNormEquipmentLineInput,
  type BatchNormProductOptionDto,
  type BatchNormServiceGroupOptionDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import type { AddKind } from "./BatchNormCreate/AddProductModal";
import BatchNormCreateView from "./BatchNormCreate/BatchNormCreateView";
import type { SummaryChip } from "./BatchNormCreate/CreateFooter";
import {
  ALL_SERVICES_KEY,
  BATCH_NORM_LIST_URL,
  EMPTY_PICK_FILTER,
  applyPickTab,
  buildPickFilterOptions,
  buildSelectedTree,
  buildServiceGroupOptions,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboPathOf,
  comboSpecimenNameOf,
  equipmentTypeName,
  filterCombosByService,
  filterCopySources,
  filterPickBase,
  filterProductOptions,
  isComboLocked,
  isEquipmentMissing,
  isMaterialMissing,
  materialTypeName,
  serviceGroupKeyOf,
  sortCombos,
  uniqueNames,
  type BatchNormCreatedState,
  type FoldState,
  type NormFormMode,
  type PickFilter,
  type PickTab,
  type PickedEquipment,
  type PickedMaterial,
} from "./BatchNormCreate/utils";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const TOAST_MS = 3000;

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

/** Đơn vị tiêu hao mặc định: đơn vị mặc định của vật tư nếu hợp lệ, không thì đơn vị đầu tiên */
const defaultUnitOf = (p: BatchNormProductOptionDto | undefined): string | null => {
  if (!p) return null;
  return p.units.some((u) => u.id === p.defaultUnitId) ? p.defaultUnitId ?? null : p.units[0]?.id ?? null;
};

/** Dòng định mức từ BE → dòng trên phiếu (đơn vị không còn hợp lệ → về mặc định) */
const toPickedMaterials = (
  lines: readonly BatchNormMaterialLineInput[],
  productById: ReadonlyMap<string, BatchNormProductOptionDto>,
  knownOnly: boolean
): PickedMaterial[] =>
  lines
    .filter((l) => !knownOnly || productById.has(l.productId))
    .map((l) => {
      const p = productById.get(l.productId);
      const unitOk = l.unitId && l.unitId !== EMPTY_GUID && (!p || p.units.some((u) => u.id === l.unitId));
      return { productId: l.productId, quantity: l.quantity || null, unitId: unitOk ? l.unitId : defaultUnitOf(p) };
    });

const toPickedEquipments = (
  lines: readonly BatchNormEquipmentLineInput[],
  productById: ReadonlyMap<string, BatchNormProductOptionDto>,
  knownOnly: boolean
): PickedEquipment[] =>
  lines
    .filter((l) => !knownOnly || productById.has(l.productId))
    .map((l) => ({ productId: l.productId, capacity: l.capacity || null, capacityUnit: l.capacityUnit ?? "" }));

const snapshotOf = (materials: readonly PickedMaterial[], equipments: readonly PickedEquipment[]): string =>
  JSON.stringify([materials, equipments]);

/** Container — Phiếu khai báo / sửa định mức theo mẻ */
const BatchNormCreatePage = () => {
  const navigate = useNavigate();
  const headerHeight = useHeaderHeight();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit") || undefined;
  const mode: NormFormMode = editId ? "edit" : "create";
  const isEdit = mode === "edit";

  // ---------- Dữ liệu nguồn ----------
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(isEdit);
  const [serviceGroups, setServiceGroups] = useState<BatchNormServiceGroupOptionDto[]>([]);
  const [materialOptions, setMaterialOptions] = useState<BatchNormProductOptionDto[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<BatchNormProductOptionDto[]>([]);
  const [capacityUnits, setCapacityUnits] = useState<string[]>([]);
  const [combos, setCombos] = useState<BatchNormComboDto[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  /** Bộ đang sửa + nội dung ban đầu (để biết đã thay đổi chưa) */
  const [editCombo, setEditCombo] = useState<BatchNormComboDto | null>(null);
  const [snapshot, setSnapshot] = useState("");

  // ---------- ① Áp dụng cho ----------
  const [serviceKey, setServiceKey] = useState<string>(ALL_SERVICES_KEY);
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
  const [toast, setToast] = useState("");

  // ---------- Popup thêm vật tư / thiết bị ----------
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [addType, setAddType] = useState<ProductType | null>(null);
  const [addSelected, setAddSelected] = useState<ReadonlySet<string>>(new Set());

  // ---------- Popup sao chép định mức ----------
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyQuery, setCopyQuery] = useState("");
  const [copyPickId, setCopyPickId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    batchNormService
      .getCreateOptions()
      .then((data) => {
        if (cancelled) return;
        setServiceGroups(data.serviceGroups);
        setMaterialOptions(data.materials);
        setEquipmentOptions(data.equipments);
        setCapacityUnits(data.capacityUnits);
        setCombos(data.combos);
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được dữ liệu phiếu định mức"));
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // Sửa: nạp định mức hiện có 1 lần (không nạp lại khi reload danh sách để giữ phần đang sửa)
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setDetailLoading(true);
    batchNormService
      .getDetail(editId)
      .then((detail) => {
        if (cancelled) return;
        const nextMaterials = toPickedMaterials(detail.materials, new Map(), false);
        const nextEquipments = toPickedEquipments(detail.equipments, new Map(), false);
        setEditCombo(detail.combo);
        setMaterials(nextMaterials);
        setEquipments(nextEquipments);
        setSnapshot(snapshotOf(nextMaterials, nextEquipments));
      })
      .catch((error) => {
        if (!cancelled) message.error(getApiErrorMessage(error, "Không tải được định mức cần sửa"));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ---------- Bộ đã chọn ----------
  const sortedCombos = useMemo(() => sortCombos(combos), [combos]);
  const isLocked = useCallback((c: BatchNormComboDto) => isComboLocked(c, mode, editId), [mode, editId]);
  const lockedIds = useMemo(
    () => new Set(sortedCombos.filter(isLocked).map((c) => c.testMethodIndicatorId)),
    [sortedCombos, isLocked]
  );
  const chosen = useMemo(
    () => sortedCombos.filter((c) => selected.has(c.testMethodIndicatorId) && !isLocked(c)),
    [sortedCombos, selected, isLocked]
  );
  const createCount = chosen.length;
  const tree = useMemo(() => buildSelectedTree(chosen), [chosen]);

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
  const serviceCombos = useMemo(() => filterCombosByService(sortedCombos, serviceKey), [sortedCombos, serviceKey]);
  const serviceName = useMemo(
    () => serviceGroups.find((g) => serviceGroupKeyOf(g) === serviceKey)?.name ?? "",
    [serviceGroups, serviceKey]
  );
  const pickBase = useMemo(() => filterPickBase(serviceCombos, pickFilter), [serviceCombos, pickFilter]);
  const pickRows = useMemo(() => applyPickTab(pickBase, pickTab, selected, isLocked), [pickBase, pickTab, selected, isLocked]);
  const pickFilterOptions = useMemo(() => buildPickFilterOptions(serviceCombos, pickFilter), [serviceCombos, pickFilter]);
  const tabCounts = useMemo(
    () => ({
      all: pickBase.length,
      free: applyPickTab(pickBase, "free", selected, isLocked).length,
      sel: applyPickTab(pickBase, "sel", selected, isLocked).length,
    }),
    [pickBase, selected, isLocked]
  );
  const visibleFreeIds = useMemo(
    () => pickRows.filter((c) => !isLocked(c)).map((c) => c.testMethodIndicatorId),
    [pickRows, isLocked]
  );

  const handleServiceChange = useCallback((key: string) => {
    // Giữ các bộ đã chọn — chỉ đổi phạm vi danh sách trong popup
    setServiceKey(key);
    setPickFilter(EMPTY_PICK_FILTER);
  }, []);
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
  const typeCounts = useMemo(() => {
    const map = new Map<ProductType, number>();
    for (const m of materials) {
      const type = materialById.get(m.productId)?.productType;
      if (type != null) map.set(type, (map.get(type) ?? 0) + 1);
    }
    return map;
  }, [materials, materialById]);

  const handleQuantity = useCallback((productId: string, quantity: number | null) => {
    setMaterials((prev) => prev.map((m) => (m.productId === productId ? { ...m, quantity } : m)));
  }, []);
  const handleUnit = useCallback((productId: string, unitId: string | null) => {
    setMaterials((prev) => prev.map((m) => (m.productId === productId ? { ...m, unitId } : m)));
  }, []);
  const handleRemoveMaterial = useCallback((productId: string) => {
    setMaterials((prev) => prev.filter((m) => m.productId !== productId));
  }, []);
  const handleCapacity = useCallback((productId: string, capacity: number | null) => {
    setEquipments((prev) => prev.map((e) => (e.productId === productId ? { ...e, capacity } : e)));
  }, []);
  const handleCapacityUnit = useCallback((productId: string, capacityUnit: string) => {
    setEquipments((prev) => prev.map((e) => (e.productId === productId ? { ...e, capacityUnit } : e)));
  }, []);
  const handleRemoveEquipment = useCallback((productId: string) => {
    setEquipments((prev) => prev.filter((e) => e.productId !== productId));
  }, []);

  // ---------- Popup thêm ----------
  const openAdd = useCallback((kind: AddKind) => {
    setAdding(kind);
    setAddQuery("");
    setAddType(null);
    setAddSelected(new Set());
  }, []);
  const addRows = useMemo(() => {
    if (adding === "material")
      return filterProductOptions(materialOptions, new Set(materials.map((m) => m.productId)), addQuery, addType, (p) =>
        materialTypeName(p.productType)
      );
    if (adding === "equipment")
      return filterProductOptions(equipmentOptions, new Set(equipments.map((e) => e.productId)), addQuery, null, () =>
        equipmentTypeName()
      );
    return [];
  }, [adding, materialOptions, equipmentOptions, materials, equipments, addQuery, addType]);

  const handleConfirmAdd = useCallback(() => {
    const ids = [...addSelected];
    if (!ids.length || !adding) return;
    if (adding === "material") {
      setMaterials((prev) => {
        const have = new Set(prev.map((m) => m.productId));
        const added = ids
          .filter((id) => !have.has(id))
          .map((productId) => ({ productId, quantity: null, unitId: defaultUnitOf(materialById.get(productId)) }));
        return [...prev, ...added];
      });
      setMaterialOpen(true);
      setTypeFilter(null);
      setToast(`Đã thêm ${ids.length} vật tư`);
    } else {
      setEquipments((prev) => {
        const have = new Set(prev.map((e) => e.productId));
        const added = ids
          .filter((id) => !have.has(id))
          .map((productId) => ({ productId, capacity: null, capacityUnit: capacityUnits[0] ?? "" }));
        return [...prev, ...added];
      });
      setEquipmentOpen(true);
      setToast(`Đã thêm ${ids.length} thiết bị`);
    }
    setAdding(null);
  }, [addSelected, adding, materialById, capacityUnits]);

  // ---------- Popup sao chép ----------
  const copyRows = useMemo(() => filterCopySources(sortedCombos, copyQuery, editId), [sortedCombos, copyQuery, editId]);
  const copyPicked = useMemo(
    () => sortedCombos.find((c) => c.testMethodIndicatorId === copyPickId) ?? null,
    [sortedCombos, copyPickId]
  );
  const openCopy = useCallback(() => {
    setCopyOpen(true);
    setCopyQuery("");
    setCopyPickId(null);
  }, []);
  const handleCopy = async (): Promise<void> => {
    if (!copyPicked) return;
    try {
      const detail = await batchNormService.getDetail(copyPicked.testMethodIndicatorId);
      setMaterials(toPickedMaterials(detail.materials, materialById, true));
      setEquipments(toPickedEquipments(detail.equipments, equipmentById, true));
      setTypeFilter(null);
      setMaterialOpen(true);
      setEquipmentOpen(true);
      setCopyOpen(false);
      setToast(`Đã sao chép định mức từ ${comboPathOf(copyPicked)}`);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không sao chép được định mức"));
    }
  };

  // ---------- Kiểm tra / tóm tắt ----------
  const materialMissing = materials.filter(isMaterialMissing).length;
  const equipmentMissing = equipments.filter(isEquipmentMissing).length;
  const problems: string[] = [];
  if (!isEdit && !createCount) problems.push("Chưa chọn bộ áp dụng");
  if (!materials.length) problems.push("Chưa có vật tư");
  if (materialMissing) problems.push(`${materialMissing} vật tư chưa nhập lượng hoặc đơn vị`);
  if (equipmentMissing) problems.push(`${equipmentMissing} thiết bị chưa nhập công suất sử dụng`);
  const missingText = [
    materialMissing ? `${materialMissing} vật tư chưa nhập lượng` : "",
    equipmentMissing ? `${equipmentMissing} thiết bị chưa nhập công suất` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const dirty = isEdit
    ? createCount > 0 || (snapshot !== "" && snapshotOf(materials, equipments) !== snapshot)
    : selected.size > 0 || materials.length > 0 || equipments.length > 0;
  const invalid = problems.length > 0 || (isEdit && !dirty);

  const scopeCombos = isEdit && editCombo ? [editCombo, ...chosen] : chosen;
  const specimenNames = uniqueNames(scopeCombos, comboSpecimenNameOf);
  const indicatorNames = uniqueNames(scopeCombos, comboIndicatorNameOf);
  const methodNames = uniqueNames(scopeCombos, comboMethodNameOf);
  const chips: SummaryChip[] = [
    { key: "Nền mẫu", value: listText(specimenNames), title: specimenNames.join(", "), colors: ["#fff7e6", "#873800", "#ffd591"] },
    { key: "Chỉ tiêu", value: listText(indicatorNames), title: indicatorNames.join(", "), colors: ["#fafafa", "#262626", "#d9d9d9"] },
    { key: "Phương pháp", value: listText(methodNames), title: methodNames.join(", "), colors: ["#e6fffb", "#00474f", "#87e8de"] },
    { key: "Vật tư", value: String(materials.length), title: `${materials.length} vật tư`, colors: ["#f0f5ff", "#10239e", "#adc6ff"] },
    { key: "Thiết bị", value: String(equipments.length), title: `${equipments.length} thiết bị`, colors: ["#e6fffb", "#006d75", "#87e8de"] },
  ];

  const saveLabel = isEdit
    ? createCount > 0
      ? `Lưu thay đổi · áp dụng thêm ${createCount} bộ`
      : "Lưu thay đổi"
    : createCount > 0
      ? `Tạo ${createCount} định mức`
      : "Tạo định mức";
  const scopeText = isEdit
    ? `cho 1 mẫu${createCount > 0 ? ` · áp dụng cho bộ đang sửa và ${createCount} bộ khác` : ""}`
    : `cho 1 mẫu, dùng chung cho ${createCount} định mức`;
  const addContext = isEdit
    ? editCombo
      ? comboPathOf(editCombo)
      : ""
    : createCount === 1
      ? comboPathOf(chosen[0])
      : `${createCount} bộ đã chọn`;

  // ---------- Hủy / Lưu ----------
  // Rời phiếu bằng mọi đường (quay lại, Hủy, menu, đóng tab) đều hỏi lại
  const allowLeave = useLeaveConfirm(
    dirty,
    isEdit
      ? {
          title: "Hủy sửa định mức?",
          content: "Các thay đổi vật tư, thiết bị và bộ áp dụng thêm sẽ không được lưu.",
          okText: "Bỏ thay đổi",
          cancelText: "Tiếp tục sửa",
        }
      : {
          title: "Hủy phiếu khai báo định mức?",
          content: "Các bộ đã chọn, vật tư và thiết bị đã nhập trên phiếu sẽ không được lưu.",
          okText: "Hủy phiếu",
          cancelText: "Tiếp tục khai báo",
        }
  );
  const handleBack = useCallback(() => navigate(BATCH_NORM_LIST_URL), [navigate]);

  const handleSubmit = async (): Promise<void> => {
    if (invalid) {
      setTried(true);
      return;
    }
    const materialLines = materials.map((m) => ({ productId: m.productId, quantity: m.quantity ?? 0, unitId: m.unitId ?? "" }));
    const equipmentLines = equipments.map((e) => ({ productId: e.productId, capacity: e.capacity ?? 0, capacityUnit: e.capacityUnit }));
    const applyIds = chosen.map((c) => c.testMethodIndicatorId);
    try {
      let state: BatchNormCreatedState;
      if (editId) {
        const saved = await batchNormService.updateNorm(editId, {
          materials: materialLines,
          equipments: equipmentLines,
          applyToTestMethodIndicatorIds: applyIds,
        });
        state = {
          createdToast: `Đã lưu thay đổi định mức${applyIds.length ? ` và áp dụng cho ${applyIds.length} bộ khác` : ""}`,
          createdIds: saved.map((n) => n.id),
        };
      } else {
        const created = await batchNormService.bulkCreate({
          testMethodIndicatorIds: applyIds,
          materials: materialLines,
          equipments: equipmentLines,
        });
        const codes = created.map((n) => n.code).sort();
        const range = codes.length > 1 ? `${codes[0]} → ${codes[codes.length - 1]}` : codes[0] ?? "";
        state = {
          createdToast: `Đã tạo ${created.length} định mức${range ? ` (${range})` : ""}`,
          createdIds: created.map((n) => n.id),
        };
      }
      allowLeave();
      navigate(BATCH_NORM_LIST_URL, { state });
    } catch (error) {
      message.error(getApiErrorMessage(error, isEdit ? "Không lưu được định mức" : "Không tạo được định mức"));
      // Bộ có thể vừa được người khác tạo / sửa định mức → tải lại danh sách bộ
      setReloadToken((t) => t + 1);
    }
  };

  const applyDone = isEdit || createCount > 0;

  return (
    <BatchNormCreateView
      mode={mode}
      headerHeight={headerHeight}
      loading={optionsLoading || detailLoading}
      onBack={handleBack}
      apply={{
        mode,
        step: { done: applyDone, active: !applyDone },
        editing: editCombo
          ? {
              specimenName: comboSpecimenNameOf(editCombo),
              indicatorName: comboIndicatorNameOf(editCombo),
              methodName: comboMethodNameOf(editCombo),
            }
          : null,
        serviceGroupKey: serviceKey,
        serviceGroupOptions: buildServiceGroupOptions(serviceGroups),
        tree,
        selectedCount: createCount,
        fold: selFold,
        showError: tried && !isEdit && createCount === 0,
        onServiceGroupChange: handleServiceChange,
        onOpenPick: () => setPickOpen(true),
        onToggleFold: handleToggleFold,
        onExpandAll: () => setSelFold({}),
        onCollapseAll: handleCollapseAll,
        onRemove: handleRemove,
      }}
      items={{
        mode,
        step: {
          done: materials.length > 0 && !materialMissing && !equipmentMissing,
          active: applyDone && (materialMissing + equipmentMissing > 0 || materials.length === 0),
        },
        scopeText,
        missingText,
        forecastYear: new Date().getFullYear(),
        onOpenCopy: openCopy,
        materials: {
          picked: materials,
          productById: materialById,
          typeFilter,
          typeCounts,
          missingCount: materialMissing,
          open: materialOpen,
          tried,
          onToggleOpen: () => setMaterialOpen((o) => !o),
          onTypeFilter: setTypeFilter,
          onOpenAdd: () => openAdd("material"),
          onQuantity: handleQuantity,
          onUnit: handleUnit,
          onRemove: handleRemoveMaterial,
        },
        equipments: {
          picked: equipments,
          productById: equipmentById,
          capacityUnits,
          missingCount: equipmentMissing,
          open: equipmentOpen,
          tried,
          onToggleOpen: () => setEquipmentOpen((o) => !o),
          onOpenAdd: () => openAdd("equipment"),
          onCapacity: handleCapacity,
          onCapacityUnit: handleCapacityUnit,
          onRemove: handleRemoveEquipment,
        },
      }}
      footer={{
        chips,
        saveLabel,
        problems: tried ? problems : [],
        invalid,
        toast,
        onCancel: handleBack,
        onSubmit: handleSubmit,
      }}
      pick={{
        open: pickOpen,
        mode,
        serviceGroupName: serviceName,
        filter: pickFilter,
        filterOptions: pickFilterOptions,
        tab: pickTab,
        tabCounts,
        rows: pickRows,
        visibleFreeIds,
        selected,
        lockedIds,
        selectedCount: createCount,
        onFilterChange: (patch) => setPickFilter((prev) => ({ ...prev, ...patch })),
        onClearFilter: () => setPickFilter((prev) => ({ ...EMPTY_PICK_FILTER, onlyFree: prev.onlyFree })),
        onTabChange: setPickTab,
        onToggle: handleToggleCombo,
        onSelectAll: handleSelectAll,
        onClearSelected: () => setSelected(new Set()),
        onClose: () => setPickOpen(false),
      }}
      add={{
        kind: adding,
        contextText: addContext,
        query: addQuery,
        typeFilter: addType,
        rows: addRows,
        selected: addSelected,
        onQueryChange: setAddQuery,
        onTypeFilter: setAddType,
        onToggle: (id) => setAddSelected((prev) => toggleInSet(prev, id)),
        onClear: () => setAddSelected(new Set()),
        onClose: () => setAdding(null),
        onConfirm: handleConfirmAdd,
      }}
      copy={{
        open: copyOpen,
        query: copyQuery,
        rows: copyRows,
        pickId: copyPickId,
        picked: copyPicked,
        onQueryChange: setCopyQuery,
        onPick: setCopyPickId,
        onClose: () => setCopyOpen(false),
        onCopy: handleCopy,
      }}
    />
  );
};

export default BatchNormCreatePage;
