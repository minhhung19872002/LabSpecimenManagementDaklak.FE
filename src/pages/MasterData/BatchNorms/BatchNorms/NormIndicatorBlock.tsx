import React, { useState } from "react";
import { Switch, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, RightOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { MethodBatchNormDto, ServiceBatchNormDto, ServiceBatchNormEquipmentDto } from "../../../../services/serviceCatalogService";
import { NormEquipmentPopover, NormMaterialPopover } from "./NormMaterialPopover";
import { NORM_PREVIEW_LIMIT, isNormPending, methodNameOf, type NormIndicatorBlock as IndicatorBlockData } from "./utils";

export interface NormIndicatorBlockProps {
  block: IndicatorBlockData;
  /** Đang mở "Xem thêm" */
  expanded: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onAddMethod: (block: IndicatorBlockData) => void;
  /** Mở phiếu sửa định mức của bộ */
  onEdit: (testMethodIndicatorId: string) => void;
  onToggleActive: (normId: string) => Promise<void>;
  onDelete: (norm: ServiceBatchNormDto) => void;
  loadMaterials: (testMethodIndicatorId: string) => Promise<MethodBatchNormDto[]>;
  loadEquipments: (testMethodIndicatorId: string) => Promise<ServiceBatchNormEquipmentDto[]>;
}

/** Công tắc Trạng thái sử dụng — tự quản loading, chỉ dòng được bấm re-render */
const NormStatusSwitch = React.memo<{
  id: string;
  checked: boolean;
  disabled?: boolean;
  label: string;
  onToggle: (id: string) => Promise<void>;
}>(function NormStatusSwitch({ id, checked, disabled, label, onToggle }) {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Switch
        size="small"
        checked={checked}
        loading={loading}
        disabled={disabled || loading}
        aria-label={`Trạng thái sử dụng ${label}`}
        onChange={async () => {
          setLoading(true);
          try {
            await onToggle(id);
          } finally {
            setLoading(false);
          }
        }}
      />
      <span className={`bn-status-text${checked ? " is-on" : ""}`}>{checked ? "Đang sử dụng" : "Ngừng sử dụng"}</span>
    </>
  );
});

const cellClass = (base: string, index: number, active: boolean) =>
  `bn-cell ${base}${index > 0 ? " is-sep" : ""}${active ? "" : " is-off"}`;

/** Cấp 3: 1 chỉ tiêu trên nền mẫu — ô chỉ tiêu trải dọc theo các dòng phương pháp */
const NormIndicatorBlock: React.FC<NormIndicatorBlockProps> = ({
  block,
  expanded,
  canCreate,
  canEdit,
  canDelete,
  onToggleMore,
  onAddMethod,
  onEdit,
  onToggleActive,
  onDelete,
  loadMaterials,
  loadEquipments,
}) => {
  const total = block.norms.length;
  const hidden = Math.max(0, total - NORM_PREVIEW_LIMIT);
  const shown = expanded ? block.norms : block.norms.slice(0, NORM_PREVIEW_LIMIT);
  return (
    <div className="bn-grid bn-block" role="rowgroup" aria-label={`Chỉ tiêu ${block.indicatorName}`}>
      <div className="bn-indicator" style={{ gridRow: `1 / span ${Math.max(1, shown.length)}` }}>
        <IndicatorName
          className="bn-indicator-name"
          name={block.indicatorName}
          formattedName={block.indicatorFormattedName}
        />
        {total > 1 && <span className="bn-tag-count">{total} phương pháp</span>}
        {canCreate && block.candidateCount > 0 && (
          <button type="button" className="bn-add-link" onClick={() => onAddMethod(block)}>
            + Thêm phương pháp
          </button>
        )}
      </div>
      {shown.map((n, i) => {
        const row = i + 1;
        const methodName = methodNameOf(n);
        const label = `${block.indicatorName} – ${methodName}`;
        return (
          <React.Fragment key={n.id}>
            <div className={cellClass("bn-method", i, n.isActive)} style={{ gridRow: row, gridColumn: 2 }}>
              <span className="bn-method-line">
                <span className="bn-method-name" title={n.serviceCode ? `${methodName} · ${n.serviceCode}` : methodName}>
                  {methodName}
                </span>
                {isNormPending(n) && <span className="bn-tag-pending">Chưa khai báo định mức</span>}
              </span>
              {n.code && (
                <span className="bn-norm-code" title="Mã định mức">
                  {n.code}
                </span>
              )}
            </div>
            <div className={cellClass("is-centered", i, n.isActive)} style={{ gridRow: row, gridColumn: 3 }}>
              <NormMaterialPopover
                testMethodIndicatorId={n.testMethodIndicatorId}
                count={n.materialCount}
                title={label}
                loadMaterials={loadMaterials}
              />
            </div>
            <div className={cellClass("is-centered", i, n.isActive)} style={{ gridRow: row, gridColumn: 4 }}>
              <NormEquipmentPopover
                testMethodIndicatorId={n.testMethodIndicatorId}
                count={n.equipmentCount}
                title={label}
                loadEquipments={loadEquipments}
              />
            </div>
            <div className={cellClass("bn-status", i, n.isActive)} style={{ gridRow: row, gridColumn: 5 }}>
              <NormStatusSwitch
                id={n.id}
                checked={n.isActive}
                disabled={!canEdit}
                label={label}
                onToggle={onToggleActive}
              />
            </div>
            <div className={cellClass("bn-actions", i, n.isActive)} style={{ gridRow: row, gridColumn: 6 }}>
              {canEdit && (
                <button type="button" className="bn-icon-btn"
                  title="Sửa"
                  aria-label={`Sửa định mức ${label}`}
                  onClick={() => onEdit(n.testMethodIndicatorId)}
                >
                  <EditOutlined style={{ fontSize: 14 }} />
                </button>
              )}
              {canDelete && (
                <Tooltip title={n.isUsed ? "Đã phát sinh tiêu hao — chỉ ngừng sử dụng" : "Xóa"}>
                  <span>
                    <button
                      type="button"
                      className="bn-icon-btn is-danger"
                      aria-label={`Xóa định mức ${label}`}
                      disabled={n.isUsed}
                      onClick={() => onDelete(n)}
                    >
                      <DeleteOutlined style={{ fontSize: 14 }} />
                    </button>
                  </span>
                </Tooltip>
              )}
            </div>
          </React.Fragment>
        );
      })}
      {hidden > 0 && (
        <div className="bn-foot" style={{ gridRow: shown.length + 1 }}>
          <button type="button" className="bn-more-btn" aria-expanded={expanded} onClick={() => onToggleMore(block.key, !expanded)}>
            <RightOutlined className={`svc-chev${expanded ? " is-open" : ""}`} style={{ fontSize: 11 }} />
            {expanded ? "Thu gọn" : `Xem thêm ${hidden} phương pháp`}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(NormIndicatorBlock);
