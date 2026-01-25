import { Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { TestRequestSampleDto } from "../../../types/testRequest";
import SampleImagesButton from "../components/SampleImagesButton";
import StatusTag from "../../../components/common/StatusTag";
import IndicatorCollapsibleCell from "../components/IndicatorCollapsibleCell";

interface SampleColumnsProps {
  onViewImages: (sample: TestRequestSampleDto) => void;
}

export const getSampleColumns = ({
  onViewImages,
}: SampleColumnsProps): ColumnsType<TestRequestSampleDto> => [
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
    width: 150,
    render: (value: string, record: TestRequestSampleDto) => (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>{value}</span>
        {record.isSharedSample && (
          <StatusTag color="purple" style={{ fontSize: 10, minWidth: 55 }}>
            Mẫu chung
          </StatusTag>
        )}
        {record.isCustomerCancelled && (
          <StatusTag color="volcano" style={{ fontSize: 10, minWidth: 50 }}>
            KH hủy
          </StatusTag>
        )}
      </div>
    ),
  },
  {
    title: "Tên mẫu",
    dataIndex: "sampleName",
    key: "sampleName",
    width: 150,
  },
  {
    title: "Loại mẫu",
    dataIndex: "specimenTypeName",
    key: "specimenTypeName",
    width: 150,
    render: (value: string) => value || "-",
  },
  {
    title: "Hình ảnh",
    key: "images",
    width: 80,
    align: "center" as const,
    render: (_: unknown, record: TestRequestSampleDto) => (
      <SampleImagesButton
        sample={record}
        onClick={() => onViewImages(record)}
      />
    ),
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
    render: (value: string) => value || "-",
  },
  {
    title: "Trạng thái XL",
    dataIndex: "processingStatus",
    key: "processingStatus",
    width: 100,
    render: (value: string) => (value ? <Tag color="blue">{value}</Tag> : "-"),
  },
  {
    title: "Chỉ tiêu kiểm nghiệm",
    dataIndex: "indicators",
    key: "indicators",
    width: 350,
    render: (indicators: any[]) => {
      if (!indicators || indicators.length === 0) return "-";
      return <IndicatorCollapsibleCell indicators={indicators} />;
    },
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
];
