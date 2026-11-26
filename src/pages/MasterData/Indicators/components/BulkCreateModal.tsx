import React, { useCallback } from "react";
import { Modal, Form, Select, Button, Row, Col, Tooltip, Card } from "antd";
import Icon from "../../../../components/common/Icon";
import { RichTextEditor } from "../../../../components/common";
import type { FormInstance } from "antd";
import "./BulkCreateModal.css";

interface SelectOption {
  value: string;
  label: string;
}

interface BulkCreateModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  groupOptions: SelectOption[];
  laboratoryOptions: SelectOption[];
  onOk: () => void;
  onCancel: () => void;
}

interface SubIndicator {
  name: string;
  formattedName: string;
}

interface IndicatorItem {
  name: string;
  formattedName: string;
  laboratoryId?: string;
  subIndicators: SubIndicator[];
}

const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
  open,
  loading,
  form,
  groupOptions,
  laboratoryOptions,
  onOk,
  onCancel,
}) => {
  // Watch entire indicators array
  const indicators: IndicatorItem[] = Form.useWatch('indicators', form) || [];

  // Add sub-indicator to a specific parent
  const handleAddSubIndicator = useCallback((parentIndex: number) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    const updatedIndicators = currentIndicators.map((ind: IndicatorItem, idx: number) => {
      if (idx === parentIndex) {
        return {
          ...ind,
          subIndicators: [...(ind.subIndicators || []), { name: "", formattedName: "" }]
        };
      }
      return ind;
    });
    form.setFieldsValue({ indicators: updatedIndicators });
  }, [form]);

  // Remove sub-indicator from a specific parent
  const handleRemoveSubIndicator = useCallback((parentIndex: number, subIndex: number) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    const updatedIndicators = currentIndicators.map((ind: IndicatorItem, idx: number) => {
      if (idx === parentIndex) {
        return {
          ...ind,
          subIndicators: ind.subIndicators.filter((_: SubIndicator, sIdx: number) => sIdx !== subIndex)
        };
      }
      return ind;
    });
    form.setFieldsValue({ indicators: updatedIndicators });
  }, [form]);

  // Update parent indicator name
  const handleUpdateParentName = useCallback((parentIndex: number, html: string, plainText: string) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    const updatedIndicators = currentIndicators.map((ind: IndicatorItem, idx: number) => {
      if (idx === parentIndex) {
        return {
          ...ind,
          name: plainText,
          formattedName: html
        };
      }
      return ind;
    });
    form.setFieldsValue({ indicators: updatedIndicators });
  }, [form]);

  // Update sub-indicator name
  const handleUpdateSubName = useCallback((parentIndex: number, subIndex: number, html: string, plainText: string) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    const updatedIndicators = currentIndicators.map((ind: IndicatorItem, idx: number) => {
      if (idx === parentIndex) {
        const newSubs = [...ind.subIndicators];
        newSubs[subIndex] = { name: plainText, formattedName: html };
        return {
          ...ind,
          subIndicators: newSubs
        };
      }
      return ind;
    });
    form.setFieldsValue({ indicators: updatedIndicators });
  }, [form]);

  // Update parent indicator laboratory
  const handleUpdateParentLab = useCallback((parentIndex: number, labId: string) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    const updatedIndicators = currentIndicators.map((ind: IndicatorItem, idx: number) => {
      if (idx === parentIndex) {
        return { ...ind, laboratoryId: labId };
      }
      return ind;
    });
    form.setFieldsValue({ indicators: updatedIndicators });
  }, [form]);

  // Add new parent indicator
  const handleAddParent = useCallback(() => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    form.setFieldsValue({
      indicators: [...currentIndicators, { name: "", formattedName: "", laboratoryId: undefined, subIndicators: [] }]
    });
  }, [form]);

  // Remove parent indicator
  const handleRemoveParent = useCallback((parentIndex: number) => {
    const currentIndicators = form.getFieldValue('indicators') || [];
    form.setFieldsValue({
      indicators: currentIndicators.filter((_: IndicatorItem, idx: number) => idx !== parentIndex)
    });
  }, [form]);

  return (
    <Modal
      className="bulk-create-modal"
      title={
        <span>
          Thêm nhiều chỉ tiêu{" "}
          <Tooltip
            title={
              <div>
                <div>Phím tắt định dạng:</div>
                <div>Ctrl+B: Đậm</div>
                <div>Ctrl+I: Nghiêng</div>
                <div>Ctrl+U: Gạch chân</div>
                <div>Ctrl+,: Chỉ số dưới (x₂)</div>
                <div>Ctrl+.: Chỉ số trên (x²)</div>
              </div>
            }
          >
            <span style={{ cursor: "help" }}>
              <Icon name="info-circle" style={{ color: "#8c8c8c" }} />
            </span>
          </Tooltip>
        </span>
      }
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Thêm tất cả"
      cancelText="Hủy"
      width={900}
      centered
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="indicatorGroupId"
          label="Nhóm chỉ tiêu"
        >
          <Select
            placeholder="Không phân nhóm"
            allowClear
            showSearch
            optionFilterProp="label"
            options={groupOptions}
          />
        </Form.Item>
        {/* Hidden field to store indicators data */}
        <Form.Item name="indicators" hidden>
          <input type="hidden" />
        </Form.Item>

        <Card size="small" style={{ marginBottom: 16 }}>
          {indicators.map((indicator, parentIndex) => (
            <div
              key={parentIndex}
              style={{
                marginBottom: parentIndex === indicators.length - 1 ? 0 : 24,
              }}
            >
              {/* Parent indicator row */}
              <Row gutter={8} align="middle" wrap={false}>
                <Col flex="32px">
                  <Tooltip title="Thêm chỉ tiêu phụ">
                    <Button
                      type="text"
                      size="small"
                      icon={<Icon name="plus-lg" />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddSubIndicator(parentIndex);
                      }}
                      style={{
                        color: "#8C8C8C",
                        padding: 0,
                        width: 24,
                        height: 24,
                      }}
                    />
                  </Tooltip>
                </Col>
                <Col flex="200px">
                  <Select
                    value={indicator.laboratoryId}
                    onChange={(val) => handleUpdateParentLab(parentIndex, val)}
                    placeholder="Khoa phòng"
                    showSearch
                    optionFilterProp="label"
                    options={laboratoryOptions}
                    className="bulk-row-select"
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col flex="auto">
                  <div
                    className={`bulk-modal-parent-wrapper ${(indicator.subIndicators || []).length > 0 ? "has-children" : ""}`}
                  >
                    <RichTextEditor
                      value={indicator.formattedName || ""}
                      onChange={(html, plainText) => handleUpdateParentName(parentIndex, html, plainText)}
                      placeholder="Nhập tên chỉ tiêu cha"
                    />
                  </div>
                </Col>
                <Col flex="32px">
                  {indicators.length > 1 && (
                    <Tooltip title="Xóa chỉ tiêu">
                      <Button
                        type="text"
                        size="small"
                        icon={<Icon name="trash3" />}
                        onClick={() => handleRemoveParent(parentIndex)}
                        style={{
                          color: "#CF1322",
                          padding: 0,
                          width: 24,
                          height: 24,
                        }}
                      />
                    </Tooltip>
                  )}
                </Col>
              </Row>

              {/* Sub-indicators */}
              {(indicator.subIndicators || []).length > 0 && (
                <Row gutter={8} style={{ marginTop: 12 }}>
                  <Col flex="32px" />
                  <Col flex="auto">
                    <div
                      style={{
                        padding: "12px 12px 12px 32px",
                        background: "#F5F5F5",
                        borderRadius: "12px",
                        position: "relative",
                      }}
                    >
                      {indicator.subIndicators.map((sub, subIndex) => (
                        <Row
                          key={subIndex}
                          gutter={16}
                          align="middle"
                          wrap={false}
                          style={{
                            marginBottom: subIndex === indicator.subIndicators.length - 1 ? 0 : 12,
                          }}
                        >
                          <Col flex="auto">
                            <div
                              className={`bulk-modal-sub-wrapper ${subIndex === 0 ? "is-first" : ""} ${subIndex === indicator.subIndicators.length - 1 ? "is-last" : ""}`}
                            >
                              <RichTextEditor
                                value={sub.formattedName || ""}
                                onChange={(html, plainText) => handleUpdateSubName(parentIndex, subIndex, html, plainText)}
                                placeholder="Nhập tên chỉ tiêu phụ"
                              />
                            </div>
                          </Col>
                          <Col flex="32px">
                            <Tooltip title="Xóa chỉ tiêu phụ">
                              <Button
                                type="text"
                                size="small"
                                icon={<Icon name="trash3" />}
                                onClick={() => handleRemoveSubIndicator(parentIndex, subIndex)}
                                style={{
                                  color: "#CF1322",
                                  padding: 0,
                                  width: 24,
                                  height: 24,
                                }}
                              />
                            </Tooltip>
                          </Col>
                        </Row>
                      ))}
                    </div>
                  </Col>
                  <Col flex="32px" />
                </Row>
              )}
            </div>
          ))}
        </Card>

        <Form.Item style={{ margin: "12px 0px" }}>
          <Button
            type="default"
            onClick={handleAddParent}
            icon={<Icon name="plus-lg" />}
          >
            Thêm dòng
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BulkCreateModal;
