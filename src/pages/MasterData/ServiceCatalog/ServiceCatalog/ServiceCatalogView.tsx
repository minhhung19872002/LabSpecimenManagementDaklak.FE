import React from "react";
import { Spin } from "antd";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import ServiceCatalogToolbar, { type ServiceCatalogToolbarProps } from "./ServiceCatalogToolbar";
import ServiceViewBar, { type ServiceViewBarProps } from "./ServiceViewBar";
import ServiceGroupCard, { type ServiceGroupAction } from "./ServiceGroupCard";
import ServiceCellContextMenu, { type ServiceCellAction } from "./ServiceCellContextMenu";
import PendingPriceBar from "./PendingPriceBar";
import type { FoldState, PriceEdits, ServiceGroupCard as GroupCardData, ServiceOpenLevel } from "./utils";
import "./ServiceCatalog.css";

export interface ServiceCatalogViewProps {
  toolbar: ServiceCatalogToolbarProps;
  viewBar: ServiceViewBarProps;
  cards: GroupCardData[];
  loading: boolean;
  fold: FoldState;
  level: ServiceOpenLevel;
  dense: boolean;
  edits: PriceEdits;
  editingId: string | null;
  serviceById: ReadonlyMap<string, ServiceCatalogItemDto>;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleFold: (foldKey: string, open: boolean) => void;
  onAddToGroup: (serviceGroupId: string | null) => void;
  onGroupAction: (action: ServiceGroupAction, card: GroupCardData) => void;
  onStartEdit: (serviceId: string) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
  onCellAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
  onCancelEdits: () => void;
  onSaveEdits: () => Promise<void>;
}

/** L2 — Dịch vụ & Bảng giá: Dịch vụ (nhóm chỉ tiêu) ▸ Nền mẫu ▸ Chỉ tiêu & giá */
const ServiceCatalogView: React.FC<ServiceCatalogViewProps> = ({
  toolbar,
  viewBar,
  cards,
  loading,
  fold,
  level,
  dense,
  edits,
  editingId,
  serviceById,
  canCreate,
  canEdit,
  canDelete,
  onToggleFold,
  onAddToGroup,
  onGroupAction,
  onStartEdit,
  onEditCommit,
  onEditCancel,
  onCellAction,
  onCancelEdits,
  onSaveEdits,
}) => (
  <div>
    <ServiceCatalogToolbar {...toolbar} />
    <ServiceViewBar {...viewBar} />
    <Spin spinning={loading}>
      <ServiceCellContextMenu serviceById={serviceById} canEdit={canEdit} canDelete={canDelete} onCellAction={onCellAction}>
        <div className="svc-scroll">
          {cards.length === 0 ? (
            <p className="svc-empty">{loading ? "Đang tải…" : "Không có dịch vụ khớp bộ lọc."}</p>
          ) : (
            <div className={`svc-list${dense ? " is-dense" : ""}`}>
              {cards.map((card) => (
                <ServiceGroupCard
                  key={card.foldKey}
                  card={card}
                  fold={fold}
                  level={level}
                  edits={edits}
                  editingId={editingId}
                  canCreate={canCreate}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onToggle={onToggleFold}
                  onAdd={onAddToGroup}
                  onGroupAction={onGroupAction}
                  onStartEdit={onStartEdit}
                  onEditCommit={onEditCommit}
                  onEditCancel={onEditCancel}
                />
              ))}
            </div>
          )}
        </div>
      </ServiceCellContextMenu>
    </Spin>
    {edits.size > 0 && <PendingPriceBar count={edits.size} onCancel={onCancelEdits} onSave={onSaveEdits} />}
  </div>
);

export default ServiceCatalogView;
