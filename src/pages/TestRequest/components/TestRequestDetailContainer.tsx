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
  canSendToQLKT,
  canCancelRequest,
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
  sendingToQLKT: boolean;
  cancellingRequest: boolean;
  confirmingDelivery?: boolean;
  onPrintTestRequest: () => void;
  onSendSample: () => void;
  onSendResult: () => void;
  onComplete: () => void;
  onOpenProcessTimeline: () => void;
  onViewSampleImages: (sample: TestRequestSampleDto) => void;
  onPrintSingle: () => void;
  onPrintMixed: () => void;
  onSendToAccounting: () => void;
  onSendToQLKT: () => void;
  onCancelRequest: () => void;
  onOpenCustomerConfirmation: () => void;
  onConfirmDelivery?: () => void;
  canPrint: boolean;
  canPrintTestRequest: boolean;
  // Permission flags theo Permission Matrix
  canEditRequest: boolean;
  canSendSampleAction: boolean;
  canCancelAction: boolean;
  canSendToAccountingAction: boolean;
}

const TestRequestDetailContainer: React.FC<TestRequestDetailContainerProps> = ({
  data,
  id,
  printingTestRequest,
  sendingSample,
  sendingToAccounting,
  sendingToQLKT,
  cancellingRequest,
  confirmingDelivery,
  onPrintTestRequest,
  onSendSample,
  onSendResult,
  onComplete,
  onOpenProcessTimeline,
  onViewSampleImages,
  onPrintSingle,
  onPrintMixed,
  onSendToAccounting,
  onSendToQLKT,
  onCancelRequest,
  onOpenCustomerConfirmation,
  onConfirmDelivery,
  canPrint,
  canPrintTestRequest,
  // Permission flags
  canEditRequest,
  canSendSampleAction,
  canCancelAction,
  canSendToAccountingAction,
}) => {
  const navigate = useNavigate();

  // Render action buttons based on status
  // Thứ tự ưu tiên: Primary actions > In phiếu > In KQ > Hủy yêu cầu (danger cuối cùng)
  const renderActionButtons = () => {
    const buttons: React.ReactNode[] = [];

    // Nếu đã bị hủy thì không hiện action buttons
    if (isCancelledRequest(data.status)) {
      return null;
    }

    // === 1. PRIMARY ACTIONS (ưu tiên cao nhất) ===

    // Gửi kế toán - chỉ khi status = PendingPayment VÀ có quyền sendToAccounting
    if (canSendToAccounting(data.status) && canSendToAccountingAction) {
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

    // Gửi QLKT - khi status = Paid VÀ có quyền sendToAccounting (BPGN)
    if (canSendToQLKT(data.status) && canSendToAccountingAction) {
      buttons.push(
        <Button
          key="send-to-qlkt"
          type="primary"
          onClick={onSendToQLKT}
          loading={sendingToQLKT}
        >
          Gửi QLKT
        </Button>
      );
    }

    // Xác nhận KH - khi status = WaitingCustomerConfirm VÀ có quyền sendToAccounting (BPGN)
    if (data.status === TestRequestStatus.WaitingCustomerConfirm && canSendToAccountingAction) {
      buttons.push(
        <Button
          key="confirm-customer"
          type="primary"
          onClick={onOpenCustomerConfirmation}
        >
          Xác nhận KH
        </Button>
      );
    }

    // Gửi mẫu - ẨN (đã thay thế bằng Gửi QLKT)
    // if (canSendSample(data.status) && canSendSampleAction) {
    //   buttons.push(
    //     <Button
    //       key="send-sample"
    //       type="primary"
    //       onClick={onSendSample}
    //       loading={sendingSample}
    //     >
    //       Gửi mẫu
    //     </Button>
    //   );
    // }

    // Gửi kết quả - khi status = Approved
    if (data.status === TestRequestStatus.Approved) {
      buttons.push(
        <Button key="send-result" type="primary" onClick={onSendResult}>
          Gửi kết quả
        </Button>
      );
    }

    // Hoàn thành - khi status = ResultSent
    if (canComplete(data.status)) {
      buttons.push(
        <Button key="complete" type="primary" onClick={onComplete}>
          Hoàn thành
        </Button>
      );
    }

    // Xác nhận bàn giao KH - BPGN xác nhận khi status = ReportPublished hoặc PartialResultSent
    if (
      (data.status === TestRequestStatus.ReportPublished ||
        data.status === TestRequestStatus.PartialResultSent) &&
      onConfirmDelivery
    ) {
      buttons.push(
        <Button
          key="confirm-delivery"
          type="primary"
          onClick={onConfirmDelivery}
          loading={confirmingDelivery}
        >
          Xác nhận bàn giao KH
        </Button>
      );
    }

    // === 2. IN PHIẾU XN (ưu tiên trung bình) ===

    // In phiếu XN - chỉ admin hoặc SampleReceiver mới thấy
    if (canPrintTestRequest) {
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

    // === 3. IN KẾT QUẢ (ưu tiên thấp hơn) ===

    // In KQ và In KQ hỗn hợp - hiển thị từ trạng thái PendingApproval trở đi
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

    // === 4. HỦY YÊU CẦU (danger - cuối cùng) ===

    // Hủy yêu cầu - hiển thị ở tất cả status trừ Completed, ResultSent và Cancelled VÀ có quyền cancel
    if (canCancelRequest(data.status) && canCancelAction) {
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
              {canEditTestRequest(data.status) && !isCancelledRequest(data.status) && canEditRequest && (
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
