import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Table, Tag, Spin } from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import {
  goodsReceiptService,
  GoodsReceiptListDto,
  WarehouseStatusLabels,
  WarehouseStatusColors,
  OrderStatusLabels,
  OrderStatusColors,
  PaymentStatusLabels,
  PaymentStatusColors,
} from "../../services/goodsReceiptService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { message } from "antd";
import "../../styles/ListCard.css";

const ProductSourceReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const { productId, supplierId } = useParams<{
    productId: string;
    supplierId: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GoodsReceiptListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchData = useCallback(async () => {
    if (!productId || !supplierId) return;
    setLoading(true);
    try {
      const result = await goodsReceiptService.getList({
        productId,
        supplierId,
        page,
        limit: pageSize,
        sorting: "CreationTime desc",
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [productId, supplierId, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<GoodsReceiptListDto> = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "ID đặt hàng",
      dataIndex: "code",
      key: "code",
      width: 180,
    },
    {
      title: "Tên nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 200,
    },
    {
      title: "Trạng thái kho",
      dataIndex: "warehouseStatus",
      key: "warehouseStatus",
      width: 140,
      render: (v: number) => (
        <Tag color={WarehouseStatusColors[v]}>{WarehouseStatusLabels[v]}</Tag>
      ),
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 130,
      render: (v: number) => (
        <Tag color={OrderStatusColors[v]}>{OrderStatusLabels[v]}</Tag>
      ),
    },
    {
      title: "Trạng thái thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 180,
      render: (v: number) => (
        <Tag color={PaymentStatusColors[v]}>{PaymentStatusLabels[v]}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 60,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/goods-receipts/${record.id}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "0 12px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/products/${productId}/sources`)}
          type="link"
          style={{ paddingLeft: 0 }}
        >
          Quay lại nguồn gốc nhập hàng
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <span>
            Quản lý phiếu nhập hàng <b>theo sản phẩm</b>
          </span>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            scroll={{ x: 1000 }}
            rowSelection={{
              selectedRowKeys: [],
              onChange: () => {},
            }}
            onRow={(record) => ({
              onDoubleClick: () => navigate(`/goods-receipts/${record.id}`),
              style: { cursor: "pointer" },
            })}
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

export default ProductSourceReceiptList;
