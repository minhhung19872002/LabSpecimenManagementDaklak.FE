import React, { useCallback, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Tooltip,
} from "antd";
import Icon from "../../../../components/common/Icon";
import { RichTextEditor } from "../../../../components/common";
import IndicatorName from "../../../../components/common/IndicatorName";
import {
  IndicatorDto,
  IndicatorGroupDto,
  LaboratoryDto,
  SpecimenTypeDto,
} from "../../../../services/masterDataService";
import {
  QuickCreateIndicatorsFromTestRequestResult,
  testRequestService,
} from "../../../../services/testRequestService";
import "../../../../pages/MasterData/Indicators/components/BulkCreateModal.css";

interface SubIndicatorItem {
  name: string;
  formattedName: string;
}

interface IndicatorItem {
  specimenTypeId?: string;
  name: string;
  formattedName: string;
  unitPrice: number;
  subIndicators: SubIndicatorItem[];
}

interface QuickCreateIndicatorModalProps {
  open: boolean;
  onCancel: () => void;
  indicatorGroups: IndicatorGroupDto[];
  laboratories: LaboratoryDto[];
  specimenTypes: SpecimenTypeDto[];
  indicators: IndicatorDto[];
  indicatorToSpecimenTypesMap: Record<string, { id: string; name: string }[]>;
  testRequestId?: string;
  contractNumber?: string;
  defaultIndicatorGroupId?: string;
  defaultSpecimenTypeId?: string;
  onCreated: (
    result: QuickCreateIndicatorsFromTestRequestResult,
    prices: Record<string, number>
  ) => void;
}

const QuickCreateIndicatorModal: React.FC<QuickCreateIndicatorModalProps> = ({
  open,
  onCancel,
  indicatorGroups,
  laboratories,
  specimenTypes,
  indicators,
  indicatorToSpecimenTypesMap,
  testRequestId,
  contractNumber,
  defaultIndicatorGroupId,
  defaultSpecimenTypeId,
  onCreated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const items: IndicatorItem[] =
    Form.useWatch("indicators", form) || [];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      indicatorGroupId: defaultIndicatorGroupId,
      indicators: [
        {
          specimenTypeId: defaultSpecimenTypeId,
          name: "",
          formattedName: "",
          unitPrice: 0,
          subIndicators: [],
        },
      ],
    });
  }, [open, defaultIndicatorGroupId, defaultSpecimenTypeId, form]);

  const specimenTypeOptions = useMemo(
    () =>
      specimenTypes
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.id, label: s.name })),
    [specimenTypes]
  );

  const groupOptions = useMemo(
    () =>
      indicatorGroups
        .filter((g) => g.isActive)
        .map((g) => ({ value: g.id, label: g.name })),
    [indicatorGroups]
  );

  const laboratoryOptions = useMemo(() => {
    const VISIBLE_LABS = ["lab vi sinh", "lab hóa"];
    return (laboratories || [])
      .filter((lab) => lab.isActive && VISIBLE_LABS.includes(lab.name.toLowerCase()))
      .map((lab) => ({
        value: lab.id,
        label: lab.name,
      }));
  }, [laboratories]);

  const getExistingNamesForSpecimenType = useCallback(
    (specimenTypeId?: string): Set<string> => {
      if (!specimenTypeId) return new Set();
      const names = new Set<string>();
      indicators.forEach((ind) => {
        const linked = indicatorToSpecimenTypesMap[ind.id] || [];
        if (linked.some((s) => s.id === specimenTypeId)) {
          names.add((ind.name || "").trim().normalize("NFC").toLowerCase());
        }
      });
      return names;
    },
    [indicators, indicatorToSpecimenTypesMap]
  );

  const updateItem = useCallback(
    (index: number, patch: Partial<IndicatorItem>) => {
      const current: IndicatorItem[] =
        form.getFieldValue("indicators") || [];
      form.setFieldsValue({
        indicators: current.map((item, i) =>
          i === index ? { ...item, ...patch } : item
        ),
      });
    },
    [form]
  );

  const handleAddParent = useCallback(() => {
    const current: IndicatorItem[] =
      form.getFieldValue("indicators") || [];
    form.setFieldsValue({
      indicators: [
        ...current,
        {
          specimenTypeId: defaultSpecimenTypeId,
          name: "",
          formattedName: "",
          unitPrice: 0,
          subIndicators: [],
        },
      ],
    });
  }, [form, defaultSpecimenTypeId]);

  const handleRemoveParent = useCallback(
    (index: number) => {
      const current: IndicatorItem[] =
        form.getFieldValue("indicators") || [];
      form.setFieldsValue({
        indicators: current.filter((_, i) => i !== index),
      });
    },
    [form]
  );

  const handleAddSubIndicator = useCallback(
    (parentIndex: number) => {
      const current: IndicatorItem[] =
        form.getFieldValue("indicators") || [];
      form.setFieldsValue({
        indicators: current.map((item, i) =>
          i === parentIndex
            ? {
                ...item,
                subIndicators: [
                  ...(item.subIndicators || []),
                  { name: "", formattedName: "" },
                ],
              }
            : item
        ),
      });
    },
    [form]
  );

  const handleRemoveSubIndicator = useCallback(
    (parentIndex: number, subIndex: number) => {
      const current: IndicatorItem[] =
        form.getFieldValue("indicators") || [];
      form.setFieldsValue({
        indicators: current.map((item, i) =>
          i === parentIndex
            ? {
                ...item,
                subIndicators: item.subIndicators.filter(
                  (_, si) => si !== subIndex
                ),
              }
            : item
        ),
      });
    },
    [form]
  );

  const handleUpdateParentName = useCallback(
    (index: number, html: string, plainText: string) => {
      updateItem(index, { name: plainText, formattedName: html });
    },
    [updateItem]
  );

  const handleUpdateSubName = useCallback(
    (parentIndex: number, subIndex: number, html: string, plainText: string) => {
      const current: IndicatorItem[] =
        form.getFieldValue("indicators") || [];
      form.setFieldsValue({
        indicators: current.map((item, i) => {
          if (i !== parentIndex) return item;
          const subs = [...item.subIndicators];
          subs[subIndex] = { name: plainText, formattedName: html };
          return { ...item, subIndicators: subs };
        }),
      });
    },
    [form]
  );

  const getDuplicateError = useCallback(
    (item: IndicatorItem): string | undefined => {
      const name = (item.name || "").trim().normalize("NFC").toLowerCase();
      if (!name || !item.specimenTypeId) return undefined;
      const existing = getExistingNamesForSpecimenType(item.specimenTypeId);
      if (existing.has(name)) return "Chỉ tiêu này đã tồn tại trong nền mẫu";
      return undefined;
    },
    [getExistingNamesForSpecimenType]
  );

  const getMatchedIndicators = useCallback(
    (specimenTypeId?: string, keyword?: string): IndicatorDto[] => {
      if (!specimenTypeId || !keyword || keyword.trim().length < 2) return [];
      const normalized = keyword.trim().normalize("NFC").toLowerCase();
      return indicators
        .filter((ind) => {
          const linked = indicatorToSpecimenTypesMap[ind.id] || [];
          if (!linked.some((s) => s.id === specimenTypeId)) return false;
          const indName = (ind.name || "").trim().normalize("NFC").toLowerCase();
          return indName.includes(normalized) && indName !== normalized;
        })
        .slice(0, 5);
    },
    [indicators, indicatorToSpecimenTypesMap]
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const allItems = values.indicators as IndicatorItem[];

      const errors: string[] = [];
      let hasAnyName = false;

      allItems.forEach((item, index) => {
        const rowNum = index + 1;
        const hasName = !!item.name?.trim();
        const hasSubs = (item.subIndicators || []).some((s) => s.name?.trim());

        if (!hasName && !hasSubs && !item.specimenTypeId) return;

        if (!hasName) {
          errors.push(`Dòng ${rowNum}: Chưa nhập tên chỉ tiêu`);
        } else {
          hasAnyName = true;
        }

        if (!item.specimenTypeId) {
          errors.push(`Dòng ${rowNum}: Chưa chọn nền mẫu`);
        }

        const dupErr = getDuplicateError(item);
        if (dupErr) {
          errors.push(`Dòng ${rowNum}: ${dupErr}`);
        }

        (item.subIndicators || []).forEach((sub, si) => {
          if (!sub.name?.trim()) {
            errors.push(`Dòng ${rowNum}, chỉ tiêu phụ ${si + 1}: Chưa nhập tên`);
          }
        });
      });

      if (!hasAnyName && errors.length === 0) {
        message.warning("Vui lòng nhập ít nhất 1 chỉ tiêu");
        return;
      }

      if (errors.length > 0) {
        message.error(errors[0]);
        return;
      }

      const validItems = allItems.filter((item) => item.name?.trim());

      setLoading(true);

      const priceMap: Record<string, number> = {};
      validItems.forEach((item) => {
        const key = `${item.specimenTypeId}_${item.name.trim()}`;
        priceMap[key] = item.unitPrice || 0;
      });

      const result = await testRequestService.quickCreateIndicators({
        indicatorGroupId: values.indicatorGroupId,
        laboratoryId: values.laboratoryId,
        testRequestId,
        contractNumber,
        indicators: validItems.map((item) => ({
          specimenTypeId: item.specimenTypeId!,
          name: item.name.trim(),
          formattedName: item.formattedName || undefined,
          unitPrice: item.unitPrice || 0,
          subIndicators: (item.subIndicators || [])
            .filter((sub) => sub.name?.trim())
            .map((sub) => ({
              name: sub.name.trim(),
              formattedName: sub.formattedName || undefined,
            })),
        })),
      });

      const totalCount = result.results.reduce(
        (sum, r) => sum + 1 + r.subIndicatorResults.length,
        0
      );

      const finalPrices: Record<string, number> = {};
      result.results.forEach((r) => {
        const priceKey = `${r.specimenTypeId}_${r.indicator.name}`;
        finalPrices[r.indicator.id] = priceMap[priceKey] || 0;
      });

      onCreated(result, finalPrices);

      message.success(`Đã thêm ${totalCount} chỉ tiêu mới`);

      onCancel();
    } catch (error: any) {
      if (error?.errorFields) return;
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thêm chỉ tiêu mới";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="bulk-create-modal"
      zIndex={1100}
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
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Thêm tất cả"
      cancelText="Hủy"
      width={960}
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
          rules={[{ required: true, message: "Vui lòng chọn nhóm chỉ tiêu" }]}
        >
          <Select
            placeholder="Chọn nhóm cho tất cả chỉ tiêu"
            showSearch
            optionFilterProp="label"
            options={groupOptions}
          />
        </Form.Item>

        <Form.Item
          name="laboratoryId"
          label="Khoa phòng thực hiện"
          rules={[{ required: true, message: "Vui lòng chọn khoa phòng" }]}
        >
          <Select
            placeholder="Chọn khoa phòng thực hiện"
            showSearch
            optionFilterProp="label"
            options={laboratoryOptions}
          />
        </Form.Item>

        <Form.Item name="indicators" hidden>
          <input type="hidden" />
        </Form.Item>

        <Card size="small" style={{ marginBottom: 16 }}>
          {items.map((indicator, parentIndex) => {
            const duplicateErr = getDuplicateError(indicator);
            return (
              <div
                key={parentIndex}
                style={{
                  marginBottom:
                    parentIndex === items.length - 1 ? 0 : 24,
                }}
              >
                <Row gutter={8} align="top" wrap={false}>
                  <Col flex="32px" style={{ paddingTop: 4 }}>
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
                      placeholder="Chọn nền mẫu *"
                      showSearch
                      optionFilterProp="label"
                      options={specimenTypeOptions}
                      value={indicator.specimenTypeId || undefined}
                      onChange={(val) =>
                        updateItem(parentIndex, { specimenTypeId: val })
                      }
                      style={{ width: "100%" }}
                      status={
                        indicator.name?.trim() && !indicator.specimenTypeId
                          ? "error"
                          : undefined
                      }
                    />
                  </Col>
                  <Col flex="auto">
                    <div
                      className={`bulk-modal-parent-wrapper ${(indicator.subIndicators || []).length > 0 ? "has-children" : ""}`}
                      style={{ position: "relative" }}
                    >
                      <RichTextEditor
                        value={indicator.formattedName || ""}
                        onChange={(html, plainText) =>
                          handleUpdateParentName(parentIndex, html, plainText)
                        }
                        placeholder="Nhập tên chỉ tiêu cha"
                      />
                      {(() => {
                        if (duplicateErr) {
                          return (
                            <Tooltip title={duplicateErr} color="#ff4d4f">
                              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 1, cursor: "pointer", display: "flex" }}>
                                <Icon name="exclamation-circle-fill" style={{ color: "#ff4d4f", fontSize: 14 }} />
                              </span>
                            </Tooltip>
                          );
                        }
                        const suggestions = getMatchedIndicators(indicator.specimenTypeId, indicator.name);
                        if (suggestions.length === 0) return null;
                        return (
                          <Tooltip
                            title={
                              <div>
                                <div style={{ marginBottom: 4 }}>Chỉ tiêu tương tự đã tồn tại:</div>
                                {suggestions.map((ind) => (
                                  <div key={ind.id}>
                                    • <IndicatorName name={ind.name} formattedName={ind.formattedName} />
                                  </div>
                                ))}
                              </div>
                            }
                          >
                            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 1, cursor: "pointer", display: "flex" }}>
                              <Icon name="exclamation-triangle-fill" style={{ color: "#faad14", fontSize: 14 }} />
                            </span>
                          </Tooltip>
                        );
                      })()}
                    </div>
                  </Col>
                  <Col flex="140px">
                    <InputNumber
                      min={0}
                      value={indicator.unitPrice || 0}
                      onChange={(val) =>
                        updateItem(parentIndex, { unitPrice: val || 0 })
                      }
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) =>
                        Number(value?.replace(/,/g, "") || 0)
                      }
                      addonAfter="đ"
                    />
                  </Col>
                  <Col flex="32px">
                    {items.length > 1 && (
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

                {(indicator.subIndicators || []).length > 0 && (
                  <Row gutter={8} style={{ marginTop: 12 }}>
                    <Col flex="32px" />
                    <Col flex="200px" />
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
                              marginBottom:
                                subIndex ===
                                indicator.subIndicators.length - 1
                                  ? 0
                                  : 12,
                            }}
                          >
                            <Col flex="auto">
                              <div
                                className={`bulk-modal-sub-wrapper ${subIndex === 0 ? "is-first" : ""} ${subIndex === indicator.subIndicators.length - 1 ? "is-last" : ""}`}
                              >
                                <RichTextEditor
                                  value={sub.formattedName || ""}
                                  onChange={(html, plainText) =>
                                    handleUpdateSubName(
                                      parentIndex,
                                      subIndex,
                                      html,
                                      plainText
                                    )
                                  }
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
                                  onClick={() =>
                                    handleRemoveSubIndicator(
                                      parentIndex,
                                      subIndex
                                    )
                                  }
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
                    <Col flex="140px" />
                    <Col flex="32px" />
                  </Row>
                )}
              </div>
            );
          })}
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

export default QuickCreateIndicatorModal;
