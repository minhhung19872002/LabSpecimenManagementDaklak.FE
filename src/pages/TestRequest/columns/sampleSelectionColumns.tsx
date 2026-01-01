import { Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { SampleForSelectionDto } from "../../../services/testRequestService";
import { formatDate } from "../../../utils/formatters";

export const getSampleSelectionColumns = (): ColumnsType<SampleForSelectionDto> => [
  {
    title: "Mã mẫu",
    dataIndex: "sampleCode",
    key: "sampleCode",
    width: 120,
  },
  {
    title: "Tên mẫu",
    dataIndex: "sampleName",
    key: "sampleName",
    width: 200,
  },
  {
    title: "Trạng thái XN",
    dataIndex: "testingStatus",
    key: "testingStatus",
    width: 150,
    render: (status: string, record: SampleForSelectionDto) => (
      <Tag color={record.canGenerateResult ? "success" : "default"}>
        {status}
      </Tag>
    ),
  },
  {
    title: "Ngày YC xong",
    dataIndex: "requestedCompletionDate",
    key: "requestedCompletionDate",
    width: 120,
    render: (date: string) => formatDate(date),
  },
];
