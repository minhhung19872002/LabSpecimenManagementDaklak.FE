import React from "react";
import { Empty } from "antd";
import type { IndicatorDto } from "../../../../services/masterDataService";
import StepLabel, { type StepState } from "./StepLabel";
import QuickFillBar, { type QuickFillBarProps } from "./QuickFillBar";
import PriceBlockSection, { type PriceBlockSectionProps, type PriceBlockStats } from "./PriceBlockSection";
import type { DeclareColumn } from "./utils";

export interface PriceBlockView {
  column: DeclareColumn;
  stats: PriceBlockStats;
  folded: boolean;
  blockPrice: number | null;
}

/** Phần props dùng chung cho mọi khối nền mẫu */
export type SharedBlockProps = Omit<PriceBlockSectionProps, "column" | "indicators" | "stats" | "folded" | "blockPrice">;

export interface PriceDeclarePanelProps {
  step: StepState;
  indicators: IndicatorDto[];
  blocks: PriceBlockView[];
  quickFill: QuickFillBarProps;
  shared: SharedBlockProps;
}

/** Bước ⑤ ĐVT + Giá: điền nhanh + khối giá theo từng nền mẫu */
const PriceDeclarePanel: React.FC<PriceDeclarePanelProps> = ({ step, indicators, blocks, quickFill, shared }) => {
  const ready = indicators.length > 0 && blocks.length > 0;
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px 14px",
          flexWrap: "wrap",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <StepLabel index={5} state={step} title="ĐVT & giá tiền" hint="(giá không bắt buộc)" />
        {ready && <QuickFillBar {...quickFill} />}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>
        {!ready ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 64 }}
            description={
              blocks.length === 0
                ? "Chọn nền mẫu ở bước ③ — bảng giá sẽ hiện ở đây."
                : "Tích chọn chỉ tiêu ở bước ④ — bảng giá sẽ hiện ở đây."
            }
          />
        ) : (
          <>
            {blocks.map((b) => (
              <PriceBlockSection
                key={b.column.key}
                column={b.column}
                indicators={indicators}
                stats={b.stats}
                folded={b.folded}
                blockPrice={b.blockPrice}
                {...shared}
              />
            ))}
            <p style={{ margin: 0, padding: "10px 16px", fontSize: 12, color: "#595959" }}>
              3 cách điền nhanh: ô “Điền nhanh” phía trên (cả phiếu) · “Giá cho cả nền mẫu” trên từng nhóm · nút sao chép cạnh
              ô giá để dùng cùng giá cho chỉ tiêu đó ở mọi nền mẫu. Ô để trống → “Chờ định giá”. ĐVT (đơn vị tiêu hao)
              điền sẵn theo phương pháp, gõ lại ở từng dòng nếu khác — bắt buộc.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceDeclarePanel;
