// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Card, message, Spin, Modal, Input, Form } from "antd";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { testRequestService } from "../../services/testRequestService";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestSampleDto,
} from "../../types/testRequest";
import { IndicatorApprovalStatus } from "../../types/laboratoryTask";
import "./TestRequestDetail.css";
import { API_BASE_URL } from "../../services/api";
import { useMultipleActionPermissions } from "../../hooks/useActionPermission";

// Components
import TestRequestDetailContainer from "./components/TestRequestDetailContainer";
import ProcessTimelineModal from "./components/ProcessTimelineModal";
import SampleImagesModal from "./components/SampleImagesModal";
import PostalDeliveryImageModal from "./components/PostalDeliveryImageModal";
import PrintIndicatorModal from "./components/PrintIndicatorModal";
import RejectResultModal from "./components/RejectResultModal";
import CustomerConfirmationModal from "./components/CustomerConfirmationModal";

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto | null>(null);

  // Modal states
  const [printIndicatorModalVisible, setPrintIndicatorModalVisible] =
    useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'mixed'>('single');
  const [rejectResultModalVisible, setRejectResultModalVisible] =
    useState(false);
  const [processTimelineModalVisible, setProcessTimelineModalVisible] =
    useState(false);
  const [postalImageModalVisible, setPostalImageModalVisible] = useState(false);
  const [sampleImagesModalVisible, setSampleImagesModalVisible] =
    useState(false);
  const [selectedSampleForImages, setSelectedSampleForImages] =
    useState<TestRequestSampleDto | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [customerConfirmationModalVisible, setCustomerConfirmationModalVisible] =
    useState(false);

  // Loading states
  const [printingTestRequest, setPrintingTestRequest] = useState(false);
  const [sendingSample, setSendingSample] = useState(false);
  const [sendingToAccounting, setSendingToAccounting] = useState(false);
  const [sendingToQLKT, setSendingToQLKT] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);

  // Form for cancel reason
  const [cancelForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (requestId: string) => {
    setLoading(true);
    try {
      const result = await testRequestService.get(requestId);
      setData(result);
    } catch (error: any) {
      console.error("Error loading test request:", error);
      message.error("Không thể tải thông tin yêu cầu thử nghiệm");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle print test request form
  const handlePrintTestRequest = async () => {
    if (!id) return;
    setPrintingTestRequest(true);

    const newTab = window.open("about:blank", "_blank");

    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu yêu cầu...</p></div></body>
        </html>
      `);
    }

    try {
      const result = await testRequestService.generateTestRequestForm(id);
      message.success(`Đã tạo phiếu yêu cầu XN: ${result.contractNumber}`);

      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        result.fileName
      )}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank");
      }

      loadData(id);
    } catch (error: any) {
      console.error("Error printing test request:", error);
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu. Vui lòng thử lại."
      );
    } finally {
      setPrintingTestRequest(false);
    }
  };

  // Handle send sample
  const handleSendSample = async () => {
    if (!id) return;
    setSendingSample(true);
    try {
      await testRequestService.sendSample(id);
      message.success("Đã gửi mẫu thành công");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending sample:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi mẫu. Vui lòng thử lại."
      );
    } finally {
      setSendingSample(false);
    }
  };

  // Handle send to accounting (Gửi kế toán)
  const handleSendToAccounting = async () => {
    if (!id) return;
    setSendingToAccounting(true);
    try {
      const receiptId = await testRequestService.sendToAccounting(id);
      message.success("Đã gửi kế toán thành công. Phiếu thu đã được tạo.");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending to accounting:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi kế toán. Vui lòng thử lại."
      );
    } finally {
      setSendingToAccounting(false);
    }
  };

  // Handle send to QLKT (Gửi QLKT)
  const handleSendToQLKT = async () => {
    if (!id) return;
    setSendingToQLKT(true);
    try {
      await testRequestService.sendToQLKT(id);
      message.success("Đã gửi QLKT thành công");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending to QLKT:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi QLKT. Vui lòng thử lại."
      );
    } finally {
      setSendingToQLKT(false);
    }
  };

  // Handle cancel request - open modal to enter reason
  const handleCancelRequest = () => {
    if (!id) return;
    cancelForm.resetFields();
    setCancelModalVisible(true);
  };

  // Handle confirm cancel with reason
  const handleConfirmCancel = async () => {
    if (!id) return;

    try {
      const values = await cancelForm.validateFields();
      setCancellingRequest(true);

      await testRequestService.cancelRequest(id, values.reason);
      message.success("Đã hủy phiếu yêu cầu thành công");
      setCancelModalVisible(false);
      cancelForm.resetFields();
      loadData(id);
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Error cancelling request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hủy yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setCancellingRequest(false);
    }
  };

  // Handle send result
  const handleSendResult = async () => {
    if (!id) return;
    try {
      await testRequestService.sendResult(id);
      message.success("Đã gửi kết quả thành công");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending result:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi kết quả. Vui lòng thử lại."
      );
    }
  };

  // Handle complete test request
  const handleComplete = async () => {
    if (!id || !data) return;

    if (data.deliveryPostal) {
      setPostalImageModalVisible(true);
      return;
    }

    try {
      await testRequestService.complete(id);
      const updatedData = await testRequestService.get(id);
      setData(updatedData);

      if (updatedData.status === TestRequestStatus.Completed) {
        message.success("Đã hoàn thành yêu cầu thử nghiệm");
      } else {
        const statusLabel = TestRequestStatusLabels[updatedData.status];
        message.warning(
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`
        );
      }
    } catch (error: any) {
      console.error("Error completing test request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại."
      );
    }
  };

  // Handle complete with postal images
  const handleCompleteWithImage = async (imageFileIds: string[]) => {
    if (!id) return;

    try {
      await testRequestService.completeWithImage(id, imageFileIds);
      setPostalImageModalVisible(false);

      const updatedData = await testRequestService.get(id);
      setData(updatedData);

      if (updatedData.status === TestRequestStatus.Completed) {
        message.success("Đã hoàn thành yêu cầu thử nghiệm");
      } else {
        const statusLabel = TestRequestStatusLabels[updatedData.status];
        message.warning(
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`
        );
      }
    } catch (error: any) {
      console.error("Error completing with image:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại."
      );
    }
  };

  // Handle view sample images
  const handleViewSampleImages = (sample: TestRequestSampleDto) => {
    setSelectedSampleForImages(sample);
    setSampleImagesModalVisible(true);
  };

  // Handle print single result (In KQ)
  const handlePrintSingle = () => {
    setPrintMode('single');
    setPrintIndicatorModalVisible(true);
  };

  // Handle print mixed result (In KQ hỗn hợp)
  const handlePrintMixed = () => {
    setPrintMode('mixed');
    setPrintIndicatorModalVisible(true);
  };

  // Handle open customer confirmation modal
  const handleOpenCustomerConfirmation = () => {
    setCustomerConfirmationModalVisible(true);
  };

  // Calculate canPrint: có ít nhất 1 chỉ tiêu đã được duyệt
  const canPrint = React.useMemo(() => {
    if (!data?.samples) return false;

    // Đếm số chỉ tiêu đã duyệt từ tất cả các mẫu
    let approvedCount = 0;
    for (const sample of data.samples) {
      if (sample.isCancelled || sample.isCustomerCancelled) continue;
      for (const indicator of sample.indicators || []) {
        if (indicator.approvalStatus === IndicatorApprovalStatus.Approved) {
          approvedCount++;
        }
      }
    }
    return approvedCount > 0;
  }, [data?.samples]);

  // Sử dụng hook để check permissions cho tất cả actions
  const actionPermissions = useMultipleActionPermissions('testRequests', [
    'edit',
    'sendSample',
    'cancel',
    'sendToAccounting',
    'printRequest',
  ]);

  // Check if user can print test request form (In phiếu XN)
  // Only admin or SampleReceiver can see this button
  const canPrintTestRequest = actionPermissions.printRequest?.canAll || false;

  // Check các quyền khác
  const canEditRequest = actionPermissions.edit?.canAll || false;
  const canSendSampleAction = actionPermissions.sendSample?.canAll || false;
  const canCancelAction = actionPermissions.cancel?.canAll || false;
  const canSendToAccountingAction = actionPermissions.sendToAccounting?.canAll || false;

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>{t("common.noData")}</p>
      </Card>
    );
  }

  return (
    <>
      <TestRequestDetailContainer
        data={data}
        id={id!}
        printingTestRequest={printingTestRequest}
        sendingSample={sendingSample}
        sendingToAccounting={sendingToAccounting}
        sendingToQLKT={sendingToQLKT}
        cancellingRequest={cancellingRequest}
        onPrintTestRequest={handlePrintTestRequest}
        onSendSample={handleSendSample}
        onSendResult={handleSendResult}
        onComplete={handleComplete}
        onOpenProcessTimeline={() => setProcessTimelineModalVisible(true)}
        onViewSampleImages={handleViewSampleImages}
        onPrintSingle={handlePrintSingle}
        onPrintMixed={handlePrintMixed}
        onSendToAccounting={handleSendToAccounting}
        onSendToQLKT={handleSendToQLKT}
        onCancelRequest={handleCancelRequest}
        onOpenCustomerConfirmation={handleOpenCustomerConfirmation}
        canPrint={canPrint}
        canPrintTestRequest={canPrintTestRequest}
        // Permission flags theo Permission Matrix
        canEditRequest={canEditRequest}
        canSendSampleAction={canSendSampleAction}
        canCancelAction={canCancelAction}
        canSendToAccountingAction={canSendToAccountingAction}
      />

      {/* Print Indicator Modal (In KQ / In KQ hỗn hợp) */}
      <PrintIndicatorModal
        visible={printIndicatorModalVisible}
        mode={printMode}
        testRequestId={id!}
        onCancel={() => setPrintIndicatorModalVisible(false)}
        onSuccess={() => loadData(id!)}
      />

      {/* Reject Result Modal */}
      <RejectResultModal
        open={rejectResultModalVisible}
        onClose={() => setRejectResultModalVisible(false)}
        testRequestId={id!}
        onSuccess={() => loadData(id!)}
      />

      {/* Process Timeline Modal */}
      <ProcessTimelineModal
        open={processTimelineModalVisible}
        onClose={() => setProcessTimelineModalVisible(false)}
        testRequestId={id!}
      />

      {/* Postal Delivery Image Upload Modal */}
      <PostalDeliveryImageModal
        open={postalImageModalVisible}
        onClose={() => setPostalImageModalVisible(false)}
        onComplete={handleCompleteWithImage}
      />

      {/* Sample Images Modal */}
      <SampleImagesModal
        open={sampleImagesModalVisible}
        onClose={() => {
          setSampleImagesModalVisible(false);
          setSelectedSampleForImages(null);
        }}
        sample={selectedSampleForImages}
      />

      {/* Cancel Request Modal */}
      <Modal
        title="Hủy yêu cầu"
        open={cancelModalVisible}
        onOk={handleConfirmCancel}
        onCancel={() => {
          setCancelModalVisible(false);
          cancelForm.resetFields();
        }}
        confirmLoading={cancellingRequest}
        okText="Xác nhận hủy"
        okType="danger"
        cancelText="Đóng"
        centered
        width={500}
        styles={{
          mask: { width: "100%" },
          wrapper: { width: "100%" },
        }}
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do hủy"
            rules={[{ required: true, message: "Vui lòng nhập lý do hủy" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do hủy yêu cầu..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Confirmation Modal (BPGN xác nhận phản hồi KH) */}
      <CustomerConfirmationModal
        visible={customerConfirmationModalVisible}
        testRequestId={id!}
        onClose={() => setCustomerConfirmationModalVisible(false)}
        onConfirmComplete={() => loadData(id!)}
      />
    </>
  );
};

export default TestRequestDetail;
