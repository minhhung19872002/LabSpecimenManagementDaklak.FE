import React from "react";
import { Spin } from "antd";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import ForecastYearBar, { type ForecastYearBarProps } from "./ForecastYearBar";
import ForecastToolbar, { type ForecastToolbarProps } from "./ForecastToolbar";
import ForecastGroupCard from "./ForecastGroupCard";
import DeleteForecastConfirm, { type DeleteForecastConfirmProps } from "./DeleteForecastConfirm";
import UndoToast, { type UndoToastProps } from "../../BatchNorms/BatchNorms/UndoToast";
import type { FoldState, ForecastGroupCard as GroupCardData } from "./utils";
import "../../ServiceCatalog/ServiceCatalog/ServiceCatalog.css";
import "../../BatchNorms/BatchNorms/BatchNorms.css";
import "./YearlyForecasts.css";

export interface YearlyForecastsViewProps {
  loading: boolean;
  yearBar: ForecastYearBarProps;
  toolbar: ForecastToolbarProps;
  cards: GroupCardData[];
  /** Năm chưa có dòng nào trong phạm vi đang xem (khác với lọc không ra) */
  emptyText: string;
  fold: FoldState;
  more: FoldState;
  allOpen: boolean;
  filtered: boolean;
  showAll: boolean;
  editable: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onDelete: (row: YearlyForecastRowDto) => void;
  deleteConfirm: DeleteForecastConfirmProps;
  toast: UndoToastProps;
}

/** L4 — Dự toán mẫu năm: Nhóm nền mẫu → Nền mẫu → Chỉ tiêu × Phương pháp */
const YearlyForecastsView: React.FC<YearlyForecastsViewProps> = ({
  loading,
  yearBar,
  toolbar,
  cards,
  emptyText,
  fold,
  more,
  allOpen,
  filtered,
  showAll,
  editable,
  onToggle,
  onToggleMore,
  onDelete,
  deleteConfirm,
  toast,
}) => (
  <Spin spinning={loading}>
    <ForecastYearBar {...yearBar} />
    <ForecastToolbar {...toolbar} />
    <div className="svc-scroll">
      {cards.length === 0 ? (
        <p className="svc-empty">{loading ? "Đang tải…" : emptyText}</p>
      ) : (
        <div className="svc-list yf-list">
          {cards.map((card) => (
            <ForecastGroupCard
              key={card.foldKey}
              card={card}
              fold={fold}
              more={more}
              allOpen={allOpen}
              filtered={filtered}
              showAll={showAll}
              editable={editable}
              onToggle={onToggle}
              onToggleMore={onToggleMore}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
    <DeleteForecastConfirm {...deleteConfirm} />
    <UndoToast {...toast} />
  </Spin>
);

export default YearlyForecastsView;
