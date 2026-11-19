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
import {
  serviceCatalogService,
  type ServiceCatalogItemDto,
  type ServiceGroupDto,
} from "../../../services/serviceCatalogService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { useLeaveConfirm } from "../../../hooks";
import ServiceCatalogView from "./ServiceCatalog/ServiceCatalogView";
import type { ServiceCellAction } from "./ServiceCatalog/ServiceCellContextMenu";
import type { ServiceGroupAction } from "./ServiceCatalog/ServiceGroupCard";
import {
  ALL_SPECIMEN_NAME,
  applyAssign,
  applyQuickFilter,
  buildGroupOptions,
  buildMethodOptions,
  buildServiceGroups,
  buildSpecimenOptions,
  exportServicesToExcel,
  filterServices,
  findEmptyGroups,
  groupKeyOf,
  hasSubcontract,
  isPendingPrice,
  NO_GROUP_KEY,
  NO_GROUP_NAME,
  serviceGroupSchema,
  specimenKeyOf,
  type AssignServiceFormData,
  type AssignTarget,
  type FoldState,
  type ServiceGroupCard as GroupCardData,
  type ServiceOpenLevel,
  type ServiceQuickFilter,
  type ServiceGroupFormData,
} from "./ServiceCatalog/utils";
import { buildServiceDeclareUrl } from "../ServiceDeclare/ServiceDeclare/utils";
import ServiceGroupModal from "./ServiceCatalog/ServiceGroupModal";
import AssignServiceModal from "./ServiceCatalog/AssignServiceModal";
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
  // Mọi "Tên dịch vụ" (kể cả chưa có dòng nào) — cho thẻ rỗng + Select chuyển dịch vụ
  const [groups, setGroups] = useState<ServiceGroupDto[]>([]);
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
  // Thẻ đang đổi tên (null = modal đang ở chế độ thêm mới)
  const [renameCard, setRenameCard] = useState<GroupCardData | null>(null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const assignForm = useForm<AssignServiceFormData>({
    defaultValues: { serviceGroupKey: NO_GROUP_KEY, subcontract: "keep" },
  });
  const groupForm = useForm<ServiceGroupFormData>({
    resolver: yupResolver(serviceGroupSchema),
    defaultValues: { name: "" },
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

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await serviceCatalogService.getServiceGroups());
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được danh sách tên dịch vụ"));
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadGroups();
  }, [loadServices, loadGroups]);

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
  const emptyGroups = useMemo(
    () => findEmptyGroups(groups, services, { keyword: deferredKeyword, testMethodId, specimenKey, quickFilter }),
    [groups, services, deferredKeyword, testMethodId, specimenKey, quickFilter]
  );
  const cards = useMemo(
    () => buildServiceGroups(visibleServices, edits, emptyGroups),
    [visibleServices, edits, emptyGroups]
  );
  const groupOptions = useMemo(() => buildGroupOptions(groups), [groups]);
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

  // serviceGroupId: "+ Thêm" trên thẻ dịch vụ → phiếu điền sẵn tên dịch vụ đó
  const openBuilder = useCallback(
    (serviceGroupId?: string | null) =>
      navigate(
        buildServiceDeclareUrl({
          ...(testMethodId ? { testMethodId } : {}),
          ...(serviceGroupId ? { serviceGroupId } : {}),
        })
      ),
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
    setRenameCard(null);
    groupForm.reset({ name: "" });
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
      if (action === "assign" || action === "assignBlock") {
        const currentGroupKey = groupKeyOf(service.serviceGroupId);
        const single = action === "assign";
        const blockSpecimenKey = specimenKeyOf(service.specimenTypeId);
        // Cả nền mẫu: các dòng đang thấy (theo bộ lọc) cùng thẻ dịch vụ + cùng nền mẫu
        const ids = single
          ? [service.id]
          : visibleServices
              .filter(
                (s) =>
                  groupKeyOf(s.serviceGroupId) === currentGroupKey && specimenKeyOf(s.specimenTypeId) === blockSpecimenKey
              )
              .map((s) => s.id);
        const specimenName = service.specimenTypeName || ALL_SPECIMEN_NAME;
        assignForm.reset({
          serviceGroupKey: currentGroupKey,
          subcontract: single ? (service.isSubcontract ? "yes" : "no") : "keep",
        });
        setAssignTarget({
          title: single
            ? `${service.indicatorName} · ${specimenName} · ${service.testMethodName}`
            : `Nền mẫu “${specimenName}” trong dịch vụ “${service.serviceGroupName || NO_GROUP_NAME}”`,
          serviceIds: ids,
          currentGroupKey,
          single,
        });
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
    [replaceService, visibleServices, assignForm]
  );

  const handleAssignOk = useCallback(
    async (data: AssignServiceFormData) => {
      if (!assignTarget) return;
      const changeServiceGroup = data.serviceGroupKey !== assignTarget.currentGroupKey;
      const isSubcontract = data.subcontract === "keep" ? null : data.subcontract === "yes";
      // undefined = giữ nhóm; null = "Chưa thuộc dịch vụ"
      const target = changeServiceGroup ? (groups.find((g) => g.id === data.serviceGroupKey) ?? null) : undefined;
      setAssignSaving(true);
      try {
        const changed = await serviceCatalogService.assignServices({
          serviceIds: assignTarget.serviceIds,
          serviceGroupId: target?.id ?? null,
          changeServiceGroup,
          isSubcontract,
        });
        setServices((prev) => applyAssign(prev, new Set(assignTarget.serviceIds), target, isSubcontract));
        setAssignTarget(null);
        if (changed === 0) message.info("Không có thay đổi");
        else
          message.success(
            `Đã cập nhật ${changed} chỉ tiêu${target !== undefined ? ` sang “${target?.name ?? NO_GROUP_NAME}”` : ""}`
          );
      } catch (error) {
        message.error(getApiErrorMessage(error, "Không chuyển được dịch vụ"));
      } finally {
        setAssignSaving(false);
      }
    },
    [assignTarget, groups]
  );

  const handleGroupOk = useCallback(
    async (data: ServiceGroupFormData) => {
      const name = data.name.trim();
      setGroupSaving(true);
      try {
        if (renameCard?.groupId) {
          const updated = await serviceCatalogService.updateServiceGroup(renameCard.groupId, name);
          setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          setServices((prev) =>
            prev.map((s) => (s.serviceGroupId === updated.id ? { ...s, serviceGroupName: updated.name } : s))
          );
          message.success(`Đã đổi tên dịch vụ ${updated.code}`);
          setGroupModalOpen(false);
          setRenameCard(null);
          return;
        }
        const created = await serviceCatalogService.createServiceGroup(name);
        setGroups((prev) => [...prev, created]);
        message.success(`Đã thêm dịch vụ ${created.code}. Khai báo chỉ tiêu cho dịch vụ này.`);
        setGroupModalOpen(false);
        groupForm.reset();
        // Mở luôn phiếu khai báo, điền sẵn tên
        openBuilder(created.id);
      } catch (error) {
        message.error(
          getApiErrorMessage(error, renameCard ? "Không đổi được tên dịch vụ" : "Không thêm được nhóm dịch vụ")
        );
      } finally {
        setGroupSaving(false);
      }
    },
    [groupForm, openBuilder, renameCard]
  );

  const handleGroupAction = useCallback(
    (action: ServiceGroupAction, card: GroupCardData) => {
      const groupId = card.groupId;
      if (!groupId) return;
      if (action === "rename") {
        setRenameCard(card);
        groupForm.reset({ name: card.name });
        setGroupModalOpen(true);
        return;
      }
      const used = services.filter((s) => s.serviceGroupId === groupId).length;
      Modal.confirm({
        title: `Xóa dịch vụ “${card.name}”?`,
        content:
          used > 0
            ? `${used} chỉ tiêu trong dịch vụ này sẽ chuyển về “${NO_GROUP_NAME}” (giữ nguyên giá, ĐVT). Phiếu / báo giá cũ không bị ảnh hưởng.`
            : "Dịch vụ chưa có chỉ tiêu nào.",
        okText: "Xóa",
        okButtonProps: { danger: true },
        cancelText: "Hủy",
        centered: true,
        onOk: async () => {
          try {
            const moved = await serviceCatalogService.deleteServiceGroup(groupId);
            setGroups((prev) => prev.filter((g) => g.id !== groupId));
            setServices((prev) =>
              prev.map((s) =>
                s.serviceGroupId === groupId
                  ? { ...s, serviceGroupId: null, serviceGroupCode: null, serviceGroupName: null }
                  : s
              )
            );
            message.success(
              moved > 0 ? `Đã xóa dịch vụ, ${moved} chỉ tiêu chuyển về “${NO_GROUP_NAME}”` : "Đã xóa dịch vụ"
            );
          } catch (error) {
            message.error(getApiErrorMessage(error, "Không xóa được dịch vụ"));
          }
        },
      });
    },
    [groupForm, services]
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
        onGroupAction={handleGroupAction}
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
      <ServiceGroupModal
        open={groupModalOpen}
        mode={renameCard ? "rename" : "create"}
        code={renameCard?.code}
        loading={groupSaving}
        form={groupForm}
        onOk={handleGroupOk}
        onCancel={() => setGroupModalOpen(false)}
      />
      <AssignServiceModal
        target={assignTarget}
        loading={assignSaving}
        groupOptions={groupOptions}
        form={assignForm}
        onOk={handleAssignOk}
        onCancel={() => setAssignTarget(null)}
      />
    </>
  );
});

export default ServiceCatalogPage;
