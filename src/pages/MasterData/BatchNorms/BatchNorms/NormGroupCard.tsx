import React from "react";
import { RightOutlined } from "../../../../components/common/Icon";
import type { MethodBatchNormDto, ServiceBatchNormDto, ServiceBatchNormEquipmentDto } from "../../../../services/serviceCatalogService";
import NormSpecimenBlock from "./NormSpecimenBlock";
import {
  isFoldOpen,
  type FoldState,
  type NormGroupCard as GroupCardData,
  type NormIndicatorBlock as IndicatorBlockData,
} from "./utils";

export interface NormGroupCardProps {
  card: GroupCardData;
  fold: FoldState;
  more: FoldState;
  allOpen: boolean;
  /** Đang lọc → mặc định mở để thấy kết quả */
  filtered: boolean;
  keyword: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onAddMethod: (block: IndicatorBlockData) => void;
  onEdit: (testMethodIndicatorId: string) => void;
  onToggleActive: (normId: string) => Promise<void>;
  onDelete: (norm: ServiceBatchNormDto) => void;
  loadMaterials: (testMethodIndicatorId: string) => Promise<MethodBatchNormDto[]>;
  loadEquipments: (testMethodIndicatorId: string) => Promise<ServiceBatchNormEquipmentDto[]>;
}

/** Cấp 1: thẻ nhóm nền mẫu — tên, số liệu, số đang / ngừng sử dụng */
const NormGroupCard: React.FC<NormGroupCardProps> = ({
  card,
  fold,
  more,
  allOpen,
  filtered,
  keyword,
  canCreate,
  canEdit,
  canDelete,
  onToggle,
  onToggleMore,
  onAddMethod,
  onEdit,
  onToggleActive,
  onDelete,
  loadMaterials,
  loadEquipments,
}) => {
  const open = isFoldOpen(fold, card.foldKey, allOpen, filtered);
  return (
    <section className={`svc-card${open ? " is-open" : ""}`} aria-label={`Nhóm nền mẫu ${card.name}`}>
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
              {card.specimenCount} nền mẫu · {card.indicatorCount} chỉ tiêu · {card.methodCount} phương pháp ·{" "}
              {card.normCount} định mức
            </span>
          </span>
        </button>
        {card.offCount > 0 && <span className="bn-pill-off">{card.offCount} ngừng sử dụng</span>}
        {card.onCount > 0 && <span className="bn-pill-on">{card.onCount} đang sử dụng</span>}
      </div>
      {open && (
        <>
          <div className="bn-grid bn-colhead" role="row">
            <span>Chỉ tiêu</span>
            <span>Phương pháp</span>
            <span className="bn-center">Vật tư sử dụng</span>
            <span className="bn-center">Thiết bị sử dụng</span>
            <span>Trạng thái sử dụng</span>
            <span className="bn-center">Thao tác</span>
          </div>
          {card.specimens.map((s) => (
            <NormSpecimenBlock
              key={s.foldKey}
              block={s}
              open={isFoldOpen(fold, s.foldKey, allOpen, filtered)}
              more={more}
              keyword={keyword}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              onToggle={onToggle}
              onToggleMore={onToggleMore}
              onAddMethod={onAddMethod}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              loadMaterials={loadMaterials}
              loadEquipments={loadEquipments}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default NormGroupCard;
