// @ts-nocheck
import React from "react";
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Space,
  Table,
  Divider,
  Row,
  Col,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  TestRequestDto,
  TestRequestStatus,
  canEditTestRequest,
  canSendSample,
  canComplete,
  TestRequestSampleDto,
} from "../../../types/testRequest";
import dayjs from "dayjs";
import { PATH_ROUTES } from "../../../constants";
import { getSampleColumns } from "../columns";
import { ColumnsType } from "antd/es/table";
import {
  ContractInfoSection,
  CustomerInfoSection,
  SampleTypeSection,
  ResultRequirementsSection,
  SamplingDeliverySection,
  MethodRequirementsSection,
  CostInfoSection,
  PostalImagesSection,
  getStatusTag,
} from "./sections";

interface TestRequestDetailContainerProps {
  data: TestRequestDto;
  id: string;
  printingTestRequest: boolean;
  sendingSample: boolean;
  onPrintTestRequest: () => void;
  onSendSample: () => void;
  onSendResult: () => void;
  onComplete: () => void;
  onOpenProcessTimeline: () => void;
  onViewSampleImages: (sample: TestRequestSampleDto) => void;
}

const TestRequestDetailContainer: React.FC<TestRequestDetailContainerProps> = ({
  data,
  id,
  printingTestRequest,
  sendingSample,
  onPrintTestRequest,
  onSendSample,
  onSendResult,
  onComplete,
  onOpenProcessTimeline,
  onViewSampleImages,
}) => {
  const navigate = useNavigate();

  // Render action buttons based on status
  const renderActionButtons = () => {
    const buttons: React.ReactNode[] = [];

    // In phiếu XN - New hoặc Pending
    if (
      data.status === TestRequestStatus.New ||
      data.status === TestRequestStatus.Pending
    ) {
      buttons.push(
        <Button
          key="print"
          icon={<FileTextOutlined />}
          onClick={onPrintTestRequest}
          loading={printingTestRequest}
        >
          In phiếu XN
        </Button>
      );
    }

    // Gửi mẫu - chỉ khi Pending
    if (canSendSample(data.status)) {
      buttons.push(
        <Button
          key="send-sample"
          type="primary"
          onClick={onSendSample}
          loading={sendingSample}
        >
          Gửi mẫu
        </Button>
      );
    }

    // Approved - Gửi kết quả
    if (data.status === TestRequestStatus.Approved) {
      buttons.push(
        <Button key="send-result" type="primary" onClick={onSendResult}>
          Gửi kết quả
        </Button>
      );
    }

    // ResultSent - Hoàn thành
    if (canComplete(data.status)) {
      buttons.push(
        <Button key="complete" type="primary" onClick={onComplete}>
          Hoàn thành
        </Button>
      );
    }

    return buttons.length > 0 ? <Space wrap>{buttons}</Space> : null;
  };

  const sampleColumns: ColumnsType<TestRequestSampleDto> = getSampleColumns({
    onViewImages: onViewSampleImages,
  });

  return (
    <div className="test-request-detail">
      {/* Back button and Process Timeline */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(PATH_ROUTES.testRequests.index)}
        >
          Quay lại
        </Button>
        <Button icon={<HistoryOutlined />} onClick={onOpenProcessTimeline}>
          Xem tiến trình
        </Button>
      </div>

      <Card
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết yêu cầu thử nghiệm</span>
              <Tag color="blue">{data.requestNumber}</Tag>
              {getStatusTag(data.status)}
            </Space>
            <Space wrap>
              {renderActionButtons()}
              {canEditTestRequest(data.status) && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(PATH_ROUTES.testRequests.edit(id))}
                >
                  Chỉnh sửa
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {/* Thông báo khi có thay đổi đang chờ phê duyệt */}
        {data.status === TestRequestStatus.PendingChangeApproval && (
          <Alert
            message="Có thay đổi đang chờ phê duyệt"
            description="Dữ liệu hiển thị bên dưới là dữ liệu gốc trước khi thay đổi. Vui lòng vào trang 'Quản lý chất lượng' để phê duyệt hoặc từ chối các thay đổi."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Thông tin hợp đồng */}
        <ContractInfoSection data={data} />

        {/* Thông tin khách hàng */}
        <CustomerInfoSection data={data} />

        {/* Loại hình mẫu */}
        <SampleTypeSection data={data} />

        {/* Bảng mẫu */}
        <Divider orientation="left" style={{ marginTop: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>Thông tin mẫu</span>
            <Tag color="blue">
              {data.totalSampleCount || data.samples?.length || 0} mẫu
            </Tag>
          </Space>
        </Divider>

        <Table
          dataSource={(data.samples || []).filter((s) => !s.isCancelled)}
          columns={sampleColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1600 }}
          size="small"
          bordered
          style={{ marginBottom: 24 }}
          locale={{ emptyText: "Không có mẫu nào" }}
        />

        {/* Layout: Desktop 2 cols, Mobile responsive wrap */}
        <Row gutter={[24, 24]}>
          {/* Yêu cầu về kết quả */}
          <Col xs={{ span: 24, order: 1 }} lg={{ span: 12, order: 1 }}>
            <ResultRequirementsSection data={data} />
          </Col>

          {/* Yêu cầu về lấy mẫu & giao trả */}
          <Col xs={{ span: 24, order: 2 }} lg={{ span: 12, order: 2 }}>
            <SamplingDeliverySection data={data} />
          </Col>

          {/* Yêu cầu về phương pháp */}
          <Col xs={{ span: 24, order: 3 }} lg={{ span: 12, order: 3 }}>
            <MethodRequirementsSection data={data} />
          </Col>

          {/* Thông tin chi phí */}
          <Col xs={{ span: 24, order: 4 }} lg={{ span: 12, order: 4 }}>
            <CostInfoSection data={data} />
          </Col>
        </Row>

        {/* Hình ảnh gửi bưu điện */}
        <PostalImagesSection data={data} />

        {/* Thông tin hệ thống */}
        <Divider />
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="Ngày tạo">
            {data.creationTime
              ? dayjs(data.creationTime).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {data.lastModificationTime
              ? dayjs(data.lastModificationTime).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default TestRequestDetailContainer;
