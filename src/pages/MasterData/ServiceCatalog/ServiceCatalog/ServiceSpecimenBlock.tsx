import React from "react";
import { ExperimentOutlined, RightOutlined } from "../../../../components/common/Icon";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import ServiceRow from "./ServiceRow";
import type { PriceEdits, ServiceSpecimenBlock as SpecimenBlockData } from "./utils";

export interface ServiceSpecimenBlockProps {
  block: SpecimenBlockData;
  open: boolean;
  edits: PriceEdits;
  editingId: string | null;
  canEdit: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onStartEdit: (serviceId: string) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
}

/** Cấp 2: tiêu đề nền mẫu (gập/mở) + các dòng chỉ tiêu */
const ServiceSpecimenBlock: React.FC<ServiceSpecimenBlockProps> = ({
  block,
  open,
  edits,
  editingId,
  canEdit,
  onToggle,
  onStartEdit,
  onEditCommit,
  onEditCancel,
}) => (
  <>
    <button
      type="button"
      className={`svc-specimen-head${block.isAll ? " is-all" : ""}`}
      aria-expanded={open}
      onClick={() => onToggle(block.foldKey, !open)}
    >
      <RightOutlined className={`svc-chev${open ? " is-open" : ""}`} style={{ fontSize: 12 }} />
      <ExperimentOutlined style={{ fontSize: 14 }} />
      <span className="svc-specimen-name" title={block.name}>
        {block.name}
      </span>
      <span className="svc-specimen-count">{block.services.length} chỉ tiêu</span>
      {block.pendingCount > 0 && <span className="svc-tag-sm">{block.pendingCount} chờ giá</span>}
    </button>
    {open &&
      block.services.map((s) => (
        <ServiceRow
          key={s.id}
          service={s}
          specimenName={block.name}
          editedPrice={edits.get(s.id)}
          isEditing={s.id === editingId}
          canEdit={canEdit}
          onStartEdit={onStartEdit}
          onEditCommit={onEditCommit}
          onEditCancel={onEditCancel}
        />
      ))}
  </>
);

export default ServiceSpecimenBlock;
