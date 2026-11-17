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
 * `isolation`: tạo stacking context riêng cho bảng — antd tính z-index cột cố định = số cột × 2 − vị trí,
 * ma trận nhiều nền mẫu → z-index > 100 → cột tên đè lên header khi cuộn. Popup render ở body nên không ảnh hưởng.
 * `position: relative`: làm gốc toạ độ cho điểm neo menu.
 */
const wrapperStyle: React.CSSProperties = { position: "relative", isolation: "isolate" };
const anchorBaseStyle: React.CSSProperties = { position: "absolute", width: 0, height: 0, pointerEvents: "none" };

interface MenuState {
  service: ServiceCatalogItemDto;
  x: number;
  y: number;
}

/**
 * MỘT menu chuột phải dùng chung cho cả ma trận (thay vì mỗi ô 1 Dropdown → hàng nghìn Dropdown).
 * Bảng KHÔNG nằm trong phần tử trigger của Dropdown (trigger có class `ant-dropdown-trigger` → hook
 * kéo-để-cuộn toàn cục bỏ qua) — menu bám vào 1 điểm neo 0×0 đặt đúng vị trí chuột.
 * Mở menu chỉ render lại component này, `children` (bảng) giữ nguyên reference nên React bỏ qua.
 * Chuột phải ngoài ô có dịch vụ → để trình duyệt hiện menu mặc định như trước.
 */
const ServiceCellContextMenu = React.memo<ServiceCellContextMenuProps>(function ServiceCellContextMenu({
  serviceById,
  canEdit,
  canDelete,
  onCellAction,
  children,
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [open, setOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    const cell = (e.target as HTMLElement).closest?.("[data-service-id]") as HTMLElement | null;
    const service = cell?.dataset.serviceId ? serviceById.get(cell.dataset.serviceId) : undefined;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!service || !rect) {
      setOpen(false);
      return;
    }
    e.preventDefault();
    setMenu({ service, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} style={wrapperStyle} onContextMenu={handleContextMenu}>
      {children}
      {menu && (
        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          open={open}
          // Chỉ nhận yêu cầu đóng (nhấp ra ngoài, Esc); mở do onContextMenu ở trên
          onOpenChange={(next) => !next && setOpen(false)}
          menu={{
            items: buildMenu(menu.service, canEdit, canDelete),
            onClick: ({ key }) => {
              setOpen(false);
              onCellAction(key as ServiceCellAction, menu.service);
            },
          }}
        >
          <span style={{ ...anchorBaseStyle, left: menu.x, top: menu.y }} />
        </Dropdown>
      )}
    </div>
  );
});

export default ServiceCellContextMenu;
