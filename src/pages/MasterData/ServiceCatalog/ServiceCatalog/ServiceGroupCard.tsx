import React from "react";
import { PlusOutlined, RightOutlined } from "../../../../components/common/Icon";
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

export interface ServiceGroupCardProps {
  card: GroupCardData;
  fold: FoldState;
  level: ServiceOpenLevel;
  edits: PriceEdits;
  editingId: string | null;
  canCreate: boolean;
  canEdit: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onAdd: () => void;
  onStartEdit: (serviceId: string) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
}

/** Cấp 1: thẻ Dịch vụ (= nhóm chỉ tiêu) — tên, số liệu, khoảng giá, nút Thêm */
const ServiceGroupCard: React.FC<ServiceGroupCardProps> = ({
  card,
  fold,
  level,
  edits,
  editingId,
  canCreate,
  canEdit,
  onToggle,
  onAdd,
  onStartEdit,
  onEditCommit,
  onEditCancel,
}) => {
  const open = isServiceOpen(fold, card.foldKey, level);
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
              {card.specimenCount} nền mẫu · {card.indicatorCount} chỉ tiêu · {card.methodCount} phương pháp
            </span>
          </span>
        </button>
        {card.pendingCount > 0 && <span className="svc-pill is-pending">{card.pendingCount} chờ định giá</span>}
        {card.subcontractCount > 0 && <span className="svc-pill">{card.subcontractCount} hợp đồng phụ</span>}
        <span className="svc-range">{card.priceRangeText}</span>
        {canCreate && (
          <button type="button" className="svc-add-btn" title="Thêm nền mẫu / chỉ tiêu cho dịch vụ này" onClick={onAdd}>
            <PlusOutlined style={{ fontSize: 12 }} />
            Thêm
          </button>
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
