import React from "react";
import type { ServiceOpenLevel } from "./utils";

export interface ServiceViewBarProps {
  serviceCount: number;
  specimenCount: number;
  indicatorCount: number;
  level: ServiceOpenLevel;
  dense: boolean;
  onLevelChange: (level: ServiceOpenLevel) => void;
  onDenseChange: (dense: boolean) => void;
}

const LEVELS: { key: ServiceOpenLevel; label: string }[] = [
  { key: "service", label: "Dịch vụ" },
  { key: "specimen", label: "Nền mẫu" },
  { key: "indicator", label: "Chỉ tiêu" },
];

const radioClass = (on: boolean) => `svc-radio-btn${on ? " is-on" : ""}`;

/** Thanh xem: tổng số · "Mở đến" cấp nào · mật độ Gọn / Đầy đủ */
const ServiceViewBar: React.FC<ServiceViewBarProps> = ({
  serviceCount,
  specimenCount,
  indicatorCount,
  level,
  dense,
  onLevelChange,
  onDenseChange,
}) => (
  <div className="svc-viewbar">
    <span>
      <strong>{serviceCount}</strong> dịch vụ · <strong>{specimenCount}</strong> nền mẫu ·{" "}
      <strong>{indicatorCount}</strong> chỉ tiêu
    </span>
    <span className="svc-viewbar-level">Mở đến</span>
    <div className="svc-radio" role="radiogroup" aria-label="Mở danh sách đến cấp">
      {LEVELS.map((l) => (
        <button
          key={l.key}
          type="button"
          role="radio"
          aria-checked={level === l.key}
          className={radioClass(level === l.key)}
          onClick={() => onLevelChange(l.key)}
        >
          {l.label}
        </button>
      ))}
    </div>
    <div className="svc-radio" role="radiogroup" aria-label="Mật độ hiển thị">
      <button type="button" role="radio" aria-checked={dense} className={radioClass(dense)} onClick={() => onDenseChange(true)}>
        Gọn
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!dense}
        className={radioClass(!dense)}
        onClick={() => onDenseChange(false)}
      >
        Đầy đủ
      </button>
    </div>
  </div>
);

export default ServiceViewBar;
