import React from "react";
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Spin,
  Space,
  Divider,
  Typography,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
} from "../../types/testRequest";
import { useTestRequestDetail } from "./hooks/useTestRequestDetail";
import { useOnlyOfficeEditor } from "./hooks/useOnlyOfficeEditor";
import { useBM01Modal } from "./hooks/useBM01Modal";
import {
  ContractInfoSection,
  CustomerInfoSection,
  SampleTypeSection,
  MethodSection,
  ResultSection,
  SamplingDeliverySection,
  CostSection,
  PersonnelSection,
  SampleTable,
  BM01Modal,
  EditorModal,
  ActionButtons,
} from "./components/detail";

import "./TestRequestDetail.css";

const { Title, Text } = Typography;

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Custom hooks
  const {
    data,
    loading,
    printingTestRequest,
    handlePrintTestRequest,
    handlePrintMixedResult,
    handleSendResult,
    handleApprove,
    handleComplete,
    handleUpdateToPendingApproval,
  } = useTestRequestDetail(id);

  const editor = useOnlyOfficeEditor();

  const bm01Modal = useBM01Modal({
    testRequestId: id,
    onUpdateToPendingApproval: handleUpdateToPendingApproval,
    onOpenEditor: editor.openEditor,
  });

  // Handle print and open editor
  const handlePrint = async () => {
    const fileName = await handlePrintTestRequest();
    if (fileName) {
      editor.openEditor(fileName);
    }
  };

  const getStatusTag = (status: TestRequestStatus) => {
    const label = TestRequestStatusLabels[status] || status.toString();
    const color = TestRequestStatusColors[status] || "default";
    return <Tag color={color}>{label}</Tag>;
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
    <div className="test-request-detail">
      <Card
        title={
          <Space wrap>
            <span>Chi tiết yêu cầu thử nghiệm</span>
            <Tag color="blue">{data.requestNumber}</Tag>
            {getStatusTag(data.status)}
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/requests")}
            >
              Quay lại
            </Button>
            <ActionButtons
              status={data.status}
              printingTestRequest={printingTestRequest}
              onPrintTestRequest={handlePrint}
              onOpenBM01Modal={bm01Modal.handleOpenBM01Modal}
              onPrintMixedResult={handlePrintMixedResult}
              onApprove={handleApprove}
              onSendResult={handleSendResult}
              onComplete={handleComplete}
            />
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/test-request/edit/${id}`)}
              disabled={!canEditTestRequest(data.status)}
              title={!canEditTestRequest(data.status) ? "Không thể chỉnh sửa ở trạng thái này" : ""}
            >
              Chỉnh sửa
            </Button>
          </Space>
        }
      >
        {/* Thông tin hợp đồng */}
        <ContractInfoSection data={data} />

        {/* Thông tin khách hàng */}
        <CustomerInfoSection data={data} />

        {/* Loại hình mẫu */}
        <SampleTypeSection data={data} />

        {/* Bảng mẫu */}
        <Divider style={{ marginTop: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>Thông tin mẫu</span>
            <Tag color="blue">
              {data.totalSampleCount || data.samples?.length || 0} mẫu
            </Tag>
          </Space>
        </Divider>

        <SampleTable samples={data.samples || []} />

        {/* Các thông tin khác */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <MethodSection data={data} />
            <ResultSection data={data} />
            <SamplingDeliverySection data={data} />
          </Col>

          <Col xs={24} lg={12}>
            <CostSection data={data} />
            <PersonnelSection data={data} />

            {/* Thông tin khác */}
            {(data.changeRequest || data.notes) && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Thông tin khác
                </Title>
                {data.changeRequest && (
                  <div className="detail-item" style={{ marginBottom: 8 }}>
                    <Text type="secondary">Thay đổi YC:</Text>
                    <Text>{data.changeRequest}</Text>
                  </div>
                )}
                {data.notes && (
                  <div className="detail-item">
                    <Text type="secondary">Ghi chú:</Text>
                    <Text>{data.notes}</Text>
                  </div>
                )}
              </div>
            )}

            {data.subcontractor && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Nhà thầu phụ
                </Title>
                <Text>{data.subcontractor}</Text>
              </div>
            )}
          </Col>
        </Row>

        {/* Thông tin hệ thống */}
        <Divider />
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2 }}
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

      {/* BM01 Sample Selection Modal */}
      <BM01Modal
        visible={bm01Modal.sampleSelectionModalVisible}
        samples={bm01Modal.samplesForSelection}
        selectedSampleId={bm01Modal.selectedSampleId}
        loading={bm01Modal.loadingSamples}
        generating={bm01Modal.generatingBM01}
        canGenerate={bm01Modal.canGenerateSelectedSample()}
        onSelectSample={bm01Modal.handleSelectSample}
        onGenerate={bm01Modal.handleGenerateBM01}
        onCancel={bm01Modal.handleCloseBM01Modal}
      />

      {/* OnlyOffice Editor Modal */}
      <EditorModal
        visible={editor.editorModalVisible}
        loading={editor.editorLoading}
        editorContainerRef={editor.editorContainerRef}
        onClose={editor.handleCloseEditorModal}
      />
    </div>
  );
};

export default TestRequestDetail;
