// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Card, message, Spin } from "antd";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { testRequestService } from "../../services/testRequestService";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestSampleDto,
} from "../../types/testRequest";
import "./TestRequestDetail.css";
import { API_BASE_URL } from "../../services/api";

// Components
import TestRequestDetailContainer from "./components/TestRequestDetailContainer";
import ProcessTimelineModal from "./components/ProcessTimelineModal";
import SampleImagesModal from "./components/SampleImagesModal";
import PostalDeliveryImageModal from "./components/PostalDeliveryImageModal";
import BM01SampleSelectionModal from "./components/BM01SampleSelectionModal";
import MixedResultModal from "./components/MixedResultModal";
import RejectResultModal from "./components/RejectResultModal";

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto | null>(null);

  // Modal states
  const [sampleSelectionModalVisible, setSampleSelectionModalVisible] =
    useState(false);
  const [mixedResultModalVisible, setMixedResultModalVisible] = useState(false);
  const [rejectResultModalVisible, setRejectResultModalVisible] =
    useState(false);
  const [processTimelineModalVisible, setProcessTimelineModalVisible] =
    useState(false);
  const [postalImageModalVisible, setPostalImageModalVisible] = useState(false);
  const [sampleImagesModalVisible, setSampleImagesModalVisible] =
    useState(false);
  const [selectedSampleForImages, setSelectedSampleForImages] =
    useState<TestRequestSampleDto | null>(null);

  // Loading states
  const [printingTestRequest, setPrintingTestRequest] = useState(false);
  const [sendingSample, setSendingSample] = useState(false);

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
        onPrintTestRequest={handlePrintTestRequest}
        onSendSample={handleSendSample}
        onSendResult={handleSendResult}
        onComplete={handleComplete}
        onOpenProcessTimeline={() => setProcessTimelineModalVisible(true)}
        onViewSampleImages={handleViewSampleImages}
      />

      {/* BM01 Sample Selection Modal */}
      <BM01SampleSelectionModal
        open={sampleSelectionModalVisible}
        onClose={() => setSampleSelectionModalVisible(false)}
        testRequestId={id!}
        onSuccess={() => loadData(id!)}
      />

      {/* Mixed Result Sample Selection Modal */}
      <MixedResultModal
        open={mixedResultModalVisible}
        onClose={() => setMixedResultModalVisible(false)}
        testRequestId={id!}
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
    </>
  );
};

export default TestRequestDetail;
