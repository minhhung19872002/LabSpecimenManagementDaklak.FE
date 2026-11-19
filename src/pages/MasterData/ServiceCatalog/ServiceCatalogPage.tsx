import {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Modal, message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { indicatorGroupService, type CreateUpdateIndicatorGroupDto } from "../../../services/masterDataService";
import { serviceCatalogService, type ServiceCatalogItemDto } from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { useLeaveConfirm } from "../../../hooks";
import ServiceCatalogView from "./ServiceCatalog/ServiceCatalogView";
import type { ServiceCellAction } from "./ServiceCatalog/ServiceCellContextMenu";
import {
  applyQuickFilter,
  buildMethodOptions,
  buildServiceGroups,
  buildSpecimenOptions,
  exportServicesToExcel,
  filterServices,
  hasSubcontract,
  isPendingPrice,
  specimenKeyOf,
  type FoldState,
  type ServiceOpenLevel,
  type ServiceQuickFilter,
} from "./ServiceCatalog/utils";
import { buildServiceDeclareUrl } from "../ServiceDeclare/ServiceDeclare/utils";
import { GroupModal } from "../Indicators/components";
import { indicatorGroupSchema, type IndicatorGroupFormData } from "../Indicators/schemas/indicatorSchema";
import ImportPricesModal from "./ImportPricesModal";
import PriceHistoryModal from "./PriceHistoryModal";

/** Các nút trên header "Ngân hàng dữ liệu" gọi vào */
export interface ServiceCatalogActions {
  openBuilder: () => void;
  exportExcel: () => void;
  openImport: () => void;
  openCreateGroup: () => void;
  /** Còn đơn giá chưa lưu → hỏi xác nhận rồi mới chạy `proceed` (vd: đổi danh mục trên sidebar) */
  confirmDiscard: (proceed: () => void) => void;
}

const discardConfirmText = (count: number) => ({
  title: "Bỏ các đơn giá chưa lưu?",
  content: `Có ${count} đơn giá đã sửa nhưng chưa lưu. Rời trang sẽ mất các thay đổi này.`,
});

const EMPTY_EDITS: ReadonlyMap<string, number> = new Map();

/** Container L2 — Dịch vụ & Bảng giá (Dịch vụ = nhóm chỉ tiêu ▸ Nền mẫu ▸ Chỉ tiêu & giá) */
const ServiceCatalogPage = forwardRef<ServiceCatalogActions>(function ServiceCatalogPage(_props, ref) {
  const [services, setServices] = useState<ServiceCatalogItemDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  // Gõ tìm kiếm không chặn ô nhập: danh sách lọc lại ở mức ưu tiên thấp
  const deferredKeyword = useDeferredValue(keyword);
  const [testMethodId, setTestMethodId] = useState<string | undefined>();
  const [specimenKey, setSpecimenKey] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<ServiceQuickFilter>("all");

  const [level, setLevel] = useState<ServiceOpenLevel>("indicator");
  const [dense, setDense] = useState(false);
  const [fold, setFold] = useState<FoldState>({});

  // Giá đã sửa chưa lưu (serviceId → giá mới); id ô đang sửa — giá đang gõ nằm trong ô (local state)
  const [edits, setEdits] = useState<ReadonlyMap<string, number>>(EMPTY_EDITS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [historyService, setHistoryService] = useState<ServiceCatalogItemDto | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const groupForm = useForm<IndicatorGroupFormData>({
    resolver: yupResolver(indicatorGroupSchema),
    defaultValues: { name: "", isActive: true },
  });

  const navigate = useNavigate();
  const canCreate = authService.hasPermission(PERMISSIONS.MasterData.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

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

  // Còn giá chưa lưu: chuyển trang trong app (menu, nút Tạo dịch vụ / + Thêm) → hỏi; đóng tab / F5 → trình duyệt hỏi
  useLeaveConfirm(edits.size > 0, discardConfirmText(edits.size));

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const methodOptions = useMemo(() => buildMethodOptions(services), [services]);
  const specimenOptions = useMemo(() => buildSpecimenOptions(services), [services]);

  const baseFiltered = useMemo(
    () => filterServices(services, { keyword: deferredKeyword, testMethodId, specimenKey }),
    [services, deferredKeyword, testMethodId, specimenKey]
  );
  const pendingCount = useMemo(() => baseFiltered.filter((s) => isPendingPrice(s, edits)).length, [baseFiltered, edits]);
  const subcontractCount = useMemo(() => baseFiltered.filter(hasSubcontract).length, [baseFiltered]);
  const visibleServices = useMemo(
    () => applyQuickFilter(baseFiltered, quickFilter, edits),
    [baseFiltered, quickFilter, edits]
  );
  const cards = useMemo(() => buildServiceGroups(visibleServices, edits), [visibleServices, edits]);
  const specimenCount = useMemo(
    () => new Set(visibleServices.map((s) => specimenKeyOf(s.specimenTypeId))).size,
    [visibleServices]
  );
  const indicatorCount = useMemo(() => new Set(visibleServices.map((s) => s.indicatorId)).size, [visibleServices]);

  const hasFilter = keyword.trim() !== "" || !!testMethodId || !!specimenKey || quickFilter !== "all";
  const clearFilter = useCallback(() => {
    setKeyword("");
    setTestMethodId(undefined);
    setSpecimenKey(undefined);
    setQuickFilter("all");
  }, []);

  // Đổi "Mở đến" → bỏ các lần gập/mở tay, áp lại theo cấp mới
  const handleLevelChange = useCallback((next: ServiceOpenLevel) => {
    setLevel(next);
    setFold({});
  }, []);
  const handleToggleFold = useCallback(
    (foldKey: string, open: boolean) => setFold((prev) => ({ ...prev, [foldKey]: open })),
    []
  );

  const replaceService = useCallback((updated: ServiceCatalogItemDto) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const openBuilder = useCallback(
    () => navigate(buildServiceDeclareUrl(testMethodId ? { testMethodId } : null)),
    [navigate, testMethodId]
  );

  // Đổi danh mục trên sidebar không qua router → useLeaveConfirm không chặn được, cha gọi hàm này
  const confirmDiscard = useCallback(
    (proceed: () => void) => {
      if (edits.size === 0) {
        proceed();
        return;
      }
      Modal.confirm({
        ...discardConfirmText(edits.size),
        okText: "Bỏ thay đổi",
        okButtonProps: { danger: true },
        cancelText: "Ở lại",
        centered: true,
        onOk: proceed,
      });
    },
    [edits.size]
  );

  const openCreateGroup = useCallback(() => {
    groupForm.reset({ name: "", isActive: true });
    setGroupModalOpen(true);
  }, [groupForm]);

  useImperativeHandle(
    ref,
    () => ({
      openBuilder,
      exportExcel: () => exportServicesToExcel(visibleServices),
      openImport: () => setImportOpen(true),
      openCreateGroup,
      confirmDiscard,
    }),
    [openBuilder, visibleServices, openCreateGroup, confirmDiscard]
  );

  const handleStartEdit = useCallback((serviceId: string) => setEditingId(serviceId), []);
  const handleEditCancel = useCallback(() => setEditingId(null), []);

  // Ghi nhận giá vào bản nháp (chưa gọi API); trùng giá gốc / xoá trống = bỏ sửa
  const handleEditCommit = useCallback((service: ServiceCatalogItemDto, value: number | null) => {
    setEditingId(null);
    setEdits((prev) => {
      const unchanged = value == null || value === (service.priceAtDate ?? null);
      if (unchanged && !prev.has(service.id)) return prev;
      if (!unchanged && prev.get(service.id) === value) return prev;
      const next = new Map(prev);
      if (unchanged) next.delete(service.id);
      else next.set(service.id, value);
      return next;
    });
  }, []);

  const handleCancelEdits = useCallback(() => {
    setEditingId(null);
    setEdits(EMPTY_EDITS);
  }, []);

  const handleSaveEdits = useCallback(async () => {
    const entries = [...edits.entries()].filter(([id]) => serviceById.has(id));
    try {
      const results = await Promise.allSettled(
        entries.map(([id, unitPrice]) =>
          serviceCatalogService.setPrice(id, {
            unitPrice,
            turnaroundDays: serviceById.get(id)?.turnaroundDays ?? null,
            note: "Sửa giá trên Bảng giá",
          })
        )
      );
      const updated = new Map<string, ServiceCatalogItemDto>();
      let firstError: unknown;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") updated.set(entries[i][0], r.value);
        else firstError ??= r.reason;
      });
      if (updated.size > 0) {
        setServices((prev) => prev.map((s) => updated.get(s.id) ?? s));
        setEdits((prev) => {
          const next = new Map(prev);
          updated.forEach((_v, id) => next.delete(id));
          return next.size === 0 ? EMPTY_EDITS : next;
        });
      }
      const failed = entries.length - updated.size;
      if (failed === 0) message.success(`Đã lưu ${updated.size} đơn giá`);
      else
        message.error(
          getApiErrorMessage(firstError, `Lưu được ${updated.size}/${entries.length} đơn giá, ${failed} đơn giá bị lỗi`)
        );
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được đơn giá"));
    }
  }, [edits, serviceById]);

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
            setEdits((prev) => {
              if (!prev.has(service.id)) return prev;
              const next = new Map(prev);
              next.delete(service.id);
              return next;
            });
            message.success("Đã xóa dịch vụ");
          } catch (error) {
            message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
          }
        },
      });
    },
    [replaceService]
  );

  const handleCreateGroup = useCallback(
    async (data: IndicatorGroupFormData) => {
      setGroupSaving(true);
      try {
        await indicatorGroupService.create(data as CreateUpdateIndicatorGroupDto);
        message.success("Đã thêm nhóm dịch vụ. Khai báo nền mẫu / chỉ tiêu để nhóm hiện trong bảng giá.");
        setGroupModalOpen(false);
        groupForm.reset();
      } catch (error) {
        message.error(getApiErrorMessage(error, "Không thêm được nhóm dịch vụ"));
      } finally {
        setGroupSaving(false);
      }
    },
    [groupForm]
  );

  return (
    <>
      <ServiceCatalogView
        toolbar={{
          keyword,
          testMethodId,
          specimenKey,
          quickFilter,
          methodOptions,
          specimenOptions,
          pendingCount,
          subcontractCount,
          hasFilter,
          onKeywordChange: setKeyword,
          onTestMethodChange: setTestMethodId,
          onSpecimenChange: setSpecimenKey,
          onQuickFilterChange: setQuickFilter,
          onClearFilter: clearFilter,
        }}
        viewBar={{
          serviceCount: cards.length,
          specimenCount,
          indicatorCount,
          level,
          dense,
          onLevelChange: handleLevelChange,
          onDenseChange: setDense,
        }}
        cards={cards}
        loading={loading}
        fold={fold}
        level={level}
        dense={dense}
        edits={edits}
        editingId={editingId}
        serviceById={serviceById}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onToggleFold={handleToggleFold}
        onAddToGroup={openBuilder}
        onStartEdit={handleStartEdit}
        onEditCommit={handleEditCommit}
        onEditCancel={handleEditCancel}
        onCellAction={handleCellAction}
        onCancelEdits={handleCancelEdits}
        onSaveEdits={handleSaveEdits}
      />
      <ImportPricesModal
        open={importOpen}
        onDone={() => {
          setImportOpen(false);
          loadServices();
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
      <GroupModal
        title="Thêm nhóm dịch vụ"
        open={groupModalOpen}
        loading={groupSaving}
        editingGroup={null}
        form={groupForm}
        onOk={handleCreateGroup}
        onCancel={() => setGroupModalOpen(false)}
      />
    </>
  );
});

export default ServiceCatalogPage;
