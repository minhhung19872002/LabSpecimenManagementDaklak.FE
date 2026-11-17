import React from "react";
import { Dropdown, Input, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import {
  formatPrice,
  formatShortDate,
  hasUpcomingAfter,
  type ServiceMatrixRow,
  type SpecimenColumn,
} from "./utils";

export type ServiceCellAction = "history" | "toggle" | "delete";

export interface ServiceEditingCell {
  serviceId: string;
  value: number | null;
}

export interface ServiceMatrixTableProps {
  rows: ServiceMatrixRow[];
  specimenColumns: SpecimenColumn[];
  loading: boolean;
  /** YYYY-MM-DD — ngày đang xem giá */
  viewDate: string;
  selectedRowKeys: string[];
  expandedRowKeys: string[];
  editing: ServiceEditingCell | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSelectionChange: (keys: string[]) => void;
  onExpandedChange: (keys: string[]) => void;
  onCellDoubleClick: (service: ServiceCatalogItemDto) => void;
  onEmptyCellDoubleClick: (row: ServiceMatrixRow, column: SpecimenColumn) => void;
  onEditValueChange: (value: number | null) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onCellAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
}

const CELL_WIDTH = 160;
const NAME_WIDTH = 300;

const cellBoxStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  boxSizing: "border-box",
  padding: "4px 10px",
  border: "1px solid #F0F0F0",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  cursor: "cell",
  userSelect: "none",
};

/** Ma trận giá: nhóm chỉ tiêu ▸ dòng Chỉ tiêu + Phương pháp, cột = Nền mẫu, ô = Giá */
const ServiceMatrixTable: React.FC<ServiceMatrixTableProps> = ({
  rows,
  specimenColumns,
  loading,
  viewDate,
  selectedRowKeys,
  expandedRowKeys,
  editing,
  canCreate,
  canEdit,
  canDelete,
  onSelectionChange,
  onExpandedChange,
  onCellDoubleClick,
  onEmptyCellDoubleClick,
  onEditValueChange,
  onEditCommit,
  onEditCancel,
  onCellAction,
}) => {
  const buildMenu = (service: ServiceCatalogItemDto): MenuProps["items"] => {
    const items: MenuProps["items"] = [{ key: "history", label: "Lịch sử giá / đổi giá" }];
    if (canEdit) items.push({ key: "toggle", label: service.isActive ? "Ngừng sử dụng" : "Kích hoạt lại" });
    if (canDelete) items.push({ type: "divider" }, { key: "delete", label: "Xóa dịch vụ", danger: true });
    return items;
  };

  const renderCell = (row: ServiceMatrixRow, column: SpecimenColumn) => {
    const service = row.cells[column.key];
    if (!service) {
      return (
        <div
          style={{ ...cellBoxStyle, background: "#FAFAFA", color: "#8c8c8c", cursor: canCreate ? "cell" : "default" }}
          title={canCreate ? "Chưa có dịch vụ — nhấp đúp để tạo" : "Chưa có dịch vụ"}
          onDoubleClick={() => canCreate && onEmptyCellDoubleClick(row, column)}
        >
          —
        </div>
      );
    }

    if (editing?.serviceId === service.id) {
      return (
        <NumericFormat
          autoFocus
          value={editing.value ?? ""}
          onValueChange={(values) => onEditValueChange(values.floatValue ?? null)}
          allowNegative={false}
          decimalScale={0}
          thousandSeparator="."
          decimalSeparator=","
          customInput={Input}
          style={{ width: "100%", height: 44, borderRadius: 8, textAlign: "right", fontWeight: 500 }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEditCommit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onEditCancel();
            }
          }}
          onBlur={onEditCommit}
        />
      );
    }

    const tat = service.turnaroundDaysAtDate ?? service.turnaroundDays;
    const upcoming = hasUpcomingAfter(service, viewDate);
    const sub = !service.isActive
      ? `Đã ngừng · ${service.serviceCode ?? ""}`
      : upcoming
        ? `▲ ${formatPrice(service.upcomingPrice)} từ ${formatShortDate(service.upcomingEffectiveDate)}`
        : `${service.serviceCode ?? ""}${tat != null ? ` · ${tat} ngày` : ""}`;

    return (
      <Dropdown
        trigger={["contextMenu"]}
        menu={{ items: buildMenu(service), onClick: ({ key }) => onCellAction(key as ServiceCellAction, service) }}
      >
        <div
          style={{ ...cellBoxStyle, background: service.isActive ? "#FFFFFF" : "#F5F5F5" }}
          title={`${service.serviceCode ?? ""} · hiệu lực từ ${formatShortDate(service.effectiveDateAtDate)}${
            canEdit ? " · nhấp đúp để sửa, chuột phải để xem thêm" : ""
          }`}
          onDoubleClick={() => canEdit && service.isActive && onCellDoubleClick(service)}
        >
          <span
            style={{
              fontWeight: 500,
              color: service.isActive ? "#262626" : "#8c8c8c",
              textDecoration: service.isActive ? undefined : "line-through",
            }}
          >
            {formatPrice(service.priceAtDate)}
          </span>
          <span
            style={{ fontSize: 11, whiteSpace: "nowrap", color: upcoming && service.isActive ? "#AD4E00" : "#8c8c8c" }}
          >
            {sub}
          </span>
        </div>
      </Dropdown>
    );
  };

  const columns: ColumnsType<ServiceMatrixRow> = [
    {
      title: "Chỉ tiêu · Phương pháp",
      key: "name",
      width: NAME_WIDTH,
      fixed: "left",
      onCell: (r) =>
        r.kind === "group" ? { colSpan: specimenColumns.length + 1, style: { background: "#FAFAFA" } } : {},
      render: (_, r) =>
        r.kind === "group" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{r.groupName}</span>
            <Tag style={{ borderRadius: 999, margin: 0 }}>{r.rowCount} dòng</Tag>
          </span>
        ) : (
          <span style={{ display: "inline-flex", flexDirection: "column", paddingLeft: r.isSubIndicator ? 16 : 0 }}>
            <span style={{ fontWeight: 500 }}>
              {r.isSubIndicator && <span style={{ color: "#8c8c8c" }}>↳ </span>}
              <IndicatorName name={r.indicatorName ?? ""} formattedName={r.indicatorFormattedName ?? undefined} />
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.testMethodName}
              {r.testMethodCode ? ` · ${r.testMethodCode}` : ""}
            </Typography.Text>
          </span>
        ),
    },
    ...specimenColumns.map(
      (col): ColumnsType<ServiceMatrixRow>[number] => ({
        title: col.name,
        key: col.key,
        width: CELL_WIDTH,
        align: "right",
        onCell: (r) => (r.kind === "group" ? { colSpan: 0 } : { style: { padding: "6px 4px" } }),
        render: (_, r) => (r.kind === "group" ? null : renderCell(r, col)),
      })
    ),
  ];

  return (
    <Table
      columns={columns}
      dataSource={rows}
      rowKey="key"
      size="small"
      loading={loading}
      scroll={{ x: NAME_WIDTH + 48 + specimenColumns.length * CELL_WIDTH }}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: (keys) => onExpandedChange(keys as string[]),
        indentSize: 0,
      }}
      rowSelection={{
        selectedRowKeys,
        checkStrictly: false,
        columnWidth: 48,
        fixed: true,
        onChange: (keys) => onSelectionChange(keys as string[]),
      }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        showTotal: (total) => (
          <>
            Tổng <b>{total}</b> nhóm
          </>
        ),
      }}
      locale={{ emptyText: "Không có dịch vụ phù hợp bộ lọc." }}
    />
  );
};

export default ServiceMatrixTable;
