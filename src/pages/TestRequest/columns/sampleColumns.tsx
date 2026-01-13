import { Tag, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import {
  TestRequestSampleDto,
  IndicatorImageDto,
} from "../../../types/testRequest";
import {
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../../types/laboratoryTask";
import { formatDate } from "../../../utils/formatters";
import SampleImagesButton from "../components/SampleImagesButton";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import StatusTag from "../../../components/common/StatusTag";
import { IndicatorName } from "../../../components/common";

const { Text } = Typography;

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

      // Group indicators by laboratory
      const unsentIndicators = indicators.filter((ind) => !ind.laboratoryId);
      const sentIndicators = indicators.filter((ind) => ind.laboratoryId);
      const groupedByLab: Record<
        string,
        { labName: string; indicators: any[] }
      > = {};

      sentIndicators.forEach((ind) => {
        const labId = ind.laboratoryId;
        if (!groupedByLab[labId]) {
          groupedByLab[labId] = {
            labName: ind.laboratoryName || "Khoa phòng",
            indicators: [],
          };
        }
        groupedByLab[labId].indicators.push(ind);
      });

      const renderIndicator = (ind: any, idx: number) => {
        // Get approval status info
        const hasApprovalStatus =
          ind.approvalStatus !== undefined && ind.approvalStatus !== null;
        const approvalStatusLabel = hasApprovalStatus
          ? IndicatorApprovalStatusLabels[
              ind.approvalStatus as IndicatorApprovalStatus
            ]
          : null;
        const approvalStatusColor = hasApprovalStatus
          ? IndicatorApprovalStatusColors[
              ind.approvalStatus as IndicatorApprovalStatus
            ]
          : null;

        // Get indicator images
        const indicatorImages: IndicatorImageDto[] = ind.images || [];

        return (
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
              <IndicatorName name={ind.indicatorName} formattedName={ind.indicatorFormattedName} style={{ fontSize: 11 }} />
              {ind.unitPrice > 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  ({ind.unitPrice?.toLocaleString("vi-VN")}đ)
                </Text>
              )}
              {/* Trạng thái duyệt */}
              {hasApprovalStatus && approvalStatusLabel && (
                <StatusTag
                  color={approvalStatusColor || "default"}
                  style={{ fontSize: 10, minWidth: 55 }}
                >
                  {approvalStatusLabel}
                </StatusTag>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
              {ind.requestDate && (
                <span>YC xong: {formatDate(ind.requestDate)}</span>
              )}
              {ind.requestDate && ind.testDate && (
                <span style={{ margin: "0 4px" }}>|</span>
              )}
              {ind.testDate && <span>Ngày TN: {formatDate(ind.testDate)}</span>}
            </div>
            {/* Hình ảnh của chỉ tiêu */}
            {indicatorImages.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <IndicatorImageCell
                  images={indicatorImages}
                  canUpload={false}
                  maxImages={5}
                />
              </div>
            )}
          </div>
        );
      };

      return (
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {/* Unsent indicators */}
          {unsentIndicators.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {unsentIndicators.map((ind, idx) => renderIndicator(ind, idx))}
            </div>
          )}

          {/* Grouped by laboratory */}
          {Object.entries(groupedByLab).map(
            ([labId, { labName, indicators: labIndicators }]) => (
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
            )
          )}
        </div>
      );
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
