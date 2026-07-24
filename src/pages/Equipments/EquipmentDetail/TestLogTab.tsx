import React, { useState, useEffect, useCallback } from "react";
import { Table, Space, DatePicker, Flex, Segmented, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import {
  equipmentService,
  EquipmentTestLogItemDto,
  GetEquipmentTestLogParams,
} from "../../../services/equipmentService";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type QuickFilter = "7d" | "30d" | "all";


function buildDateRange(filter: QuickFilter): [Dayjs, Dayjs] | null {
  if (filter === "7d") return [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
  if (filter === "30d") return [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
  return null;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export interface TestLogTabProps {
  equipmentId: string;
}

const TestLogTab: React.FC<TestLogTabProps> = ({ equipmentId }) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("7d");
  const [rangeValue, setRangeValue] = useState<[Dayjs, Dayjs] | null>(
    () => buildDateRange("7d")
  );
  const [items, setItems] = useState<EquipmentTestLogItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    (range: [Dayjs, Dayjs] | null, currentPage: number, currentPageSize: number) => {
      const params: GetEquipmentTestLogParams = {
        skipCount: (currentPage - 1) * currentPageSize,
        maxResultCount: currentPageSize,
      };
      if (range) {
        params.dateFrom = range[0].toISOString();
        params.dateTo = range[1].toISOString();
      }
      setLoading(true);
      equipmentService
        .getTestLog(equipmentId, params)
        .then((result) => {
          setItems(result.items);
          setTotalCount(result.totalCount);
        })
        .catch(() => { setItems([]); setTotalCount(0); })
        .finally(() => setLoading(false));
    },
    [equipmentId]
  );

  useEffect(() => {
    load(rangeValue, page, pageSize);
  }, [load, rangeValue, page, pageSize]);

  const handleQuickFilter = (value: string | number) => {
    const v = value as QuickFilter;
    setQuickFilter(v);
    setPage(1);
    setRangeValue(buildDateRange(v));
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setPage(1);
    if (dates && dates[0] && dates[1]) {
      setRangeValue([dates[0].startOf("day"), dates[1].endOf("day")]);
      setQuickFilter("all");
    } else {
      setRangeValue(null);
      setQuickFilter("all");
    }
  };

  const columns: ColumnsType<EquipmentTestLogItemDto> = [
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      width: 120,
      render: (v) => v || "—",
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Phương pháp thử",
      dataIndex: "testMethodName",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Người thực hiện",
      dataIndex: "technicianName",
      width: 160,
      render: (v) => v || "—",
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      width: 180,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Thời gian",
      dataIndex: "testTime",
      width: 150,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY - HH:mm") : "—"),
    },
  ];

  const rangePickerValue: [Dayjs, Dayjs] | undefined = rangeValue
    ? [rangeValue[0], rangeValue[1]]
    : undefined;

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 15 }}>
          Nhật ký phép thử
        </Text>
        <Space>
          <Segmented
            value={quickFilter}
            onChange={handleQuickFilter}
            options={[
              { label: "7 Ngày", value: "7d" },
              { label: "30 Ngày", value: "30d" },
              { label: "Tất cả", value: "all" },
            ]}
          />
          <RangePicker
            value={rangePickerValue}
            onChange={handleRangeChange}
            format="DD/MM/YYYY"
            allowClear
            placeholder={["Từ ngày", "Đến ngày"]}
          />
        </Space>
      </Flex>
      <Table
        size="small"
        rowKey={(r, i) => `${r.sampleCode}-${r.indicatorName}-${i}`}
        dataSource={items}
        columns={columns}
        loading={loading}
        locale={{ emptyText: "Không có dữ liệu nhật ký phép thử" }}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default TestLogTab;
