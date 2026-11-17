import React, { useRef, useState } from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";

export type ServiceCellAction = "history" | "toggle" | "delete";

export interface ServiceCellContextMenuProps {
  /** Tra dịch vụ theo `data-service-id` của ô được nhấp chuột phải */
  serviceById: ReadonlyMap<string, ServiceCatalogItemDto>;
  canEdit: boolean;
  canDelete: boolean;
  onCellAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
  children: React.ReactNode;
}

const buildMenu = (service: ServiceCatalogItemDto, canEdit: boolean, canDelete: boolean): MenuProps["items"] => {
  const items: MenuProps["items"] = [{ key: "history", label: "Lịch sử giá / đổi giá" }];
  if (canEdit) items.push({ key: "toggle", label: service.isActive ? "Ngừng sử dụng" : "Kích hoạt lại" });
  if (canDelete) items.push({ type: "divider" }, { key: "delete", label: "Xóa dịch vụ", danger: true });
  return items;
};

/**
 * MỘT menu chuột phải dùng chung cho cả ma trận (thay vì mỗi ô 1 Dropdown → hàng nghìn Dropdown).
 * Tự giữ state ô đang chọn: mở menu chỉ render lại component này, `children` (bảng) giữ nguyên
 * reference nên React bỏ qua, không render lại bảng.
 * Chuột phải ngoài ô có dịch vụ → để trình duyệt hiện menu mặc định như trước.
 */
const ServiceCellContextMenu = React.memo<ServiceCellContextMenuProps>(function ServiceCellContextMenu({
  serviceById,
  canEdit,
  canDelete,
  onCellAction,
  children,
}) {
  const [target, setTarget] = useState<ServiceCatalogItemDto | null>(null);
  const [open, setOpen] = useState(false);
  const targetRef = useRef<ServiceCatalogItemDto | null>(null);

  // Capture chạy trước handler contextMenu của Dropdown (bubble) → biết ô nào trước khi menu mở
  const handleContextMenuCapture = (e: React.MouseEvent) => {
    const cell = (e.target as HTMLElement).closest?.("[data-service-id]") as HTMLElement | null;
    const service = cell?.dataset.serviceId ? serviceById.get(cell.dataset.serviceId) : undefined;
    targetRef.current = service ?? null;
    if (!service) {
      // Không phải ô dịch vụ: chặn Dropdown nhận sự kiện → không preventDefault, menu trình duyệt hiện bình thường
      e.stopPropagation();
      return;
    }
    setTarget(service);
  };

  return (
    <Dropdown
      trigger={["contextMenu"]}
      open={open && !!target}
      onOpenChange={(next) => setOpen(next && !!targetRef.current)}
      menu={{
        items: target ? buildMenu(target, canEdit, canDelete) : [],
        onClick: ({ key }) => {
          setOpen(false);
          if (target) onCellAction(key as ServiceCellAction, target);
        },
      }}
    >
      <div onContextMenuCapture={handleContextMenuCapture}>{children}</div>
    </Dropdown>
  );
});

export default ServiceCellContextMenu;
