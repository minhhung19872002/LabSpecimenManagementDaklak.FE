import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Row,
  Col,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { quotationService } from "../../services/quotationService";
import { QuotationListDto } from "../../types/quotation";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "../../utils/formatters";

const QuotationList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuotationListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await quotationService.getList({
        filter: searchInput || undefined,
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
      message.error("Không thể tải danh sách báo giá");
    } finally {
      setLoading(false);
    }
  }, [searchInput, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await quotationService.delete(id);
      message.success("Xóa báo giá thành công");
      fetchData();
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      message.error("Không thể xóa báo giá");
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const columns: ColumnsType<QuotationListDto> = [
    {
      title: "Số báo giá",
      dataIndex: "quotationNumber",
      key: "quotationNumber",
      width: 160,
      render: (text, record) => (
        <a onClick={() => navigate(PATH_ROUTES.quotations.edit(record.id))}>
          {text}
        </a>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      key: "creationTime",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tên CS/DN",
      dataIndex: "customerName",
      key: "customerName",
      ellipsis: true,
    },
    {
      title: "Số mẫu",
      dataIndex: "sampleCount",
      key: "sampleCount",
      width: 100,
      align: "center",
    },
    {
      title: "Số chỉ tiêu",
      dataIndex: "itemCount",
      key: "itemCount",
      width: 100,
      align: "center",
    },
    {
      title: "Tổng số tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 150,
      align: "right",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(PATH_ROUTES.quotations.edit(record.id))}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa báo giá"
            description="Bạn có chắc chắn muốn xóa báo giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách báo giá"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(PATH_ROUTES.quotations.create)}
          >
            Tạo mới
          </Button>
        </Space>
      }
    >
      {/* Search */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số báo giá, tên CS/DN..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
            enterButton
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} báo giá`,
          onChange: handlePageChange,
        }}
        scroll={{ x: 900 }}
      />
    </Card>
  );
};

export default QuotationList;
