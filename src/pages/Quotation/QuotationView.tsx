import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  message,
  Spin,
  Descriptions,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  FileAddOutlined,
  EditOutlined,
} from "../../components/common/Icon";
import { useNavigate, useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { quotationService } from "../../services/quotationService";
import { QuotationDto, QuotationItemDto } from "../../types/quotation";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "../../utils/formatters";

const { Text } = Typography;

const QuotationView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<QuotationDto | null>(null);

  useEffect(() => {
    if (id) {
      loadQuotation(id);
    }
  }, [id]);

  const loadQuotation = async (quotationId: string) => {
    setLoading(true);
    try {
      const data = await quotationService.get(quotationId);
      setQuotation(data);
    } catch (error) {
      console.error("Failed to load quotation:", error);
      message.error("Không thể tải thông tin báo giá");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestRequest = () => {
    if (id) {
      navigate(`${PATH_ROUTES.testRequests.create}?quotationId=${id}`);
    }
  };

  const columns: ColumnsType<QuotationItemDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
    },
    {
      title: "Phương pháp",
      dataIndex: "testMethodName",
      key: "testMethodName",
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
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 130,
      align: "right",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
  ];

  if (!quotation && !loading) {
    return (
      <Card>
        <Text>Không tìm thấy báo giá</Text>
      </Card>
    );
  }

  // Section title style
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #f0f0f0',
  };

  return (
    <Spin spinning={loading}>
      <Card
        title="Chi tiết báo giá"
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.quotations.index)}
            >
              Quay lại
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(PATH_ROUTES.quotations.edit(id!))}
            >
              Chỉnh sửa
            </Button>
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleCreateTestRequest}
            >
              Tạo phiếu thử nghiệm
            </Button>
          </Space>
        }
      >
        {quotation && (
          <>
            {/* Section 1: Thông tin báo giá */}
            <div style={sectionTitleStyle}>Thông tin báo giá</div>
            <Descriptions
              bordered
              size="small"
              column={1}
              labelStyle={{ width: 150, fontWeight: 500, background: '#fafafa' }}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Số báo giá">
                <Text strong style={{ color: '#1890ff' }}>{quotation.quotationNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(quotation.quotationDate).format("DD/MM/YYYY")}
              </Descriptions.Item>
            </Descriptions>

            {/* Section 2: Thông tin khách hàng */}
            <div style={sectionTitleStyle}>Thông tin khách hàng</div>
            <Row gutter={[24, 12]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 13 }}>Tên CS/DN:</Text>
                <div style={{ marginTop: 4 }}>{quotation.customerName || "-"}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 13 }}>Người đại diện:</Text>
                <div style={{ marginTop: 4 }}>{quotation.contactPerson || "-"}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 13 }}>Mã số thuế:</Text>
                <div style={{ marginTop: 4 }}>{quotation.taxCode || "-"}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 13 }}>Số điện thoại:</Text>
                <div style={{ marginTop: 4 }}>{quotation.phone || "-"}</div>
              </Col>
              <Col xs={24}>
                <Text type="secondary" style={{ fontSize: 13 }}>Địa chỉ:</Text>
                <div style={{ marginTop: 4 }}>{quotation.address || "-"}</div>
              </Col>
            </Row>

            {/* Section 3: Danh sách chỉ tiêu */}
            <div style={sectionTitleStyle}>Danh sách chỉ tiêu ({quotation.items?.length || 0} chỉ tiêu)</div>
            <Table
              columns={columns}
              dataSource={quotation.items}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              style={{ marginBottom: 16 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <Text strong>TỔNG CỘNG</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 15, color: '#1890ff' }}>
                        {formatCurrency(quotation.totalCost)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            {/* Section 4: Ghi chú (nếu có) */}
            {quotation.notes && (
              <>
                <div style={sectionTitleStyle}>Ghi chú</div>
                <div style={{
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                }}>
                  {quotation.notes}
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </Spin>
  );
};

export default QuotationView;
