import React from "react";
import { Typography } from "antd";
import type { BatchNormMethodDto, MethodBatchNormDto } from "../../../../services/serviceCatalogService";
import BatchNormsToolbar, { type BatchNormsToolbarProps } from "./BatchNormsToolbar";
import BatchNormMethodTable from "./BatchNormMethodTable";
import MethodNormPanel from "../MethodNormPanel";

export interface BatchNormsViewProps extends BatchNormsToolbarProps {
  methods: BatchNormMethodDto[];
  expandedKeys: string[];
  onExpandedKeysChange: (keys: string[]) => void;
  onNormsChanged: (testMethodId: string, norms: MethodBatchNormDto[]) => void;
}

/** L3 — Định mức tiêu hao theo mẻ */
const BatchNormsView: React.FC<BatchNormsViewProps> = ({
  methods,
  expandedKeys,
  onExpandedKeysChange,
  onNormsChanged,
  ...toolbarProps
}) => (
  <div style={{ padding: 16 }}>
    <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
      Lượng vật tư tiêu hao cố định để chạy trọn 1 MẺ (rửa máy, đường chuẩn…), không đổi theo số mẫu. Tiêu hao / mẫu
      khi trả kết quả = Tổng tiêu hao 1 mẻ ÷ Dự toán mẫu năm của dịch vụ.
    </Typography.Paragraph>
    <BatchNormsToolbar {...toolbarProps} />
    <BatchNormMethodTable
      methods={methods}
      loading={toolbarProps.loading}
      expandedKeys={expandedKeys}
      onExpandedKeysChange={onExpandedKeysChange}
      renderNorms={(method) => (
        <MethodNormPanel
          testMethodId={method.testMethodId}
          testMethodName={method.name}
          onChanged={(norms) => onNormsChanged(method.testMethodId, norms)}
        />
      )}
    />
  </div>
);

export default BatchNormsView;
