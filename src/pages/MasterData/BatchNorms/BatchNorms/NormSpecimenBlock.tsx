import React from "react";
import { ExperimentOutlined, RightOutlined } from "../../../../components/common/Icon";
import type { MethodBatchNormDto, ServiceBatchNormDto, ServiceBatchNormEquipmentDto } from "../../../../services/serviceCatalogService";
import NormIndicatorBlock from "./NormIndicatorBlock";
import {
  isBlockExpanded,
  type FoldState,
  type NormIndicatorBlock as IndicatorBlockData,
  type NormSpecimenBlock as SpecimenBlockData,
} from "./utils";

export interface NormSpecimenBlockProps {
  block: SpecimenBlockData;
  open: boolean;
  more: FoldState;
  keyword: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onAddMethod: (block: IndicatorBlockData) => void;
  onToggleActive: (normId: string) => Promise<void>;
  onDelete: (norm: ServiceBatchNormDto) => void;
  loadMaterials: (testMethodIndicatorId: string) => Promise<MethodBatchNormDto[]>;
  loadEquipments: (testMethodIndicatorId: string) => Promise<ServiceBatchNormEquipmentDto[]>;
}

/** Cấp 2: tiêu đề nền mẫu (gập/mở) + các khối chỉ tiêu */
const NormSpecimenBlock: React.FC<NormSpecimenBlockProps> = ({
  block,
  open,
  more,
  keyword,
  canCreate,
  canEdit,
  canDelete,
  onToggle,
  onToggleMore,
  onAddMethod,
  onToggleActive,
  onDelete,
  loadMaterials,
  loadEquipments,
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
      <span className="svc-specimen-count">
        {block.indicatorCount} chỉ tiêu · {block.methodCount} phương pháp
      </span>
      {block.missingCount > 0 && (
        <span className="svc-tag-sm" title="Phương pháp đã khai báo trong dịch vụ nhưng chưa thêm vào danh sách">
          {block.missingCount} PP chưa thêm
        </span>
      )}
      {block.offCount > 0 && <span className="bn-tag-off">{block.offCount} ngừng</span>}
    </button>
    {open &&
      block.indicators.map((b) => (
        <NormIndicatorBlock
          key={b.key}
          block={b}
          expanded={isBlockExpanded(more, b, keyword)}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onToggleMore={onToggleMore}
          onAddMethod={onAddMethod}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          loadMaterials={loadMaterials}
          loadEquipments={loadEquipments}
        />
      ))}
  </>
);

export default NormSpecimenBlock;
