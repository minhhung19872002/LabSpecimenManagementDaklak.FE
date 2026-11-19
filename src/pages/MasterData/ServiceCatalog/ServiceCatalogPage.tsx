import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { specimenTypeService, type SpecimenTypeDto } from "../../../services/masterDataService";
import { serviceCatalogService, type ServiceCatalogItemDto } from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { useHeaderHeight } from "../../../hooks";
import ServiceCatalogView from "./ServiceCatalog/ServiceCatalogView";
import type { ServiceCellAction } from "./ServiceCatalog/ServiceMatrixTable";
import {
  ALL_CATEGORY,
  buildMatrixPageRows,
  buildServiceMatrix,
  DEFAULT_MATRIX_PAGE_SIZE,
  collectSpecimenCategories,
  collectSpecimenColumns,
  exportServicesToExcel,
  filterSpecimenColumns,
  isMatrixRowKey,
  type ServiceCatalogTab,
  type ServiceMatrixRow,
  type SpecimenColumn,
} from "./ServiceCatalog/utils";
import { buildServiceDeclareUrl, type ServiceDeclarePrefill } from "../ServiceDeclare/ServiceDeclare/utils";
import BulkPriceModal from "./BulkPriceModal";
import ImportPricesModal from "./ImportPricesModal";
import PriceHistoryModal from "./PriceHistoryModal";

/** Các nút trên header "Ngân hàng dữ liệu" gọi vào */
export interface ServiceCatalogActions {
  openBuilder: () => void;
  exportExcel: () => void;
  openImport: () => void;
}

const rowKeyOf = (s: ServiceCatalogItemDto) => `r:${s.indicatorId}:${s.testMethodId}`;

/** Container L2 — Dịch vụ & Bảng giá */
const ServiceCatalogPage = forwardRef<ServiceCatalogActions>(function ServiceCatalogPage(_props, ref) {
  const [services, setServices] = useState<ServiceCatalogItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);

  const [activeTab, setActiveTab] = useState<ServiceCatalogTab>("grid");
  const [showRules, setShowRules] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [testMethodId, setTestMethodId] = useState<string | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [specimenCategory, setSpecimenCategory] = useState(ALL_CATEGORY);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // Chỉ giữ id ô đang sửa; giá đang gõ nằm trong ô (local state) để gõ phím không render lại cả ma trận
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [matrixPageSize, setMatrixPageSize] = useState(DEFAULT_MATRIX_PAGE_SIZE);
  // Tiêu đề cột + thanh cuộn ngang của ma trận dính theo màn hình (dưới header app)
  const headerHeight = useHeaderHeight();

  const navigate = useNavigate();
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyService, setHistoryService] = useState<ServiceCatalogItemDto | null>(null);

  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  // Giá đổi là áp dụng ngay (không có ngày hiệu lực) → luôn xem giá hiện hành; lịch sử xem trong "Lịch sử giá"
  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      setServices(await serviceCatalogService.getList());
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được danh sách dịch vụ"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    specimenTypeService
      .getActive()
      .then((specimens) => setSpecimenTypes(specimens.items))
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
  const groupKeys = useMemo(() => matrixRows.map((r) => r.key), [matrixRows]);
  const allExpanded = groupKeys.length > 0 && groupKeys.every((k) => expandedRowKeys.includes(k));

  // Mặc định mở hết các nhóm mỗi khi tập nhóm thay đổi (lọc / tải lại)
  useEffect(() => {
    setExpandedRowKeys(groupKeys);
  }, [groupKeys]);

  // Phân trang theo dòng chỉ tiêu (không theo nhóm) — tránh vẽ cả trăm dòng × hàng chục cột một lúc
  const matrixPageRows = useMemo(
    () => buildMatrixPageRows(matrixRows, new Set(expandedRowKeys), matrixPageSize),
    [matrixRows, expandedRowKeys, matrixPageSize]
  );
  const toggleGroup = useCallback(
    (groupKey: string) =>
      setExpandedRowKeys((prev) => (prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey])),
    []
  );

  const categoryBySpecimenId = useMemo(
    () => new Map(specimenTypes.map((s) => [s.id, s.sampleTypeCategoryName ?? ""])),
    [specimenTypes]
  );
  const allSpecimenColumns = useMemo(
    () => collectSpecimenColumns(filteredServices, categoryBySpecimenId),
    [filteredServices, categoryBySpecimenId]
  );
  const specimenCategories = useMemo(() => collectSpecimenCategories(allSpecimenColumns), [allSpecimenColumns]);
  const visibleSpecimenColumns = useMemo(
    () => filterSpecimenColumns(allSpecimenColumns, specimenCategory),
    [allSpecimenColumns, specimenCategory]
  );

  const methodOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of services) {
      if (!seen.has(s.testMethodId)) seen.set(s.testMethodId, `${s.testMethodCode} - ${s.testMethodName}`);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [services]);

  const selectedRowSet = useMemo(() => new Set(selectedRowKeys.filter(isMatrixRowKey)), [selectedRowKeys]);
  const selectedServices = useMemo(
    () => filteredServices.filter((s) => selectedRowSet.has(rowKeyOf(s))),
    [filteredServices, selectedRowSet]
  );
  const rowCount = matrixRows.reduce((sum, g) => sum + (g.rowCount ?? 0), 0);

  const replaceService = useCallback((updated: ServiceCatalogItemDto) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const reload = loadServices;

  const openBuilder = useCallback(
    (prefill: ServiceDeclarePrefill | null) => navigate(buildServiceDeclareUrl(prefill)),
    [navigate]
  );

  useImperativeHandle(
    ref,
    () => ({
      openBuilder: () => openBuilder(testMethodId ? { testMethodId } : null),
      exportExcel: () => exportServicesToExcel(filteredServices),
      openImport: () => setImportOpen(true),
    }),
    [openBuilder, testMethodId, filteredServices]
  );

  const handleCellDoubleClick = useCallback(
    (service: ServiceCatalogItemDto) => setEditingServiceId(service.id),
    []
  );
  const handleEditCancel = useCallback(() => setEditingServiceId(null), []);

  // Callback ổn định (không phụ thuộc state đang sửa) để các ô React.memo không render lại
  const handleEditCommit = useCallback(async (service: ServiceCatalogItemDto, value: number | null) => {
    setEditingServiceId(null);
    if (value == null || value === service.priceAtDate) return;
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
  }, [replaceService]);

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
            message.success("Đã xóa dịch vụ");
          } catch (error) {
            message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
          }
        },
      });
    },
    [replaceService]
  );

  const handleDeleteSelected = useCallback(async () => {
    const ids = new Set(selectedServices.map((s) => s.id));
    try {
      const count = await serviceCatalogService.deleteMany([...ids]);
      message.success(`Đã xóa ${count} dịch vụ`);
      setServices((prev) => prev.filter((s) => !ids.has(s.id)));
      setSelectedRowKeys([]);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
    }
  }, [selectedServices]);

  const handleEmptyCellDoubleClick = useCallback(
    (row: ServiceMatrixRow, column: SpecimenColumn) =>
      openBuilder({ testMethodId: row.testMethodId, indicatorId: row.indicatorId, specimenTypeId: column.specimenTypeId }),
    [openBuilder]
  );

  return (
    <>
      <ServiceCatalogView
        activeTab={activeTab}
        showRules={showRules}
        onTabChange={setActiveTab}
        onToggleRules={() => setShowRules((v) => !v)}
        gridCountText={`${matrixRows.length} nhóm · ${rowCount} dòng chỉ tiêu`}
        listCountText={`${filteredServices.length} dịch vụ`}
        toolbar={{
          keyword,
          testMethodId,
          methodOptions,
          showInactive,
          specimenCategories,
          specimenCategory,
          allExpanded,
          selectedRowCount: selectedRowSet.size,
          selectedServiceCount: selectedServices.length,
          loading,
          canEdit,
          canDelete,
          onKeywordChange: setKeyword,
          onTestMethodChange: setTestMethodId,
          onShowInactiveChange: setShowInactive,
          onSpecimenCategoryChange: setSpecimenCategory,
          onToggleExpandAll: () => setExpandedRowKeys(allExpanded ? [] : groupKeys),
          onBulkPrice: () => setBulkPriceOpen(true),
          onClearSelection: () => setSelectedRowKeys([]),
          onDeleteSelected: handleDeleteSelected,
          onReload: reload,
        }}
        matrix={{
          rows: matrixPageRows,
          specimenColumns: visibleSpecimenColumns,
          loading,
          selectedRowKeys,
          pageSize: matrixPageSize,
          stickyOffset: headerHeight,
          editingServiceId,
          canCreate,
          canEdit,
          canDelete,
          onSelectionChange: setSelectedRowKeys,
          onToggleGroup: toggleGroup,
          onPageSizeChange: setMatrixPageSize,
          onCellDoubleClick: handleCellDoubleClick,
          onEmptyCellDoubleClick: handleEmptyCellDoubleClick,
          onEditCommit: handleEditCommit,
          onEditCancel: handleEditCancel,
          onCellAction: handleCellAction,
        }}
        list={{
          services: filteredServices,
          loading,
          canEdit,
          canDelete,
          onAction: handleCellAction,
        }}
      />
      <BulkPriceModal
        open={bulkPriceOpen}
        services={selectedServices}
        onDone={() => {
          setBulkPriceOpen(false);
          setSelectedRowKeys([]);
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
});

export default ServiceCatalogPage;
