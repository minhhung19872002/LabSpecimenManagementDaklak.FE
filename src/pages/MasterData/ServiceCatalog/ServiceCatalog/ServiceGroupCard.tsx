import React from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined, PlusOutlined, RightOutlined } from "../../../../components/common/Icon";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import ServiceSpecimenBlock from "./ServiceSpecimenBlock";
import {
  isServiceOpen,
  isSpecimenOpen,
  type FoldState,
  type PriceEdits,
  type ServiceGroupCard as GroupCardData,
  type ServiceOpenLevel,
} from "./utils";

export type ServiceGroupAction = "rename" | "delete";

export interface ServiceGroupCardProps {
  card: GroupCardData;
  fold: FoldState;
  level: ServiceOpenLevel;
  edits: PriceEdits;
  editingId: string | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  /** Mở phiếu khai báo, điền sẵn dịch vụ của thẻ (null = thẻ "Chưa thuộc dịch vụ") */
  onAdd: (serviceGroupId: string | null) => void;
  /** Đổi tên / xóa tên dịch vụ (không có ở thẻ "Chưa thuộc dịch vụ") */
  onGroupAction: (action: ServiceGroupAction, card: GroupCardData) => void;
  onStartEdit: (serviceId: string) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
}

const buildGroupMenu = (canEdit: boolean, canDelete: boolean): MenuProps["items"] => {
  const items: MenuProps["items"] = [];
  if (canEdit) items.push({ key: "rename", label: "Đổi tên dịch vụ" });
  if (canDelete) items.push({ key: "delete", label: "Xóa dịch vụ…", danger: true });
  return items;
};

/** Cấp 1: thẻ Dịch vụ (ServiceGroup) — tên, mã, số liệu, khoảng giá, nút Thêm */
const ServiceGroupCard: React.FC<ServiceGroupCardProps> = ({
  card,
  fold,
  level,
  edits,
  editingId,
  canCreate,
  canEdit,
  canDelete,
  onToggle,
  onAdd,
  onGroupAction,
  onStartEdit,
  onEditCommit,
  onEditCancel,
}) => {
  const open = isServiceOpen(fold, card.foldKey, level);
  const showMenu = card.groupId != null && (canEdit || canDelete);
  return (
    <section className={`svc-card${open ? " is-open" : ""}`} aria-label={`Dịch vụ ${card.name}`}>
      <div className="svc-card-head">
        <button
          type="button"
          className="svc-card-toggle"
          aria-expanded={open}
          onClick={() => onToggle(card.foldKey, !open)}
        >
          <RightOutlined className={`svc-chev${open ? " is-open" : ""}`} style={{ fontSize: 14, color: "#595959" }} />
          <span className="svc-avatar">{card.initials}</span>
          <span className="svc-card-title">
            <span className="svc-card-name" title={card.name}>
              {card.name}
            </span>
            <span className="svc-card-meta">
              {card.code && `${card.code} · `}
              {card.specimenCount} nền mẫu · {card.indicatorCount} chỉ tiêu · {card.methodCount} phương pháp
            </span>
          </span>
        </button>
        {card.pendingCount > 0 && <span className="svc-pill is-pending">{card.pendingCount} chờ định giá</span>}
        {card.subcontractCount > 0 && <span className="svc-pill">{card.subcontractCount} hợp đồng phụ</span>}
        <span className="svc-range">{card.priceRangeText}</span>
        {canCreate && (
          <button type="button" className="svc-add-btn" title="Thêm nền mẫu / chỉ tiêu cho dịch vụ này" onClick={() => onAdd(card.groupId)}>
            <PlusOutlined style={{ fontSize: 12 }} />
            Thêm
          </button>
        )}
        {showMenu && (
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: buildGroupMenu(canEdit, canDelete),
              onClick: ({ key }) => onGroupAction(key as ServiceGroupAction, card),
            }}
          >
            <button type="button" className="svc-more-btn" aria-label={`Thao tác dịch vụ ${card.name}`} title="Đổi tên / xóa dịch vụ">
              <MoreOutlined style={{ fontSize: 14 }} />
            </button>
          </Dropdown>
        )}
      </div>
      {open && (
        <>
          <div className="svc-grid svc-colhead" role="row">
            <span>Chỉ tiêu</span>
            <span>Phương pháp</span>
            <span>ĐVT</span>
            <span className="svc-colhead-price">Đơn giá (đ)</span>
            <span>Hợp đồng phụ</span>
          </div>
          {card.specimens.length === 0 && (
            <p className="svc-card-empty">Dịch vụ chưa có chỉ tiêu — bấm “Thêm” để khai báo, hoặc chuột phải vào dòng ở dịch vụ khác để chuyển sang.</p>
          )}
          {card.specimens.map((b) => (
            <ServiceSpecimenBlock
              key={b.foldKey}
              block={b}
              open={isSpecimenOpen(fold, b.foldKey, level)}
              edits={edits}
              editingId={editingId}
              canEdit={canEdit}
              onToggle={onToggle}
              onStartEdit={onStartEdit}
              onEditCommit={onEditCommit}
              onEditCancel={onEditCancel}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default ServiceGroupCard;
