import React from "react";

export interface BatchNormsViewBarProps {
  groupCount: number;
  specimenCount: number;
  indicatorCount: number;
  normCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/** Thanh xem: tổng số theo bộ lọc · Mở / Thu gọn tất cả */
const BatchNormsViewBar: React.FC<BatchNormsViewBarProps> = ({
  groupCount,
  specimenCount,
  indicatorCount,
  normCount,
  onExpandAll,
  onCollapseAll,
}) => (
  <div className="svc-viewbar">
    <span>
      <strong>{groupCount}</strong> nhóm nền mẫu · <strong>{specimenCount}</strong> nền mẫu ·{" "}
      <strong>{indicatorCount}</strong> chỉ tiêu · <strong>{normCount}</strong> định mức
    </span>
    <span className="bn-viewbar-actions">
      <button type="button" className="bn-btn" onClick={onExpandAll}>
        Mở tất cả
      </button>
      <button type="button" className="bn-btn" onClick={onCollapseAll}>
        Thu gọn tất cả
      </button>
    </span>
  </div>
);

export default BatchNormsViewBar;
