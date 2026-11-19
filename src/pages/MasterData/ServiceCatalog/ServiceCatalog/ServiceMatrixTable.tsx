import React, { useMemo } from "react";
import { Button, Table, Tag, Typography } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { DownOutlined, RightOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import ServiceMatrixCell from "./ServiceMatrixCell";
import ServiceCellContextMenu, { type ServiceCellAction } from "./ServiceCellContextMenu";
import { isMatrixRowKey, MATRIX_PAGE_SIZE_OPTIONS, type ServiceMatrixRow, type SpecimenColumn } from "./utils";

export type { ServiceCellAction };

export interface ServiceMatrixTableProps {
  /** Danh sách PHẲNG đã chia trang (buildMatrixPageRows): dòng nhóm + dòng chỉ tiêu */
  rows: ServiceMatrixRow[];
  specimenColumns: SpecimenColumn[];
  loading: boolean;
  /** Chỉ chứa key dòng chỉ tiêu ("r:...") */
  selectedRowKeys: string[];
  pageSize: number;
  /** Chiều cao header app: tiêu đề cột dính ngay dưới, thanh cuộn ngang dính đáy màn hình */
  stickyOffset: number;
  editingServiceId: string | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSelectionChange: (keys: string[]) => void;
  onToggleGroup: (groupKey: string) => void;
  onPageSizeChange: (pageSize: number) => void;
  onCellDoubleClick: (service: ServiceCatalogItemDto) => void;
  onEmptyCellDoubleClick: (row: ServiceMatrixRow, column: SpecimenColumn) => void;
  onEditCommit: (service: ServiceCatalogItemDto, value: number | null) => void;
  onEditCancel: () => void;
  onCellAction: (action: ServiceCellAction, service: ServiceCatalogItemDto) => void;
}

const CELL_WIDTH = 160;
const NAME_WIDTH = 300;

// Ô nhóm trải hết các cột: bỏ sticky (position static) để không đè lên checkbox nhóm ở cột chọn cố định
const groupCellProps = (span: number) => ({ colSpan: span, style: { background: "#FAFAFA", position: "static" as const } });
const priceCellProps = { style: { padding: "6px 4px" } };
const hiddenCellProps = { colSpan: 0 };
// Tên nền mẫu dài (VD "Nhuyễn thể hai mảnh vỏ…") làm hàng tiêu đề cao ~250px → tối đa 3 dòng, hover xem đủ
const columnTitleStyle: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: "18px",
  fontSize: 13,
};
// Ô nhóm trải hết các cột (rất rộng) → tên nhóm dính bên trái khi cuộn ngang, không bị trôi mất
const groupLabelStyle: React.CSSProperties = {
  position: "sticky",
  left: 56,
  display: "flex",
  width: "max-content",
  alignItems: "center",
  gap: 8,
};

/** Ma trận giá: nhóm chỉ tiêu ▸ dòng Chỉ tiêu + Phương pháp, cột = Nền mẫu, ô = Giá */
const ServiceMatrixTable: React.FC<ServiceMatrixTableProps> = ({
  rows,
  specimenColumns,
  loading,
  selectedRowKeys,
  pageSize,
  stickyOffset,
  editingServiceId,
  canCreate,
  canEdit,
  canDelete,
  onSelectionChange,
  onToggleGroup,
  onPageSizeChange,
  onCellDoubleClick,
  onEmptyCellDoubleClick,
  onEditCommit,
  onEditCancel,
  onCellAction,
}) => {
  const groupHeaders = useMemo(() => rows.filter((r) => r.kind === "group"), [rows]);
  const groupCount = useMemo(() => groupHeaders.filter((g) => !g.continued).length, [groupHeaders]);

  const serviceById = useMemo(() => {
    const map = new Map<string, ServiceCatalogItemDto>();
    for (const r of rows) {
      if (r.kind !== "row") continue;
      for (const s of Object.values(r.cells)) map.set(s.id, s);
    }
    return map;
  }, [rows]);

  // Checkbox nhóm = chọn/bỏ cả nhóm (kể cả dòng ở trang khác / nhóm đang thu gọn), như bảng cây trước đây
  const { checkedKeys, checkedGroupKeys, halfGroupKeys } = useMemo(() => {
    const selected = new Set(selectedRowKeys);
    const checkedGroup = new Set<string>();
    const half = new Set<string>();
    for (const g of groupHeaders) {
      const keys = g.rowKeys ?? [];
      const count = keys.reduce((n, k) => (selected.has(k) ? n + 1 : n), 0);
      if (keys.length > 0 && count === keys.length) checkedGroup.add(g.key);
      else if (count > 0) half.add(g.key);
    }
    return { checkedKeys: [...selectedRowKeys, ...checkedGroup], checkedGroupKeys: checkedGroup, halfGroupKeys: half };
  }, [selectedRowKeys, groupHeaders]);

  const handleSelectionChange = (keys: React.Key[]) => {
    const nextKeys = new Set(keys.map(String));
    const result = new Set([...nextKeys].filter(isMatrixRowKey));
    for (const g of groupHeaders) {
      const was = checkedGroupKeys.has(g.key);
      const now = nextKeys.has(g.key);
      if (was === now) continue;
      for (const k of g.rowKeys ?? []) {
        if (now) result.add(k);
        else result.delete(k);
      }
    }
    onSelectionChange([...result]);
  };

  // Cột chỉ tạo lại khi đổi cột / quyền / ô đang sửa — chọn dòng, đổi trang không tạo lại
  const columns = useMemo<ColumnsType<ServiceMatrixRow>>(
    () => [
      {
        title: "Chỉ tiêu · Phương pháp",
        key: "name",
        width: NAME_WIDTH,
        fixed: "left",
        onCell: (r) => (r.kind === "group" ? groupCellProps(specimenColumns.length + 1) : {}),
        render: (_, r) =>
          r.kind === "group" ? (
            <span style={groupLabelStyle}>
              <Button
                type="text"
                size="small"
                aria-label={r.expanded ? "Thu gọn nhóm" : "Mở nhóm"}
                icon={r.expanded ? <DownOutlined /> : <RightOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleGroup(r.groupKey ?? r.key);
                }}
              />
              <span style={{ fontWeight: 600 }}>
                {r.groupName}
                {r.continued && <span style={{ fontWeight: 400, color: "#8c8c8c" }}> (tiếp)</span>}
              </span>
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
          title: (
            <span style={columnTitleStyle} title={col.name}>
              {col.name}
            </span>
          ),
          key: col.key,
          width: CELL_WIDTH,
          align: "right",
          onCell: (r) => (r.kind === "group" ? hiddenCellProps : priceCellProps),
          render: (_, r) => {
            if (r.kind === "group") return null;
            const service = r.cells[col.key];
            return (
              <ServiceMatrixCell
                row={r}
                column={col}
                service={service}
                isEditing={!!service && service.id === editingServiceId}
                canCreate={canCreate}
                canEdit={canEdit}
                onCellDoubleClick={onCellDoubleClick}
                onEmptyCellDoubleClick={onEmptyCellDoubleClick}
                onEditCommit={onEditCommit}
                onEditCancel={onEditCancel}
              />
            );
          },
        })
      ),
    ],
    [
      specimenColumns,
      editingServiceId,
      canCreate,
      canEdit,
      onToggleGroup,
      onCellDoubleClick,
      onEmptyCellDoubleClick,
      onEditCommit,
      onEditCancel,
    ]
  );

  // Ma trận rất rộng: thanh cuộn ngang mặc định nằm cuối bảng (khuất dưới màn hình) → cho dính đáy màn hình
  const sticky = useMemo(() => ({ offsetHeader: stickyOffset }), [stickyOffset]);

  const rowSelection: TableProps<ServiceMatrixRow>["rowSelection"] = {
    selectedRowKeys: checkedKeys,
    columnWidth: 48,
    fixed: true,
    // Giữ lựa chọn của dòng trong nhóm đang thu gọn (không có trong dataSource)
    preserveSelectedRowKeys: true,
    getCheckboxProps: (r) => (r.kind === "group" ? { indeterminate: halfGroupKeys.has(r.key) } : {}),
    onChange: handleSelectionChange,
  };

  return (
    <ServiceCellContextMenu
      serviceById={serviceById}
      canEdit={canEdit}
      canDelete={canDelete}
      onCellAction={onCellAction}
    >
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        size="small"
        loading={loading}
        scroll={{ x: NAME_WIDTH + 48 + specimenColumns.length * CELL_WIDTH }}
        rowSelection={rowSelection}
        sticky={sticky}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: MATRIX_PAGE_SIZE_OPTIONS,
          onChange: (_, size) => {
            if (size !== pageSize) onPageSizeChange(size);
          },
          showTotal: () => (
            <>
              Tổng <b>{groupCount}</b> nhóm
            </>
          ),
        }}
        locale={{ emptyText: "Không có dịch vụ phù hợp bộ lọc." }}
      />
    </ServiceCellContextMenu>
  );
};

export default ServiceMatrixTable;
