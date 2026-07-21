// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Card, message, Spin, Modal, Input, Form, Alert, Space } from "antd";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  testRequestService,
  offlineTestRequestService,
} from "../../services/testRequestService";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import {
  generateTestRequestFormOffline,
  isOfflinePrintAvailable,
  downloadDocument,
} from "../../services/offline/offlinePrintService";
import { isServerReachable } from "../../services/offline/connectivity";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestSampleDto,
} from "../../types/testRequest";
import { IndicatorApprovalStatus } from "../../types/laboratoryTask";
import "./TestRequestDetail.css";
import { useMultipleActionPermissions } from "../../hooks/useActionPermission";
import { usePageTitleOverride } from "../../hooks/usePageTitle";

// Components
import TestRequestDetailContainer from "./components/TestRequestDetailContainer";
import ProcessTimelineModal from "./components/ProcessTimelineModal";
import SampleImagesModal from "./components/SampleImagesModal";
import PostalDeliveryImageModal from "./components/PostalDeliveryImageModal";
import PrintIndicatorModal from "./components/PrintIndicatorModal";
import PrintMixedIndicatorModal from "./components/PrintMixedIndicatorModal";
import RejectResultModal from "./components/RejectResultModal";
import CustomerConfirmationModal from "./components/CustomerConfirmationModal";
import CostChangeHistoryModal from "./components/CostChangeHistoryModal";
import SendToQLKTModal from "./components/SendToQLKTModal";
import PaymentConfirmationModal from "./components/PaymentConfirmationModal";
import { getApiErrorMessage } from "../../utils/errorHandler";

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto | null>(null);

  // Network status for offline support
  const { isOnline } = useNetworkStatus();
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Modal states
  const [printIndicatorModalVisible, setPrintIndicatorModalVisible] =
    useState(false);
  const [printMixedIndicatorModalVisible, setPrintMixedIndicatorModalVisible] =
    useState(false);
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
  const [
    customerConfirmationModalVisible,
    setCustomerConfirmationModalVisible,
  ] = useState(false);
  const [costHistoryModalVisible, setCostHistoryModalVisible] = useState(false);
  const [sendToQLKTModalVisible, setSendToQLKTModalVisible] = useState(false);
  const [paymentConfirmationModalVisible, setPaymentConfirmationModalVisible] =
    useState(false);

  // Loading states
  const [printingTestRequest, setPrintingTestRequest] = useState(false);
  const [sendingSample, setSendingSample] = useState(false);
  const [sendingToAccounting, setSendingToAccounting] = useState(false);
  const [sendingToQLKT, setSendingToQLKT] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  // Form for cancel reason
  const [cancelForm] = Form.useForm();

  usePageTitleOverride(data?.contractNumber || undefined);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (requestId: string) => {
    setLoading(true);
    try {
      const response = await offlineTestRequestService.getWithStatus(requestId);
      setData(response.data);
      setIsOfflineData(response.isOfflineData);
    } catch (error: any) {
      console.error("Error loading test request:", error);
      message.error("Không thể tải thông tin yêu cầu thử nghiệm");
      setData(null);
      setIsOfflineData(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle print test request form
  const writeLoadingTab = (win: Window, text: string) => {
    win.document.write(`
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
        <body><div class="loader"><div class="spinner"></div><p>${text}</p></div></body>
      </html>
    `);
  };

  const handlePrintTestRequest = async () => {
    if (!id) return;

    // Probe the server (navigator.onLine alone is unreliable: Docker/VPN adapters
    // or Wi-Fi-without-Internet report online). Unreachable => offline flow.
    const online = await isServerReachable();

    // ONLINE MODE: Use existing backend flow
    if (online) {
      setPrintingTestRequest(true);

      const newTab = window.open("about:blank", "_blank");

      if (newTab) {
        writeLoadingTab(newTab, "Đang tạo phiếu yêu cầu...");
      }

      try {
        const result = await testRequestService.generateTestRequestForm(id);
        message.success(`Đã tạo phiếu yêu cầu XN: ${result.contractNumber}`);

        // Open Word Editor (BE now returns .docx directly)
        const editorUrl = `/document-editor?file=${encodeURIComponent(result.fileName)}`;
        if (newTab) {
          newTab.location.href = editorUrl;
        } else {
          window.open(editorUrl, "_blank");
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
      return;
    }

    // OFFLINE MODE: Generate document client-side and download it straight to
    // disk — print/edit with Word/Office locally. No editor round-trip (the
    // offline editor doesn't preserve every template element, e.g. floating
    // textboxes), no extra tab.
    setPrintingTestRequest(true);
    try {
      const canPrintOffline = await isOfflinePrintAvailable();
      if (!canPrintOffline) {
        message.warning(
          "Template chưa được tải về. Vui lòng kết nối mạng để tải template trước."
        );
        return;
      }

      const result = await generateTestRequestFormOffline(id);
      if (!result.success || !result.blob) {
        message.error(result.error || "Không thể tạo phiếu. Vui lòng thử lại.");
        return;
      }

      downloadDocument(result.blob, result.fileName!);
      message.success("Đã tạo phiếu yêu cầu (offline). Đang tải xuống...");
    } catch (error: any) {
      console.error("Error printing test request offline:", error);
      message.error(
        error?.message || "Không thể tạo phiếu. Vui lòng thử lại."
      );
    } finally {
      setPrintingTestRequest(false);
    }
  };

  // Handle send sample
  const handleSendSample = () => {
    if (!id) return;
    if (!isOnline) {
      message.warning("Không thể gửi mẫu khi đang offline");
      return;
    }
    Modal.confirm({
      title: "Xác nhận gửi mẫu",
      content: "Bạn có chắc chắn muốn gửi mẫu không?",
      okText: "Gửi mẫu",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setSendingSample(true);
        try {
          await testRequestService.sendSample(id);
          message.success("Đã gửi mẫu thành công");
          loadData(id);
        } catch (error: any) {
          console.error("Error sending sample:", error);
          message.error(
            error?.response?.data?.error?.message ||
              "Không thể gửi mẫu. Vui lòng thử lại.",
          );
        } finally {
          setSendingSample(false);
        }
      },
    });
  };

  // Handle send to accounting (Gửi kế toán)
  const handleSendToAccounting = async () => {
    if (!id) return;
    if (!isOnline) {
      message.warning("Không thể gửi kế toán khi đang offline");
      return;
    }
    setSendingToAccounting(true);
    try {
      const receiptId = await testRequestService.sendToAccounting(id);
      message.success("Đã gửi kế toán thành công. Phiếu thu đã được tạo.");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending to accounting:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi kế toán. Vui lòng thử lại.",
      );
    } finally {
      setSendingToAccounting(false);
    }
  };

  // Handle send to QLKT (Gửi QLKT) - open modal to select laboratory
  const handleSendToQLKT = () => {
    if (!id || !data) return;
    if (!isOnline) {
      message.warning("Không thể gửi QLKT khi đang offline");
      return;
    }
    setSendToQLKTModalVisible(true);
  };

  // Handle send to QLKT success (called from modal)
  const handleSendToQLKTSuccess = () => {
    setSendToQLKTModalVisible(false);
    loadData(id!);
  };

  // Handle cancel request - open modal to enter reason
  const handleCancelRequest = () => {
    if (!id) return;
    if (!isOnline) {
      message.warning("Không thể hủy yêu cầu khi đang offline");
      return;
    }
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
          "Không thể hủy yêu cầu. Vui lòng thử lại.",
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
          "Không thể gửi kết quả. Vui lòng thử lại.",
      );
    }
  };

  // Handle complete test request
  const handleComplete = async () => {
    if (!id || !data) return;
    if (!isOnline) {
      message.warning("Không thể hoàn thành yêu cầu khi đang offline");
      return;
    }

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
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`,
        );
      }
    } catch (error: any) {
      console.error("Error completing test request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại.",
      );
    }
  };

  // Handle complete with postal images
  const handleCompleteWithImage = async (imageFileIds: string[]) => {
    if (!id) return;
    if (!isOnline) {
      message.warning("Không thể hoàn thành yêu cầu khi đang offline");
      return;
    }

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
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`,
        );
      }
    } catch (error: any) {
      console.error("Error completing with image:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại.",
      );
    }
  };

  // Handle view sample images
  const handleViewSampleImages = (sample: TestRequestSampleDto) => {
    setSelectedSampleForImages(sample);
    setSampleImagesModalVisible(true);
  };

  // Handle confirm delivery to customer (BPGN)
  const handleConfirmDelivery = async () => {
    if (!id) return;
    if (!isOnline) {
      message.warning("Không thể xác nhận bàn giao khi đang offline");
      return;
    }

    Modal.confirm({
      title: "Xác nhận bàn giao kết quả",
      content:
        "Bạn có chắc chắn muốn xác nhận đã bàn giao kết quả cho khách hàng?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setConfirmingDelivery(true);
        try {
          await testRequestService.confirmDeliveryToCustomer(id);
          message.success("Đã xác nhận bàn giao kết quả cho khách hàng");
          loadData(id);
        } catch (error: any) {
          console.error("Error confirming delivery:", error);
          message.error(
            error?.response?.data?.error?.message ||
              "Không thể xác nhận bàn giao. Vui lòng thử lại.",
          );
        } finally {
          setConfirmingDelivery(false);
        }
      },
    });
  };

  // Handle print single result (In KQ)
  const handlePrintSingle = () => {
    setPrintIndicatorModalVisible(true);
  };

  // Handle print mixed result (In KQ hỗn hợp)
  const handlePrintMixed = () => {
    setPrintMixedIndicatorModalVisible(true);
  };

  // Handle open customer confirmation modal
  const handleOpenCustomerConfirmation = () => {
    setCustomerConfirmationModalVisible(true);
  };

  // Handle open payment confirmation modal
  const handleOpenPaymentConfirmation = () => {
    setPaymentConfirmationModalVisible(true);
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
  const actionPermissions = useMultipleActionPermissions("testRequests", [
    "edit",
    "sendSample",
    "cancel",
    "sendToAccounting",
    "printRequest",
  ]);

  // Check if user can print test request form (In phiếu XN)
  // Only admin or SampleReceiver can see this button
  const canPrintTestRequest = actionPermissions.printRequest?.canAll || false;

  // Check các quyền khác
  const canEditRequest = actionPermissions.edit?.canAll || false;
  const canSendSampleAction = actionPermissions.sendSample?.canAll || false;
  const canCancelAction = actionPermissions.cancel?.canAll || false;
  const canSendToAccountingAction =
    actionPermissions.sendToAccounting?.canAll || false;

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
        confirmingDelivery={confirmingDelivery}
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
        onConfirmDelivery={handleConfirmDelivery}
        onViewCostHistory={() => setCostHistoryModalVisible(true)}
        onOpenPaymentConfirmation={handleOpenPaymentConfirmation}
        canPrint={canPrint}
        canPrintTestRequest={canPrintTestRequest}
        // Permission flags theo Permission Matrix
        canEditRequest={canEditRequest}
        canSendSampleAction={canSendSampleAction}
        canCancelAction={canCancelAction}
        canSendToAccountingAction={canSendToAccountingAction}
        // Offline support
        isOnline={isOnline}
        isOfflineData={isOfflineData}
      />

      {/* In KQ đơn */}
      <PrintIndicatorModal
        visible={printIndicatorModalVisible}
        testRequestId={id!}
        onCancel={() => setPrintIndicatorModalVisible(false)}
        onSuccess={() => loadData(id!)}
      />

      {/* In KQ hỗn hợp */}
      <PrintMixedIndicatorModal
        visible={printMixedIndicatorModalVisible}
        testRequestId={id!}
        onCancel={() => setPrintMixedIndicatorModalVisible(false)}
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

      {/* Cost Change History Modal */}
      <CostChangeHistoryModal
        open={costHistoryModalVisible}
        onClose={() => setCostHistoryModalVisible(false)}
        testRequestId={id!}
      />

      {/* Send to QLKT Modal (Gửi QLKT - Chọn khoa phòng) */}
      {data && (
        <SendToQLKTModal
          visible={sendToQLKTModalVisible}
          testRequest={data}
          onCancel={() => setSendToQLKTModalVisible(false)}
          onSuccess={handleSendToQLKTSuccess}
        />
      )}

      {/* Payment Confirmation Modal (Xác nhận thanh toán) */}
      <PaymentConfirmationModal
        open={paymentConfirmationModalVisible}
        onClose={() => setPaymentConfirmationModalVisible(false)}
        testRequestId={id!}
        onSuccess={() => loadData(id!)}
        alreadyPaid={data?.paymentReceived === true || data?.sampleTypeTask === true}
      />
    </>
  );
};

export default TestRequestDetail;
