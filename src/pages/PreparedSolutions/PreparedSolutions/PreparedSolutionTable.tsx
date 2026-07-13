import React from "react";
import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  PreparedSolutionBatchDto,
  PreparedSolutionIngredientDto,
  PreparedSolutionStatus,
} from "../../../services/preparedSolutionService";
import { STATUS_COLOR, STATUS_LABEL, formatDate, formatVolume } from "./utils";

export interface PreparedSolutionTableProps {
  items: PreparedSolutionBatchDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (item: PreparedSolutionBatchDto) => void;
  onProcess: (item: PreparedSolutionBatchDto) => void;
}

// Row background: đỏ nhạt cho Sắp hết hạn + Hết hạn, xanh nhạt cho Hết
const ROW_BG: Partial<Record<PreparedSolutionStatus, string>> = {
  [PreparedSolutionStatus.NearingExpiry]: "#fff1f0",
  [PreparedSolutionStatus.Expired]: "#fff1f0",
  [PreparedSolutionStatus.Empty]: "#e6f4ff",
};

const canEdit = (row: PreparedSolutionBatchDto): boolean =>
  !row.isProcessed &&
  row.computedStatus !== PreparedSolutionStatus.Expired &&
  row.computedStatus !== PreparedSolutionStatus.Empty;

const DaysRemainingText: React.FC<{ row: PreparedSolutionBatchDto }> = ({ row }) => {
  if (!row.expiryDate) return null;
  const { daysRemaining } = row;
  if (daysRemaining < 0) {
    return (
      <Typography.Text type="danger" style={{ fontSize: 11 }}>
        quá {Math.abs(daysRemaining)} ngày
      </Typography.Text>
    );
  }
  if (daysRemaining === 0) {
    return (
      <Typography.Text type="warning" style={{ fontSize: 11 }}>
        hôm nay
      </Typography.Text>
    );
  }
  const textType = daysRemaining < 14 ? "warning" : "secondary";
  return (
    <Typography.Text type={textType} style={{ fontSize: 11 }}>
      còn {daysRemaining} ngày
    </Typography.Text>
  );
};

const IngredientExpandRow: React.FC<{ ingredients: PreparedSolutionIngredientDto[] }> = ({
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

const PreparedSolutionTable: React.FC<PreparedSolutionTableProps> = ({
  items,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  onEdit,
  onProcess,
}) => {
  const columns: ColumnsType<PreparedSolutionBatchDto> = [
    {
      title: "Mã lô (Code / Lot)",
      key: "lotCode",
      width: 160,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {row.lotCode}
          </Typography.Text>
          {row.identificationCode && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.identificationCode}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Tên dung dịch pha",
      key: "name",
      width: 200,
      ellipsis: true,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Tooltip title={row.solutionProductName}>
          <Typography.Text ellipsis>{row.solutionProductName}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: "Còn lại",
      key: "remaining",
      width: 160,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space size={4}>
          <Typography.Text>{formatVolume(row.remainingVolume)}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            / {formatVolume(row.totalVolume, row.volumeUnitName ?? undefined)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Hạn dùng",
      key: "expiryDate",
      width: 120,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{formatDate(row.expiryDate)}</Typography.Text>
          <DaysRemainingText row={row} />
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "computedStatus",
      key: "status",
      width: 130,
      render: (status: PreparedSolutionStatus) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "storageWarehouseName",
      key: "location",
      width: 140,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Người pha",
      dataIndex: "preparedByName",
      key: "preparedBy",
      width: 130,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "",
      key: "actions",
      width: 88,
      fixed: "right" as const,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space size={4}>
          {canEdit(row) && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(row)}
                style={{ color: "#1677ff" }}
              />
            </Tooltip>
          )}
          {!row.isProcessed && (
            <Tooltip title="Xác nhận đã xử lý">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onProcess(row)}
                style={{ color: "#52c41a" }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={items}
      loading={loading}
      size="small"
      scroll={{ x: "max-content" }}
      onRow={(row: PreparedSolutionBatchDto) => ({
        style: { backgroundColor: ROW_BG[row.computedStatus] },
      })}
      expandable={{
        expandedRowRender: (row: PreparedSolutionBatchDto) => (
          <IngredientExpandRow ingredients={row.ingredients} />
        ),
        rowExpandable: (row: PreparedSolutionBatchDto) => row.ingredients.length > 0,
      }}
      pagination={{
        current: page,
        pageSize,
        total: totalCount,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: (total, range) => (
          <>
            Hiển thị <b>{range[0]}–{range[1]}</b> / {total}
          </>
        ),
        onChange: onPageChange,
      }}
    />
  );
};

export default PreparedSolutionTable;
