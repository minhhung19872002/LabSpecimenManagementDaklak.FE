import React from "react";
import { Typography } from "antd";
import { PreparedSolutionIngredientDto } from "../../../services/preparedSolutionService";
import { formatVolume } from "./utils";

export interface PreparedSolutionIngredientListProps {
  ingredients: PreparedSolutionIngredientDto[];
}

/** Block "Nguyên liệu gốc đã trừ tiêu hao kho" — dùng chung cho expand row ở danh sách và trang chi tiết */
const PreparedSolutionIngredientList: React.FC<PreparedSolutionIngredientListProps> = ({
  ingredients,
}) => {
  if (ingredients.length === 0) return null;

  return (
    <div style={{ padding: "8px 16px 12px", background: "#fafafa" }}>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}
      >
        Nguyên liệu gốc đã trừ tiêu hao kho:
      </Typography.Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 8,
        }}
      >
        {ingredients.map((i) => (
          <div
            key={i.id}
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <Typography.Text strong style={{ fontSize: 13, flex: 1, minWidth: 0 }} ellipsis>
                {i.productName}
              </Typography.Text>
              <Typography.Text type="danger" strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                − {formatVolume(i.quantityUsed, i.unitName ?? undefined)}
              </Typography.Text>
            </div>
            {!i.isEquipment && (
              <div style={{ textAlign: "right", marginTop: 2 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Hệ thống đã tự trừ
                </Typography.Text>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreparedSolutionIngredientList;
