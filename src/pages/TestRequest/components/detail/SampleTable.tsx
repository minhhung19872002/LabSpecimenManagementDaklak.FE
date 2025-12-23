import React, { useMemo } from "react";
import { Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { SampleStatus } from "../../../../types/testRequest";
import { SAMPLE_STATUS_CONFIG } from "../../constants";

const { Text } = Typography;

interface SampleTableProps {
  samples: any[];
}

const SampleTable: React.FC<SampleTableProps> = ({ samples }) => {
  const getSampleStatusTag = (status: SampleStatus) => {
    const config = SAMPLE_STATUS_CONFIG[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderIndicatorCell = (indicators: any[] | undefined) => {
    if (!indicators || indicators.length === 0) return "-";

    // Group indicators by laboratory
    const unsentIndicators = indicators.filter((ind) => !ind.laboratoryId);
    const sentIndicators = indicators.filter((ind) => ind.laboratoryId);
    const groupedByLab: Record<string, { labName: string; indicators: any[] }> = {};

    sentIndicators.forEach((ind) => {
      const labId = ind.laboratoryId!;
      if (!groupedByLab[labId]) {
        groupedByLab[labId] = {
          labName: ind.laboratoryName || "Khoa phòng",
          indicators: [],
        };
      }
      groupedByLab[labId].indicators.push(ind);
    });

    const renderIndicator = (ind: any, idx: number) => (
      <div
        key={idx}
        style={{
          marginBottom: 4,
          padding: "4px 8px",
          background: "#f5f5f5",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
            {ind.indicatorCode || ind.indicatorName}
          </Tag>
          <Text style={{ fontSize: 11 }}>{ind.indicatorName}</Text>
          {ind.unitPrice > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ({ind.unitPrice?.toLocaleString("vi-VN")}đ)
            </Text>
          )}
        </div>
        {ind.requestDate && (
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            YC xong: {dayjs(ind.requestDate).format("DD/MM/YYYY")}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {/* Unsent indicators */}
        {unsentIndicators.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {unsentIndicators.map((ind, idx) => renderIndicator(ind, idx))}
          </div>
        )}

        {/* Grouped by laboratory */}
        {Object.entries(groupedByLab).map(([labId, { labName, indicators: labIndicators }]) => (
          <div key={labId} style={{ marginBottom: 8 }}>
            <div
              style={{
                padding: "4px 8px",
                fontWeight: 600,
                fontSize: 12,
                color: "#000",
                background: "#e6e6e6",
                borderRadius: 4,
                marginBottom: 4,
              }}
            >
              {labName} ({labIndicators.length})
            </div>
            <div style={{ paddingLeft: 8 }}>
              {labIndicators.map((ind, idx) => renderIndicator(ind, idx))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const columns = useMemo(() => [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 50,
      align: "center" as const,
    },
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 100,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 150,
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: 180,
      render: (value: string) => value || "-",
    },
    {
      title: "Lượng mẫu",
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 80,
      render: (value: string) => value || "-",
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: 120,
      render: (value: string, record: any) =>
        value || getSampleStatusTag(record.status),
    },
    {
      title: "Trạng thái XL",
      dataIndex: "processingStatus",
      key: "processingStatus",
      width: 100,
      render: (value: string) =>
        value ? <Tag color="blue">{value}</Tag> : "-",
    },
    {
      title: "Chỉ tiêu kiểm nghiệm",
      dataIndex: "indicators",
      key: "indicators",
      width: 350,
      render: renderIndicatorCell,
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 120,
      ellipsis: true,
      render: (value: string) => value || "-",
    },
    {
      title: "Chi phí",
      dataIndex: "totalIndicatorCost",
      key: "totalIndicatorCost",
      width: 100,
      align: "right" as const,
      render: (value: number) =>
        value > 0 ? `${value.toLocaleString("vi-VN")}đ` : "-",
    },
  ], []);

  return (
    <Table
      dataSource={samples}
      columns={columns}
      rowKey="id"
      pagination={false}
      scroll={{ x: 1600 }}
      size="small"
      bordered
      style={{ marginBottom: 24 }}
      locale={{ emptyText: "Không có mẫu nào" }}
    />
  );
};

export default SampleTable;
