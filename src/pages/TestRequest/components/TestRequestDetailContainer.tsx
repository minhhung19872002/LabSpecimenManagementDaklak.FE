// @ts-nocheck
import React from "react";
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Space,
  Table,
  Alert,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PrinterOutlined,
  CloudOutlined,
} from "../../../components/common/Icon";
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
import "../../../styles/ListCard.css";

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
  onViewCostHistory?: () => void;
  onOpenPaymentConfirmation?: () => void;
  canPrint: boolean;
  canPrintTestRequest: boolean;
  // Permission flags theo Permission Matrix
  canEditRequest: boolean;
  canSendSampleAction: boolean;
  canCancelAction: boolean;
  canSendToAccountingAction: boolean;
  // Offline support
  isOnline?: boolean;
  isOfflineData?: boolean;
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
  onViewCostHistory,
  onOpenPaymentConfirmation,
  canPrint,
  canPrintTestRequest,
  // Permission flags
  canEditRequest,
  canSendSampleAction,
  canCancelAction,
  canSendToAccountingAction,
  // Offline support
  isOnline = true,
  isOfflineData = false,
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

    // [COMMENTED] Gửi kế toán - Đã thay bằng "Xác nhận thanh toán" với modal thanh toán từng phần
    // if (
    //   canSendToAccounting(data.status, data.sentToAccounting) &&
    //   canSendToAccountingAction
    // ) {
    //   buttons.push(
    //     <Button
    //       key="send-to-accounting"
    //       type="primary"
    //       onClick={onSendToAccounting}
    //       loading={sendingToAccounting}
    //     >
    //       Gửi kế toán
    //     </Button>
    //   );
    // }

    // Xác nhận thanh toán / Lịch sử thanh toán
    // - Hiển thị "Xác nhận thanh toán" khi chưa thanh toán đủ
    // - Hiển thị "Lịch sử thanh toán" khi đã thanh toán đủ (paymentReceived = true)
    // - Ẩn khi status = Cancelled hoặc NoPaymentRequired
    // - Sử dụng paymentReceived thay vì status vì status có thể đã chuyển sang trạng thái khác sau thanh toán
    const isPaid = data.paymentReceived === true;
    const canShowPaymentButton =
      data.status !== TestRequestStatus.Cancelled &&
      data.status !== TestRequestStatus.NoPaymentRequired &&
      canSendToAccountingAction &&
      onOpenPaymentConfirmation;

    if (canShowPaymentButton) {
      const paymentButton = (
        <Button
          key="payment-confirmation"
          type={isPaid ? "default" : "primary"}
          onClick={onOpenPaymentConfirmation}
          disabled={!isOnline && !isPaid}
        >
          {isPaid ? "Lịch sử thanh toán" : "Xác nhận thanh toán"}
        </Button>
      );
      buttons.push(
        !isOnline && !isPaid ? (
          <Tooltip
            key="payment-confirmation-tooltip"
            title="Không khả dụng khi offline"
          >
            {paymentButton}
          </Tooltip>
        ) : (
          paymentButton
        ),
      );
    }

    // Gửi QLKT - khi status = Paid VÀ có quyền sendToAccounting (BPGN)
    if (canSendToQLKT(data.status) && canSendToAccountingAction) {
      const sendToQLKTButton = (
        <Button
          key="send-to-qlkt"
          type="primary"
          onClick={onSendToQLKT}
          loading={sendingToQLKT}
          disabled={!isOnline}
        >
          Gửi QLKT
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip
            key="send-to-qlkt-tooltip"
            title="Không khả dụng khi offline"
          >
            {sendToQLKTButton}
          </Tooltip>
        ) : (
          sendToQLKTButton
        ),
      );
    }

    // Xác nhận KH - khi status = WaitingCustomerConfirm VÀ có quyền sendToAccounting (BPGN)
    if (
      data.status === TestRequestStatus.WaitingCustomerConfirm &&
      canSendToAccountingAction
    ) {
      const confirmCustomerButton = (
        <Button
          key="confirm-customer"
          type="primary"
          onClick={onOpenCustomerConfirmation}
          disabled={!isOnline}
        >
          Xác nhận KH
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip
            key="confirm-customer-tooltip"
            title="Không khả dụng khi offline"
          >
            {confirmCustomerButton}
          </Tooltip>
        ) : (
          confirmCustomerButton
        ),
      );
    }

    // Gửi mẫu - khi status = RequestApproved (Đã duyệt yêu cầu)
    if (canSendSample(data.status) && canSendSampleAction) {
      const sendSampleButton = (
        <Button
          key="send-sample"
          type="primary"
          onClick={onSendSample}
          loading={sendingSample}
          disabled={!isOnline}
        >
          Gửi mẫu
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip key="send-sample-tooltip" title="Không khả dụng khi offline">
            {sendSampleButton}
          </Tooltip>
        ) : (
          sendSampleButton
        ),
      );
    }

    // Gửi kết quả - khi status = Approved
    if (data.status === TestRequestStatus.Approved) {
      const sendResultButton = (
        <Button
          key="send-result"
          type="primary"
          onClick={onSendResult}
          disabled={!isOnline}
        >
          Gửi kết quả
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip key="send-result-tooltip" title="Không khả dụng khi offline">
            {sendResultButton}
          </Tooltip>
        ) : (
          sendResultButton
        ),
      );
    }

    // Hoàn thành - khi status = ResultSent
    if (canComplete(data.status)) {
      const completeButton = (
        <Button
          key="complete"
          type="primary"
          onClick={onComplete}
          disabled={!isOnline}
        >
          Hoàn thành
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip key="complete-tooltip" title="Không khả dụng khi offline">
            {completeButton}
          </Tooltip>
        ) : (
          completeButton
        ),
      );
    }

    // Xác nhận bàn giao KH - BPGN xác nhận khi status = ReportPublished hoặc PartialResultSent
    if (
      (data.status === TestRequestStatus.ReportPublished ||
        data.status === TestRequestStatus.PartialResultSent) &&
      onConfirmDelivery
    ) {
      const confirmDeliveryButton = (
        <Button
          key="confirm-delivery"
          type="primary"
          onClick={onConfirmDelivery}
          loading={confirmingDelivery}
          disabled={!isOnline}
        >
          Xác nhận bàn giao KH
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip
            key="confirm-delivery-tooltip"
            title="Không khả dụng khi offline"
          >
            {confirmDeliveryButton}
          </Tooltip>
        ) : (
          confirmDeliveryButton
        ),
      );
    }

    // === 2. IN PHIẾU TN (ưu tiên trung bình) ===

    // In phiếu TN - chỉ admin hoặc SampleReceiver mới thấy
    if (canPrintTestRequest) {
      const printButton = (
        <Button
          key="print"
          icon={<FileTextOutlined />}
          onClick={onPrintTestRequest}
          loading={printingTestRequest}
          disabled={!isOnline}
        >
          In phiếu TN
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip key="print-tooltip" title="Không khả dụng khi offline">
            {printButton}
          </Tooltip>
        ) : (
          printButton
        ),
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
      const printSingleButton = (
        <Button
          key="print-single"
          icon={<PrinterOutlined />}
          onClick={onPrintSingle}
          disabled={!canPrint || !isOnline}
        >
          In KQ
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip
            key="print-single-tooltip"
            title="Không khả dụng khi offline"
          >
            {printSingleButton}
          </Tooltip>
        ) : (
          printSingleButton
        ),
      );

      const printMixedButton = (
        <Button
          key="print-mixed"
          icon={<PrinterOutlined />}
          onClick={onPrintMixed}
          disabled={!canPrint || !isOnline}
        >
          In KQ Hỗn hợp
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip key="print-mixed-tooltip" title="Không khả dụng khi offline">
            {printMixedButton}
          </Tooltip>
        ) : (
          printMixedButton
        ),
      );
    }

    // === 4. HỦY YÊU CẦU (danger - cuối cùng) ===

    // Hủy yêu cầu - hiển thị ở tất cả status trừ Completed, ResultSent và Cancelled VÀ có quyền cancel
    if (canCancelRequest(data.status) && canCancelAction) {
      const cancelButton = (
        <Button
          key="cancel-request"
          danger
          onClick={onCancelRequest}
          loading={cancellingRequest}
          disabled={!isOnline}
        >
          Hủy yêu cầu
        </Button>
      );
      buttons.push(
        !isOnline ? (
          <Tooltip
            key="cancel-request-tooltip"
            title="Không khả dụng khi offline"
          >
            {cancelButton}
          </Tooltip>
        ) : (
          cancelButton
        ),
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
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết yêu cầu thử nghiệm</span>
              <Tag className="request-number-tag">{data.requestNumber}</Tag>
              {getStatusTag(data.status)}
            </Space>
            <Space wrap>
              {renderActionButtons()}
              {canEditTestRequest(data.status) &&
                !isCancelledRequest(data.status) &&
                canEditRequest && (
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

        {/* Thông báo khi đang offline hoặc xem dữ liệu cache */}
        {!isOnline && (
          <Alert
            message={
              <Space>
                <CloudOutlined />
                <span>
                  Bạn đang offline. Một số thao tác sẽ không khả dụng.
                </span>
              </Space>
            }
            type="warning"
            showIcon={false}
            style={{ marginBottom: 16 }}
          />
        )}

        {isOfflineData && isOnline && (
          <Alert
            message={
              <Space>
                <CloudOutlined />
                <span>
                  Đang xem dữ liệu đã lưu trong bộ nhớ đệm. Thông tin có thể
                  chưa được cập nhật.
                </span>
              </Space>
            }
            type="info"
            showIcon={false}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Thông tin hợp đồng / Khách hàng / Loại hình mẫu */}
        <div className="detail-sections-row">
          <div className="detail-sections-flex">
            <ContractInfoSection data={data} />
          </div>
          <div className="detail-sections-flex">
            <CustomerInfoSection data={data} />
          </div>
          <div className="detail-sections-fixed">
            <SampleTypeSection data={data} />
          </div>
        </div>

        {/* Bảng mẫu */}
        <Card
          className="list-card"
          title={
            <span>
              Thông tin mẫu (
              {data.totalSampleCount || data.samples?.length || 0} mẫu)
            </span>
          }
          style={{ marginBottom: 24 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={(data.samples || []).filter((s) => !s.isCancelled)}
            columns={sampleColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1600 }}
            size="small"
            bordered
            locale={{ emptyText: "Không có mẫu nào" }}
          />
        </Card>

        {/* Layout: Yêu cầu bên trái, Chi phí bên phải */}
        <div className="detail-bottom-row">
          <div className="detail-bottom-left">
            <MethodRequirementsSection data={data} />
            <ResultRequirementsSection data={data} />
            <SamplingDeliverySection data={data} />
          </div>
          <div className="detail-bottom-right">
            <CostInfoSection
              data={data}
              onViewCostHistory={onViewCostHistory}
            />
          </div>
        </div>

        {/* Hình ảnh gửi bưu điện */}
        <PostalImagesSection data={data} />

        {/* Thông tin hệ thống */}
        <div style={{ background: "#FAFAFA", borderRadius: 8, padding: 16 }}>
          <Descriptions size="small" column={{ xs: 1, md: 2 }}>
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
        </div>
      </Card>
    </div>
  );
};

export default TestRequestDetailContainer;
