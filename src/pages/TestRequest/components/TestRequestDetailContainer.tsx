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
  PrinterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  TestRequestDto,
  TestRequestStatus,
  canEditTestRequest,
  canSendSample,
  canComplete,
  TestRequestSampleDto,
  canSendToAccounting,
  canCancelPaymentRequest,
  isCancelledRequest,
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
  sendingToAccounting: boolean;
  cancellingRequest: boolean;
  onPrintTestRequest: () => void;
  onSendSample: () => void;
  onSendResult: () => void;
  onComplete: () => void;
  onOpenProcessTimeline: () => void;
  onViewSampleImages: (sample: TestRequestSampleDto) => void;
  onPrintSingle: () => void;
  onPrintMixed: () => void;
  onSendToAccounting: () => void;
  onCancelRequest: () => void;
  canPrint: boolean;
}

const TestRequestDetailContainer: React.FC<TestRequestDetailContainerProps> = ({
  data,
  id,
  printingTestRequest,
  sendingSample,
  sendingToAccounting,
  cancellingRequest,
  onPrintTestRequest,
  onSendSample,
  onSendResult,
  onComplete,
  onOpenProcessTimeline,
  onViewSampleImages,
  onPrintSingle,
  onPrintMixed,
  onSendToAccounting,
  onCancelRequest,
  canPrint,
}) => {
  const navigate = useNavigate();

  // Render action buttons based on status
  const renderActionButtons = () => {
    const buttons: React.ReactNode[] = [];

    // Nếu đã bị hủy thì không hiện action buttons
    if (isCancelledRequest(data.status)) {
      return null;
    }

    // === PAYMENT FLOW ===

    // Gửi kế toán - chỉ khi status = New
    if (canSendToAccounting(data.status)) {
      buttons.push(
        <Button
          key="send-to-accounting"
          type="primary"
          onClick={onSendToAccounting}
          loading={sendingToAccounting}
        >
          Gửi kế toán
        </Button>
      );
    }

    // Hủy yêu cầu - xuất hiện khi status = New hoặc PendingPayment
    if (canCancelPaymentRequest(data.status)) {
      buttons.push(
        <Button
          key="cancel-request"
          danger
          onClick={onCancelRequest}
          loading={cancellingRequest}
        >
          Hủy yêu cầu
        </Button>
      );
    }

    // === AFTER PAYMENT ===

    // In phiếu XN - khi status = Paid
    if (data.status === TestRequestStatus.Paid) {
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

    // Gửi mẫu - khi status = Paid
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

    // === RESULT FLOW ===

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

    // In KQ và In KQ hỗn hợp - hiển thị khi có thể in (có chỉ tiêu đã duyệt)
    // Hiển thị từ trạng thái PendingApproval trở đi
    if (
      data.status === TestRequestStatus.PendingApproval ||
      data.status === TestRequestStatus.Approved ||
      data.status === TestRequestStatus.ResultSent ||
      data.status === TestRequestStatus.Completed
    ) {
      buttons.push(
        <Button
          key="print-single"
          icon={<PrinterOutlined />}
          onClick={onPrintSingle}
          disabled={!canPrint}
        >
          In KQ
        </Button>
      );
      buttons.push(
        <Button
          key="print-mixed"
          icon={<PrinterOutlined />}
          onClick={onPrintMixed}
          disabled={!canPrint}
        >
          In KQ Hỗn hợp
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
              {canEditTestRequest(data.status) && !isCancelledRequest(data.status) && (
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
