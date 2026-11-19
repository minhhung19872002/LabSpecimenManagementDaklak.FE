import React from "react";
import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IndicatorName } from "../../../../components/common";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import type { ServiceCellAction } from "./ServiceMatrixTable";
import { formatPrice, PENDING_PRICE_LABEL } from "./utils";

export interface ServiceListTableProps {
  services: ServiceCatalogItemDto[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
}

/** Danh sách dịch vụ phẳng + số version giá, mở lịch sử từng dịch vụ */
const ServiceListTable: React.FC<ServiceListTableProps> = ({
  services,
  loading,
  canEdit,
  canDelete,
  onAction,
}) => {
  const columns: ColumnsType<ServiceCatalogItemDto> = [
    {
      title: "Mã DV",
      dataIndex: "serviceCode",
      key: "serviceCode",
      width: 100,
      fixed: "left",
      render: (v) => <span style={{ fontWeight: 500 }}>{v || "—"}</span>,
    },
    {
      title: "Chỉ tiêu",
      key: "indicator",
      width: 240,
      render: (_, s) => (
        <span style={{ display: "inline-flex", flexDirection: "column" }}>
          <IndicatorName name={s.indicatorName} formattedName={s.indicatorFormattedName ?? undefined} />
          {s.indicatorGroupName && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {s.indicatorGroupName}
            </Typography.Text>
          )}
        </span>
      ),
    },
    {
      title: "Nền mẫu",
      key: "specimen",
      width: 160,
      render: (_, s) => s.specimenTypeName || <Typography.Text type="secondary">Mọi nền mẫu</Typography.Text>,
    },
    {
      title: "Phương pháp",
      key: "method",
      width: 240,
      render: (_, s) => (
        <span style={{ display: "inline-flex", flexDirection: "column" }}>
          <span>{s.testMethodName}</span>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {s.testMethodCode}
          </Typography.Text>
        </span>
      ),
    },
    {
      title: "Đơn giá (đ)",
      dataIndex: "priceAtDate",
      key: "price",
      width: 120,
      align: "right",
      render: (v) =>
        v == null ? (
          <Tag color="gold" style={{ margin: 0 }}>
            {PENDING_PRICE_LABEL}
          </Tag>
        ) : (
          <span style={{ fontWeight: 500 }}>{formatPrice(v)}</span>
        ),
    },
    {
      title: "Hợp đồng phụ",
      key: "subcontract",
      width: 180,
      render: (_, s) =>
        s.isSubcontract ? (
          <span style={{ display: "inline-flex", flexDirection: "column" }}>
            <Tag color="purple" style={{ margin: 0, width: "fit-content" }}>
              HĐ phụ
            </Tag>
            {s.subcontractorName && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {s.subcontractorName}
              </Typography.Text>
            )}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Version",
      dataIndex: "versionCount",
      key: "versions",
      width: 90,
      align: "center",
      render: (v, s) => (
        <Button type="link" size="small" onClick={() => onAction("history", s)}>
          {v}
        </Button>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 110,
      render: (_, s) =>
        s.isActive ? (
          <Tag color="success" style={{ margin: 0 }}>
            Đang sử dụng
          </Tag>
        ) : (
          <Tag style={{ margin: 0 }}>Ngừng</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_, s) => (
        <Space size={2}>
          <Tooltip title="Lịch sử giá / đổi giá">
            <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => onAction("history", s)} />
          </Tooltip>
          {canEdit && (
            <Tooltip title={s.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}>
              <Button
                type="link"
                size="small"
                icon={s.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => onAction("toggle", s)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Xóa dịch vụ">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => onAction("delete", s)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={services}
      rowKey="id"
      size="small"
      loading={loading}
      scroll={{ x: 1380 }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: (total) => (
          <>
            Tổng <b>{total}</b> dịch vụ
          </>
        ),
      }}
      locale={{ emptyText: "Không có dịch vụ phù hợp bộ lọc." }}
    />
  );
};

export default ServiceListTable;
