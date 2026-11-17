import React from "react";
import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IndicatorName } from "../../../../components/common";
import type { BatchNormMethodDto } from "../../../../services/serviceCatalogService";

export interface BatchNormMethodTableProps {
  methods: BatchNormMethodDto[];
  loading: boolean;
  expandedKeys: string[];
  onExpandedKeysChange: (keys: string[]) => void;
  renderNorms: (method: BatchNormMethodDto) => React.ReactNode;
}

const BatchNormMethodTable: React.FC<BatchNormMethodTableProps> = ({
  methods,
  loading,
  expandedKeys,
  onExpandedKeysChange,
  renderNorms,
}) => {
  const columns: ColumnsType<BatchNormMethodDto> = [
    { title: "Mã PP", dataIndex: "code", key: "code", width: 110 },
    {
      title: "Phương pháp",
      key: "name",
      render: (_, r) => (
        <span>
          <IndicatorName name={r.name} formattedName={r.formattedName ?? undefined} />
          {!r.isActive && (
            <Tag style={{ marginLeft: 8 }} color="default">
              Ngừng
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "Số vật tư",
      dataIndex: "normCount",
      key: "normCount",
      width: 100,
      align: "center",
    },
    {
      title: "Dùng cho",
      key: "serviceCount",
      width: 130,
      render: (_, r) => <Typography.Text type="secondary">{r.serviceCount} dịch vụ</Typography.Text>,
    },
    {
      title: "Khai báo",
      key: "status",
      width: 170,
      render: (_, r) =>
        r.hasCompleteNorm ? <Tag color="green">Đã khai báo</Tag> : <Tag color="orange">Chưa có định mức</Tag>,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={methods}
      rowKey="testMethodId"
      size="middle"
      loading={loading}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Tổng ${total} phương pháp` }}
      expandable={{
        expandedRowKeys: expandedKeys,
        onExpandedRowsChange: (keys) => onExpandedKeysChange(keys as string[]),
        expandRowByClick: true,
        expandedRowRender: renderNorms,
      }}
    />
  );
};

export default BatchNormMethodTable;
