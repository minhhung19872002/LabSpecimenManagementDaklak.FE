import React from "react";
import { Typography } from "antd";
import ServiceCatalogToolbar, { type ServiceCatalogToolbarProps } from "./ServiceCatalogToolbar";
import ServiceMatrixTable, { type ServiceMatrixTableProps } from "./ServiceMatrixTable";

export interface ServiceCatalogViewProps {
  toolbar: ServiceCatalogToolbarProps;
  matrix: ServiceMatrixTableProps;
  totalCount: number;
}

/** L2 — Dịch vụ & Bảng giá */
const ServiceCatalogView: React.FC<ServiceCatalogViewProps> = ({ toolbar, matrix, totalCount }) => (
  <div style={{ padding: 16 }}>
    <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
      Mỗi dịch vụ = Chỉ tiêu + Nền mẫu + Phương pháp, có giá và thời gian trả kết quả (TAT) theo phiên bản. Đổi giá
      tạo phiên bản mới — báo giá / phiếu cũ giữ giá đã lưu.
    </Typography.Paragraph>
    <ServiceCatalogToolbar {...toolbar} />
    <ServiceMatrixTable {...matrix} />
    <Typography.Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
      {totalCount} dịch vụ · Nhấp: chọn ô · Nhấp đúp: sửa giá (Enter lưu, Esc hủy — áp dụng từ hôm nay) · Nhấp đúp ô
      trống: tạo dịch vụ · Chuột phải: lịch sử giá / ngừng / xóa · Ô vàng “→”: giá mới sắp áp dụng.
    </Typography.Paragraph>
  </div>
);

export default ServiceCatalogView;
