import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
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
import { serviceCatalogService, type ServiceCatalogItemDto } from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import ServiceCatalogView from "./ServiceCatalog/ServiceCatalogView";
import type { ServiceCellAction, ServiceEditingCell } from "./ServiceCatalog/ServiceMatrixTable";
import {
  buildServiceMatrix,
  collectSpecimenColumns,
  exportServicesToExcel,
  type ServiceMatrixRow,
  type SpecimenColumn,
} from "./ServiceCatalog/utils";
import BulkCreateDrawer, { type BulkCreatePrefill } from "./BulkCreateDrawer";
import BulkPriceModal from "./BulkPriceModal";
import ImportPricesModal from "./ImportPricesModal";
import PriceHistoryModal from "./PriceHistoryModal";

const flattenIndicators = (items: IndicatorDto[]): IndicatorDto[] => {
  const map = new Map<string, IndicatorDto>();
  for (const i of items) {
    map.set(i.id, i);
    for (const sub of i.subIndicators ?? []) map.set(sub.id, sub);
  }
  return [...map.values()];
};

/** Container L2 — Dịch vụ & Bảng giá */
const ServiceCatalogPage: React.FC = () => {
  const [services, setServices] = useState<ServiceCatalogItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [testMethods, setTestMethods] = useState<TestMethodDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);

  const [keyword, setKeyword] = useState("");
  const [testMethodId, setTestMethodId] = useState<string | undefined>();
  const [priceDate, setPriceDate] = useState<Dayjs>(dayjs());
  const [showInactive, setShowInactive] = useState(false);
  const [hiddenSpecimenKeys, setHiddenSpecimenKeys] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ServiceEditingCell | null>(null);

  const [bulkCreate, setBulkCreate] = useState<{ open: boolean; prefill: BulkCreatePrefill | null }>({
    open: false,
    prefill: null,
  });
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyService, setHistoryService] = useState<ServiceCatalogItemDto | null>(null);

  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);
  const canImport = authService.hasPermission(PERMISSIONS.MasterData.Import);

  const loadServices = useCallback(async (date: Dayjs) => {
    setLoading(true);
    try {
      setServices(await serviceCatalogService.getList({ priceDate: date.format("YYYY-MM-DD") }));
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được danh sách dịch vụ"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices(priceDate);
  }, [loadServices, priceDate]);

  useEffect(() => {
    Promise.all([
      testMethodService.getAll(),
      specimenTypeService.getActive(),
      indicatorService.getActive(),
      indicatorGroupService.getActive(),
    ])
      .then(([methods, specimens, inds, groups]) => {
        setTestMethods(methods);
        setSpecimenTypes(specimens.items);
        setIndicators(flattenIndicators(inds));
        setIndicatorGroups(groups);
      })
      .catch((error) => message.error(getApiErrorMessage(error, "Không tải được danh mục")));
  }, []);

  const filteredServices = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return services.filter(
      (s) =>
        (showInactive || s.isActive) &&
        (!testMethodId || s.testMethodId === testMethodId) &&
        (!kw ||
          [s.serviceCode, s.indicatorName, s.indicatorCode, s.specimenTypeName, s.testMethodName, s.testMethodCode]
            .filter(Boolean)
            .some((v) => (v as string).toLowerCase().includes(kw)))
    );
  }, [services, keyword, testMethodId, showInactive]);

  const matrixRows = useMemo(() => buildServiceMatrix(filteredServices), [filteredServices]);
  const allSpecimenColumns = useMemo(() => collectSpecimenColumns(filteredServices), [filteredServices]);
  const visibleSpecimenColumns = useMemo(
    () => allSpecimenColumns.filter((c) => !hiddenSpecimenKeys.includes(c.key)),
    [allSpecimenColumns, hiddenSpecimenKeys]
  );

  const methodOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of services) {
      if (!seen.has(s.testMethodId)) seen.set(s.testMethodId, `${s.testMethodCode} - ${s.testMethodName}`);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [services]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.has(s.id)),
    [services, selectedIds]
  );

  const replaceService = useCallback((updated: ServiceCatalogItemDto) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const toggleSelect = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const handleEditCommit = useCallback(async () => {
    if (!editing) return;
    const service = services.find((s) => s.id === editing.serviceId);
    const value = editing.value;
    setEditing(null);
    if (!service || value == null || value === service.unitPrice) return;
    try {
      const updated = await serviceCatalogService.setPrice(service.id, {
        unitPrice: value,
        turnaroundDays: service.turnaroundDays ?? null,
        note: "Sửa giá trên ma trận",
      });
      replaceService(updated);
      message.success(`Đã đổi giá ${service.serviceCode ?? ""}`);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không đổi được giá"));
    }
  }, [editing, services, replaceService]);

  const handleCellAction = useCallback(
    async (action: ServiceCellAction, service: ServiceCatalogItemDto) => {
      if (action === "history") {
        setHistoryService(service);
        return;
      }
      if (action === "toggle") {
        try {
          await serviceCatalogService.toggleActive(service.id);
          replaceService({ ...service, isActive: !service.isActive });
        } catch (error) {
          message.error(getApiErrorMessage(error, "Không đổi được trạng thái"));
        }
        return;
      }
      Modal.confirm({
        title: `Xóa dịch vụ ${service.serviceCode ?? ""}?`,
        content: "Phiếu / báo giá cũ vẫn giữ tên và giá đã lưu.",
        okText: "Xóa",
        okButtonProps: { danger: true },
        cancelText: "Hủy",
        onOk: async () => {
          try {
            await serviceCatalogService.delete(service.id);
            setServices((prev) => prev.filter((s) => s.id !== service.id));
            toggleSelect([service.id], false);
            message.success("Đã xóa dịch vụ");
          } catch (error) {
            message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
          }
        },
      });
    },
    [replaceService, toggleSelect]
  );

  const handleDeleteSelected = useCallback(async () => {
    try {
      const count = await serviceCatalogService.deleteMany([...selectedIds]);
      message.success(`Đã xóa ${count} dịch vụ`);
      setServices((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
    }
  }, [selectedIds]);

  const handleEmptyCellDoubleClick = useCallback((row: ServiceMatrixRow, column: SpecimenColumn) => {
    setBulkCreate({
      open: true,
      prefill: { testMethodId: row.testMethodId, indicatorId: row.indicatorId, specimenTypeId: column.specimenTypeId },
    });
  }, []);

  const reload = useCallback(() => loadServices(priceDate), [loadServices, priceDate]);

  return (
    <>
      <ServiceCatalogView
        totalCount={filteredServices.length}
        toolbar={{
          keyword,
          testMethodId,
          methodOptions,
          priceDate,
          showInactive,
          specimenColumns: allSpecimenColumns,
          hiddenSpecimenKeys,
          selectedCount: selectedIds.size,
          loading,
          canCreate,
          canEdit,
          canDelete,
          canImport,
          onKeywordChange: setKeyword,
          onTestMethodChange: setTestMethodId,
          onPriceDateChange: setPriceDate,
          onShowInactiveChange: setShowInactive,
          onToggleSpecimenColumn: (key) =>
            setHiddenSpecimenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])),
          onBulkCreate: () => setBulkCreate({ open: true, prefill: testMethodId ? { testMethodId } : null }),
          onExport: () => exportServicesToExcel(filteredServices),
          onImport: () => setImportOpen(true),
          onBulkPrice: () => setBulkPriceOpen(true),
          onClearSelection: () => setSelectedIds(new Set()),
          onDeleteSelected: handleDeleteSelected,
          onReload: reload,
        }}
        matrix={{
          rows: matrixRows,
          specimenColumns: visibleSpecimenColumns,
          loading,
          selectedIds,
          editing,
          canCreate,
          canEdit,
          canDelete,
          onCellClick: (s) => toggleSelect([s.id], !selectedIds.has(s.id)),
          onCellDoubleClick: (s) => setEditing({ serviceId: s.id, value: s.unitPrice }),
          onEmptyCellDoubleClick: handleEmptyCellDoubleClick,
          onEditValueChange: (value) => setEditing((prev) => (prev ? { ...prev, value } : prev)),
          onEditCommit: handleEditCommit,
          onEditCancel: () => setEditing(null),
          onRowSelect: toggleSelect,
          onCellAction: handleCellAction,
        }}
      />
      <BulkCreateDrawer
        open={bulkCreate.open}
        prefill={bulkCreate.prefill}
        testMethods={testMethods}
        specimenTypes={specimenTypes}
        indicators={indicators}
        indicatorGroups={indicatorGroups}
        existingServices={services}
        onDone={() => {
          setBulkCreate({ open: false, prefill: null });
          reload();
        }}
        onCancel={() => setBulkCreate({ open: false, prefill: null })}
      />
      <BulkPriceModal
        open={bulkPriceOpen}
        services={selectedServices}
        onDone={() => {
          setBulkPriceOpen(false);
          setSelectedIds(new Set());
          reload();
        }}
        onCancel={() => setBulkPriceOpen(false)}
      />
      <ImportPricesModal
        open={importOpen}
        onDone={() => {
          setImportOpen(false);
          reload();
        }}
        onCancel={() => setImportOpen(false)}
      />
      <PriceHistoryModal
        service={historyService}
        canEdit={canEdit}
        onChanged={(updated) => {
          replaceService(updated);
          setHistoryService(updated);
        }}
        onClose={() => setHistoryService(null)}
      />
    </>
  );
};

export default ServiceCatalogPage;
