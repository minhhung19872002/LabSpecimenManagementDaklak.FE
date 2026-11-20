import React from "react";
import { Spin } from "antd";
import type { MethodBatchNormDto, ServiceBatchNormDto, ServiceBatchNormEquipmentDto } from "../../../../services/serviceCatalogService";
import BatchNormsToolbar, { type BatchNormsToolbarProps } from "./BatchNormsToolbar";
import BatchNormsViewBar from "./BatchNormsViewBar";
import NormGroupCard from "./NormGroupCard";
import AddMethodModal, { type AddMethodModalProps } from "./AddMethodModal";
import DeleteNormConfirm, { type DeleteNormConfirmProps } from "./DeleteNormConfirm";
import UndoToast, { type UndoToastProps } from "./UndoToast";
import type { FoldState, NormGroupCard as GroupCardData, NormIndicatorBlock as IndicatorBlockData } from "./utils";
import "../../ServiceCatalog/ServiceCatalog/ServiceCatalog.css";
import "./BatchNorms.css";

export interface BatchNormsViewProps {
  loading: boolean;
  /** Chưa có định mức nào (khác với lọc không ra) */
  isEmpty: boolean;
  toolbar: BatchNormsToolbarProps;
  cards: GroupCardData[];
  specimenCount: number;
  indicatorCount: number;
  normCount: number;
  fold: FoldState;
  more: FoldState;
  allOpen: boolean;
  filtered: boolean;
  keyword: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAddMethod: (block: IndicatorBlockData) => void;
  onEdit: (testMethodIndicatorId: string) => void;
  onToggleActive: (normId: string) => Promise<void>;
  onDelete: (norm: ServiceBatchNormDto) => void;
  loadMaterials: (testMethodIndicatorId: string) => Promise<MethodBatchNormDto[]>;
  loadEquipments: (testMethodIndicatorId: string) => Promise<ServiceBatchNormEquipmentDto[]>;
  addModal: AddMethodModalProps;
  deleteConfirm: DeleteNormConfirmProps;
  toast: UndoToastProps;
}

/** L3 — Định mức theo mẻ: Nhóm nền mẫu → Nền mẫu → Chỉ tiêu × Phương pháp */
const BatchNormsView: React.FC<BatchNormsViewProps> = ({
  loading,
  isEmpty,
  toolbar,
  cards,
  specimenCount,
  indicatorCount,
  normCount,
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
  onExpandAll,
  onCollapseAll,
  onAddMethod,
  onEdit,
  onToggleActive,
  onDelete,
  loadMaterials,
  loadEquipments,
  addModal,
  deleteConfirm,
  toast,
}) => (
  <Spin spinning={loading}>
    <BatchNormsToolbar {...toolbar} />
    <BatchNormsViewBar
      groupCount={cards.length}
      specimenCount={specimenCount}
      indicatorCount={indicatorCount}
      normCount={normCount}
      onExpandAll={onExpandAll}
      onCollapseAll={onCollapseAll}
    />
    <div className="svc-scroll">
      {cards.length === 0 ? (
        <p className="svc-empty">
          {loading ? "Đang tải…" : isEmpty ? "Chưa có định mức." : "Không có định mức khớp bộ lọc."}
        </p>
      ) : (
        <div className="svc-list bn-list">
          {cards.map((card) => (
            <NormGroupCard
              key={card.foldKey}
              card={card}
              fold={fold}
              more={more}
              allOpen={allOpen}
              filtered={filtered}
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
        </div>
      )}
    </div>
    <AddMethodModal {...addModal} />
    <DeleteNormConfirm {...deleteConfirm} />
    <UndoToast {...toast} />
  </Spin>
);

export default BatchNormsView;
