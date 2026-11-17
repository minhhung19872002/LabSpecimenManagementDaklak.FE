import React from "react";
import { Checkbox, Dropdown, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import {
  formatPrice,
  formatShortDate,
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
  selectedIds: Set<string>;
  editing: ServiceEditingCell | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCellClick: (service: ServiceCatalogItemDto) => void;
  onCellDoubleClick: (service: ServiceCatalogItemDto) => void;
  onEmptyCellDoubleClick: (row: ServiceMatrixRow, column: SpecimenColumn) => void;
  onEditValueChange: (value: number | null) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onRowSelect: (serviceIds: string[], checked: boolean) => void;
  onCellAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
}

const cellBaseStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "4px 8px",
  borderRadius: 4,
  cursor: "pointer",
  textAlign: "right",
  userSelect: "none",
};

/** Ma trận giá: dòng = Phương pháp ▸ Chỉ tiêu, cột = Nền mẫu */
const ServiceMatrixTable: React.FC<ServiceMatrixTableProps> = ({
  rows,
  specimenColumns,
  loading,
  selectedIds,
  editing,
  canCreate,
  canEdit,
  canDelete,
  onCellClick,
  onCellDoubleClick,
  onEmptyCellDoubleClick,
  onEditValueChange,
  onEditCommit,
  onEditCancel,
  onRowSelect,
  onCellAction,
}) => {
  // Phẳng hóa cây: dòng phương pháp làm tiêu đề nhóm (gộp hết cột)
  const flatRows = rows.flatMap((m) => [m, ...(m.children ?? [])]);
  const totalColumns = specimenColumns.length + 2;

  const renderSelect = (row: ServiceMatrixRow) => {
    const selected = row.serviceIds.filter((id) => selectedIds.has(id)).length;
    return (
      <Checkbox
        checked={selected > 0 && selected === row.serviceIds.length}
        indeterminate={selected > 0 && selected < row.serviceIds.length}
        onChange={(e) => onRowSelect(row.serviceIds, e.target.checked)}
      />
    );
  };

  const buildMenu = (service: ServiceCatalogItemDto): MenuProps["items"] => {
    const items: MenuProps["items"] = [{ key: "history", label: "Lịch sử giá / đổi giá" }];
    if (canEdit) items.push({ key: "toggle", label: service.isActive ? "Ngừng hoạt động" : "Kích hoạt" });
    if (canDelete) items.push({ type: "divider" }, { key: "delete", label: "Xóa dịch vụ", danger: true });
    return items;
  };

  const renderCell = (row: ServiceMatrixRow, column: SpecimenColumn) => {
    const service = row.cells[column.key];
    if (!service) {
      return (
        <div
          style={{ ...cellBaseStyle, color: "#bfbfbf", textAlign: "center" }}
          title={canCreate ? "Nhấp đúp để tạo dịch vụ" : undefined}
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
          size="small"
          style={{ width: "100%", textAlign: "right" }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") onEditCommit();
            if (e.key === "Escape") onEditCancel();
          }}
          onBlur={onEditCancel}
        />
      );
    }

    const selected = selectedIds.has(service.id);
    const tat = service.turnaroundDaysAtDate ?? service.turnaroundDays;
    return (
      <Dropdown
        trigger={["contextMenu"]}
        menu={{ items: buildMenu(service), onClick: ({ key }) => onCellAction(key as ServiceCellAction, service) }}
      >
        <div
          style={{
            ...cellBaseStyle,
            background: selected ? "#e6f4ff" : undefined,
            outline: selected ? "1px solid #1677ff" : undefined,
            opacity: service.isActive ? 1 : 0.5,
          }}
          onClick={() => onCellClick(service)}
          onDoubleClick={() => canEdit && onCellDoubleClick(service)}
        >
          <div style={{ fontWeight: 600, textDecoration: service.isActive ? undefined : "line-through" }}>
            {formatPrice(service.priceAtDate)}
          </div>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
            {service.serviceCode}
            {tat != null && ` · ${tat} ngày`}
          </div>
          {service.upcomingPrice != null && (
            <Tooltip title={`Giá mới từ ${formatShortDate(service.upcomingEffectiveDate)}`}>
              <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                → {formatPrice(service.upcomingPrice)}
              </Tag>
            </Tooltip>
          )}
        </div>
      </Dropdown>
    );
  };

  const columns: ColumnsType<ServiceMatrixRow> = [
    {
      key: "select",
      width: 40,
      fixed: "left",
      render: (_, r) => renderSelect(r),
    },
    {
      title: "Phương pháp ▸ Chỉ tiêu",
      key: "name",
      width: 320,
      fixed: "left",
      onCell: (r) => (r.kind === "method" ? { colSpan: totalColumns - 1 } : {}),
      render: (_, r) =>
        r.kind === "method" ? (
          <Space>
            <b>{r.testMethodCode}</b>
            <span style={{ fontWeight: 600 }}>{r.testMethodName}</span>
            <Tag>{r.serviceIds.length} dịch vụ</Tag>
          </Space>
        ) : (
          <div style={{ paddingLeft: r.isSubIndicator ? 32 : 16 }}>
            {r.isSubIndicator && <span style={{ color: "#8c8c8c" }}>↳ </span>}
            <IndicatorName name={r.indicatorName ?? ""} formattedName={r.indicatorFormattedName ?? undefined} />
            {r.indicatorGroupName && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {r.indicatorGroupName}
                </Typography.Text>
              </div>
            )}
          </div>
        ),
    },
    ...specimenColumns.map(
      (col): ColumnsType<ServiceMatrixRow>[number] => ({
        title: col.name,
        key: col.key,
        width: 150,
        align: "right",
        onCell: (r) => (r.kind === "method" ? { colSpan: 0 } : { style: { padding: 2 } }),
        render: (_, r) => (r.kind === "method" ? null : renderCell(r, col)),
      })
    ),
  ];

  return (
    <Table
      columns={columns}
      dataSource={flatRows}
      rowKey="key"
      size="small"
      bordered
      loading={loading}
      scroll={{ x: 360 + specimenColumns.length * 150 }}
      pagination={{ defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100, 200] }}
      rowClassName={(r) => (r.kind === "method" ? "service-matrix-method-row" : "")}
      onRow={(r) => (r.kind === "method" ? { style: { background: "#fafafa" } } : {})}
      locale={{ emptyText: "Chưa có dịch vụ — bấm “Tạo dịch vụ hàng loạt”" }}
    />
  );
};

export default ServiceMatrixTable;
