import React, { useState } from "react";
import { Popover, Spin } from "antd";
import { DesktopOutlined, ExperimentOutlined } from "../../../../components/common/Icon";
import type { MethodBatchNormDto, ServiceBatchNormEquipmentDto } from "../../../../services/serviceCatalogService";
import { formatNormQuantity } from "./utils";

export interface NormMaterialPopoverProps {
  testMethodIndicatorId: string;
  count: number;
  /** "Chỉ tiêu – Phương pháp" hiện ở đầu popover */
  title: string;
  loadMaterials: (testMethodIndicatorId: string) => Promise<MethodBatchNormDto[]>;
}

/**
 * Chip "Vật tư sử dụng": bấm → tải và liệt kê vật tư khai báo trừ tiêu hao (chỉ xem).
 * Tự quản trạng thái tải như nút async tự loading — chỉ 1 chip re-render khi mở.
 */
export const NormMaterialPopover = React.memo<NormMaterialPopoverProps>(function NormMaterialPopover({
  testMethodIndicatorId,
  count,
  title,
  loadMaterials,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MethodBatchNormDto[] | null>(null);
  const [failed, setFailed] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (!open || count === 0) return;
    setLoading(true);
    setFailed(false);
    try {
      setItems(await loadMaterials(testMethodIndicatorId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const renderBody = () => {
    if (count === 0) return <p className="bn-pop-empty">Chưa khai báo vật tư</p>;
    if (failed) return <p className="bn-pop-empty">Không tải được danh sách vật tư</p>;
    if (!items) return <Spin size="small" />;
    if (items.length === 0) return <p className="bn-pop-empty">Chưa khai báo vật tư</p>;
    return (
      <ul className="bn-pop-list">
        {items.map((m) => (
          <li key={m.id} className="bn-pop-item">
            <span className="bn-pop-name">
              {m.productName || m.productCode || "—"}
              {!m.isActive && " (ngừng)"}
            </span>
            <span className="bn-pop-qty">
              {formatNormQuantity(m.batchQuantity)} {m.unitName ?? ""}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Popover
      trigger="click"
      placement="bottom"
      onOpenChange={handleOpenChange}
      title={<span className="bn-pop-title">Vật tư sử dụng · {title}</span>}
      content={
        <div className="bn-pop">
          <Spin spinning={loading && items != null} size="small">
            {renderBody()}
          </Spin>
        </div>
      }
    >
      <button type="button" className="bn-chip is-material" aria-label={`${count} vật tư sử dụng`} title="Xem vật tư sử dụng">
        <ExperimentOutlined style={{ fontSize: 12 }} />
        {count}
      </button>
    </Popover>
  );
});

export interface NormEquipmentPopoverProps {
  testMethodIndicatorId: string;
  count: number;
  title: string;
  loadEquipments: (testMethodIndicatorId: string) => Promise<ServiceBatchNormEquipmentDto[]>;
}

/** Chip "Thiết bị sử dụng": bấm → tải và liệt kê thiết bị + công suất sử dụng (chỉ xem) */
export const NormEquipmentPopover = React.memo<NormEquipmentPopoverProps>(function NormEquipmentPopover({
  testMethodIndicatorId,
  count,
  title,
  loadEquipments,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ServiceBatchNormEquipmentDto[] | null>(null);
  const [failed, setFailed] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (!open || count === 0) return;
    setLoading(true);
    setFailed(false);
    try {
      setItems(await loadEquipments(testMethodIndicatorId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const renderBody = () => {
    if (count === 0) return <p className="bn-pop-empty">Chưa khai báo thiết bị</p>;
    if (failed) return <p className="bn-pop-empty">Không tải được danh sách thiết bị</p>;
    if (!items) return <Spin size="small" />;
    if (items.length === 0) return <p className="bn-pop-empty">Chưa khai báo thiết bị</p>;
    return (
      <ul className="bn-pop-list">
        {items.map((e) => (
          <li key={e.id} className="bn-pop-item">
            <span className="bn-pop-name">{e.productName || e.productCode || "—"}</span>
            <span className="bn-pop-qty">
              {formatNormQuantity(e.capacity)} {e.capacityUnit}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Popover
      trigger="click"
      placement="bottom"
      onOpenChange={handleOpenChange}
      title={<span className="bn-pop-title">Thiết bị sử dụng · {title}</span>}
      content={
        <div className="bn-pop">
          <Spin spinning={loading && items != null} size="small">
            {renderBody()}
          </Spin>
        </div>
      }
    >
      <button type="button" className="bn-chip is-equipment" aria-label={`${count} thiết bị sử dụng`} title="Xem thiết bị sử dụng">
        <DesktopOutlined style={{ fontSize: 12 }} />
        {count}
      </button>
    </Popover>
  );
});
