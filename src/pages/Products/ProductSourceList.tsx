import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Table, Input, Spin, Row, Col } from "antd";
import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import {
  productService,
  ProductSourceDto,
} from "../../services/productService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PATH_ROUTES } from "../../constants/routes";
import { message } from "antd";
import "../../styles/ListCard.css";

const formatCurrency = (value?: number) => {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + " VNĐ";
};

const ProductSourceList: React.FC = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductSourceDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const result = await productService.getProductSources(productId, {
        page,
        limit: pageSize,
        search: searchText || undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [productId, page, pageSize, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearchText(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  const columns: ColumnsType<ProductSourceDto> = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "ID NCC",
      dataIndex: "supplierCode",
      key: "supplierCode",
      width: 180,
    },
    {
      title: "Tên vật phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Tên NCC",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 200,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unitName",
      key: "unitName",
      width: 100,
    },
    {
      title: "SL đã nhập",
      dataIndex: "totalImported",
      key: "totalImported",
      width: 120,
      align: "right",
      render: (v: number) => v?.toLocaleString("vi-VN") ?? "-",
    },
    {
      title: "SL khả dụng",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      width: 120,
      align: "right",
      render: (v: number) => v?.toLocaleString("vi-VN") ?? "-",
    },
    {
      title: "Giá nhập mới nhất",
      dataIndex: "latestUnitPrice",
      key: "latestUnitPrice",
      width: 170,
      align: "right",
      render: (v: number) => formatCurrency(v),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "0 12px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(PATH_ROUTES.products.index)}
          type="link"
          style={{ paddingLeft: 0 }}
        >
          Nguồn gốc nhập hàng của sản phẩm
        </Button>
      </div>

      <Card className="list-card" title="Nguồn gốc nhập hàng của sản phẩm">
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: 16, padding: "16px 16px 0" }}
          align="middle"
        >
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo ID hoặc tên NCC..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="supplierId"
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize,
              total: totalCount,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 150],
              showTotal: (total, range) => (
                <>
                  Hiển thị{" "}
                  <b>
                    {range[0]}-{range[1]}/{total}
                  </b>
                </>
              ),
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ProductSourceList;
