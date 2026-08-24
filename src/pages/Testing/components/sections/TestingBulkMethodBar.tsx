import React, { useState } from "react";
import { Button, Checkbox, Col, DatePicker, Form, Modal, Row, Select, Typography } from "antd";
import type { FormInstance } from "antd";
import { SendOutlined, SwapOutlined } from "../../../../components/common/Icon";
import { MethodLookupDto } from "../../../../types/laboratoryTask";
import dayjs from "dayjs";

const { Text } = Typography;

export interface TestingBulkMethodBarProps {
  /** Filter hiển thị theo chỉ tiêu (indicatorId) */
  indicatorFilter: string[];
  indicatorFilterOptions: { value: string; label: string }[];
  onIndicatorFilterChange: (values: string[]) => void;
  /** Chọn tất cả toàn cục (qua mọi mẫu) */
  totalGlobalSelectable: number;
  totalGlobalSelected: number;
  /** Số chỉ tiêu gốc trong selection thực sự đổi được PP (canEdit, không Done/Cancelled) */
  totalMethodEditableSelected: number;
  globalSelectedSampleCount: number;
  isGlobalAllSelected: boolean;
  isGlobalIndeterminate: boolean;
  onGlobalSelectAll: () => void;
  /** Modal chọn phương pháp bulk */
  methods: MethodLookupDto[];
  methodSelectModalOpen: boolean;
  bulkMethodLoading: boolean;
  methodSelectForm: FormInstance;
  onOpenMethodModal: () => void;
  onCloseMethodModal: () => void;
  onConfirmMethod: () => void;
  /** Bulk chọn ngày thử nghiệm cho tất cả chỉ tiêu đã chọn (cross-sample) */
  onGlobalBulkTestDateChange?: (date: string) => void;
  /** Gửi kết quả cho tất cả chỉ tiêu đã chọn (cross-sample) */
  onGlobalSubmitResults?: () => Promise<void>;
  globalSubmitting?: boolean;
  hasGlobalSubmittableIndicators?: boolean;
}

const TestingBulkMethodBar: React.FC<TestingBulkMethodBarProps> = ({
  indicatorFilter,
  indicatorFilterOptions,
  onIndicatorFilterChange,
  totalGlobalSelectable,
  totalGlobalSelected,
  totalMethodEditableSelected,
  globalSelectedSampleCount,
  isGlobalAllSelected,
  isGlobalIndeterminate,
  onGlobalSelectAll,
  methods,
  methodSelectModalOpen,
  bulkMethodLoading,
  methodSelectForm,
  onOpenMethodModal,
  onCloseMethodModal,
  onConfirmMethod,
  onGlobalBulkTestDateChange,
  onGlobalSubmitResults,
  globalSubmitting = false,
  hasGlobalSubmittableIndicators = false,
}) => {
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleGlobalSubmit = async () => {
    if (!onGlobalSubmitResults) return;
    setSubmitLoading(true);
    try {
      await onGlobalSubmitResults();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date && onGlobalBulkTestDateChange) {
      onGlobalBulkTestDateChange(date.format("YYYY-MM-DD"));
    }
  };

  const isSubmitting = globalSubmitting || submitLoading;

  return (
  <div
    style={{
      marginTop: 16,
      marginBottom: 16,
      padding: "10px 16px",
      boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
      borderRadius: "12px",
    }}
  >
    <div style={{ marginBottom: 8 }}>
      <Select
        mode="multiple"
        allowClear
        placeholder="Chọn chỉ tiêu"
        style={{ width: 300 }}
        options={indicatorFilterOptions}
        value={indicatorFilter}
        onChange={onIndicatorFilterChange}
        optionFilterProp="label"
        maxTagCount="responsive"
      />
    </div>

    <Row gutter={24} justify="space-between" align="middle">
      {totalGlobalSelectable > 0 && (
        <Col>
          <div
            onClick={onGlobalSelectAll}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <Checkbox
              checked={isGlobalAllSelected}
              indeterminate={isGlobalIndeterminate}
            >
              Chọn tất cả (Đã chọn {globalSelectedSampleCount} mẫu -{" "}
              {totalGlobalSelected} chỉ tiêu)
            </Checkbox>
          </div>
        </Col>
      )}
      <Col style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {onGlobalBulkTestDateChange && (
          <>
            <Text type="secondary" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
              Ngày thử nghiệm:
            </Text>
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              disabled={totalGlobalSelected === 0}
              onChange={handleDateChange}
              style={{ width: 140 }}
            />
          </>
        )}
        <Button
          icon={<SwapOutlined />}
          disabled={totalMethodEditableSelected === 0}
          loading={bulkMethodLoading}
          onClick={onOpenMethodModal}
        >
          Chọn phương pháp
          {totalMethodEditableSelected > 0
            ? ` (${totalMethodEditableSelected})`
            : ""}
        </Button>
        {onGlobalSubmitResults && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              totalGlobalSelected === 0 ||
              !hasGlobalSubmittableIndicators
            }
            onClick={handleGlobalSubmit}
          >
            Gửi kết quả
            {totalGlobalSelected > 0 ? ` (${totalGlobalSelected})` : ""}
          </Button>
        )}
      </Col>
    </Row>

    <Modal
      title={`Chọn phương pháp cho ${totalMethodEditableSelected} chỉ tiêu`}
      open={methodSelectModalOpen}
      onOk={onConfirmMethod}
      onCancel={onCloseMethodModal}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{ loading: bulkMethodLoading }}
      width={500}
      centered
    >
      <Form form={methodSelectForm} layout="vertical">
        <Form.Item
          name="methodId"
          label="Phương pháp"
          rules={[{ required: true, message: "Vui lòng chọn phương pháp" }]}
        >
          <Select
            placeholder="Chọn phương pháp..."
            options={methods.map((m) => ({ value: m.id, label: m.name }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  );
};

export default TestingBulkMethodBar;
