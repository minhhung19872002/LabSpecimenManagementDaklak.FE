import { Button, Space, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { SampleStorageDto } from "../../../types/sampleStorage";
import {
  SampleStorageStatus,
  SampleStorageStatusLabels,
  SampleStorageStatusColors,
} from "../../../types/sampleStorage";
import { formatDate } from "../../../utils/formatters";

interface GetColumnsOptions {
  onView: (record: SampleStorageDto) => void;
}

const getStatusTag = (status: SampleStorageStatus) => (
  <Tag color={SampleStorageStatusColors[status]}>
    {SampleStorageStatusLabels[status]}
  </Tag>
);

export const getSpecimenColumns = (
  options: GetColumnsOptions
): ColumnsType<SampleStorageDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 200,
    fixed: "left",
    sorter: (a, b) => a.contractNumber.localeCompare(b.contractNumber),
  },
  {
    title: "Tổng số mẫu",
    dataIndex: "totalSampleCount",
    key: "totalSampleCount",
    width: 120,
    align: "center",
    render: (count: number, record: SampleStorageDto) => {
      if (record.cancelledCount > 0) {
        return (
          <span>
            {count}{" "}
            <span style={{ color: "#999", fontSize: 12 }}>
              (đã hủy: {record.cancelledCount})
            </span>
          </span>
        );
      }
      return count;
    },
  },
  {
    title: "Ngày lưu kho",
    dataIndex: "storageDate",
    key: "storageDate",
    width: 150,
    render: (date: string | null) => formatDate(date),
    sorter: (a, b) => {
      if (!a.storageDate) return 1;
      if (!b.storageDate) return -1;
      return dayjs(a.storageDate).unix() - dayjs(b.storageDate).unix();
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status: SampleStorageStatus) => getStatusTag(status),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 100,
    fixed: "right",
    render: (_: unknown, record: SampleStorageDto) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => options.onView(record)}
        >
          Xem
        </Button>
      </Space>
    ),
  },
];
