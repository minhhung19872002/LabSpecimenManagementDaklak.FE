import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  InputNumber,
  Button,
  Typography,
  Select,
  Row,
  Col,
  Tooltip,
  Card,
  message,
} from "antd";
import Icon from "../../../../components/common/Icon";
import {
  IndicatorDto,
  IndicatorGroupDto,
  SpecimenTypeDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import "./AddIndicatorsModal.css";

const { Text } = Typography;

// Existing indicator key for duplicate check
interface ExistingIndicatorKey {
  indicatorId: string;
  specimenTypeId?: string;
}

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  specimenTypes: SpecimenTypeDto[];
  existingIndicatorKeys?: ExistingIndicatorKey[];
  getSpecimenTypesByIndicator: (indicatorId: string) => SpecimenTypeDto[];
  onOk: (data: { indicatorId: string; specimenTypeId: string; unitPrice: number }[]) => void;
  onCancel: () => void;
}

// Internal state for each indicator row - chỉ lưu parent, sub-indicators tự động hiển thị read-only
interface IndicatorRow {
  id: string; // unique key for React
  indicatorId: string | undefined;
  specimenTypeId: string | undefined;
  unitPrice: number;
}

// UUID generator - tries crypto.randomUUID() first, falls back to crypto.getRandomValues()
function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r =
        (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >>
        (c === "x" ? 0 : 3);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

// Generate unique ID
const generateId = () => generateUUID();

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  indicatorGroups,
  indicatorsByGroup,
  specimenTypes,
  existingIndicatorKeys = [],
  getSpecimenTypesByIndicator,
  onOk,
  onCancel,
}) => {
  // Controlled state for all indicator rows
  const [rows, setRows] = useState<IndicatorRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build specimen type options for a specific indicator
  // Only returns specimen types that have this indicator linked (from SpecimenTypeIndicator)
  const buildSpecimenTypeOptions = (indicatorId: string | undefined) => {
    if (!indicatorId) return [];

    const availableSpecimenTypes = getSpecimenTypesByIndicator(indicatorId);
    return availableSpecimenTypes.map(st => ({
      value: st.id,
      label: `${st.code} - ${st.name}`,
    }));
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRows([createEmptyRow()]);
      setErrors({});
    }
  }, [open]);

  // Create empty row
  const createEmptyRow = (): IndicatorRow => ({
    id: generateId(),
    indicatorId: undefined,
    specimenTypeId: undefined,
    unitPrice: 0,
  });

  // Get all selected indicator keys (indicatorId + specimenTypeId) to filter out from options
  // Now we allow same indicator with different specimenType
  const selectedIndicatorKeys = useMemo(() => {
    return rows
      .filter((row) => row.indicatorId)
      .map((row) => ({
        indicatorId: row.indicatorId!,
        specimenTypeId: row.specimenTypeId,
      }));
  }, [rows]);

  // Check if an indicator + specimenType combination already exists in the test method
  // Note: Only check in existingIndicatorKeys, not in current rows (that's handled separately in handleSubmit)
  const isKeyExisting = (indicatorId: string, specimenTypeId?: string): boolean => {
    // Check in existing indicators from test method
    // Need to handle null vs undefined comparison
    return existingIndicatorKeys.some(
      (key) => key.indicatorId === indicatorId &&
        (key.specimenTypeId || null) === (specimenTypeId || null)
    );
  };

  // Find indicator by ID
  const findIndicatorById = (indicatorId: string): IndicatorDto | undefined => {
    const allIndicators = Object.values(indicatorsByGroup).flat();
    const parent = allIndicators.find((ind) => ind.id === indicatorId);
    if (parent) return parent;
    for (const ind of allIndicators) {
      const sub = ind.subIndicators?.find((s) => s.id === indicatorId);
      if (sub) return sub as IndicatorDto;
    }
    return undefined;
  };

  // Get active sub-indicators of a parent indicator
  const getParentSubIndicators = (
    parentIndicatorId: string,
  ): IndicatorDto[] => {
    const allIndicators = Object.values(indicatorsByGroup).flat();
    const parent = allIndicators.find((ind) => ind.id === parentIndicatorId);
    return parent?.subIndicators?.filter((sub) => sub.isActive) || [];
  };

  // Build parent options for Select
  // Now we don't filter out indicators - same indicator can be added with different specimenType
  const buildParentOptions = () => {
    return indicatorGroups
      .filter(
        (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0,
      )
      .map((group) => {
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => !ind.parentIndicatorId && ind.isActive,
        );

        if (parentIndicators.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: parentIndicators.map((ind) => ({
            value: ind.id,
            label: (
              <span>
                {ind.code} -{" "}
                <IndicatorName
                  name={ind.name}
                  formattedName={ind.formattedName}
                />
              </span>
            ),
            searchText: `${ind.code} - ${ind.name}`,
          })),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // Render label for selected indicator
  const renderIndicatorLabel = (indicatorId: string) => {
    const indicator = findIndicatorById(indicatorId);
    if (!indicator) return indicatorId;
    return (
      <span>
        {indicator.code} -{" "}
        <IndicatorName
          name={indicator.name}
          formattedName={indicator.formattedName}
        />
      </span>
    );
  };

  // Handle parent indicator change
  const handleParentChange = (
    rowIndex: number,
    indicatorId: string | undefined,
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      const currentRow = updated[rowIndex];

      // Check if current specimenType is still valid for the new indicator
      let newSpecimenTypeId = currentRow.specimenTypeId;
      if (indicatorId && newSpecimenTypeId) {
        const availableSpecimenTypes = getSpecimenTypesByIndicator(indicatorId);
        const isStillValid = availableSpecimenTypes.some(st => st.id === newSpecimenTypeId);
        if (!isStillValid) {
          newSpecimenTypeId = undefined; // Clear if not valid
        }
      } else if (!indicatorId) {
        newSpecimenTypeId = undefined; // Clear if no indicator selected
      }

      updated[rowIndex] = {
        ...currentRow,
        indicatorId,
        specimenTypeId: newSpecimenTypeId,
      };
      return updated;
    });
    // Clear error for this row
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${rowIndex}`];
      return updated;
    });
  };

  // Handle parent unit price change
  const handleParentPriceChange = (rowIndex: number, price: number | null) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        unitPrice: price ?? 0,
      };
      return updated;
    });
  };

  // Handle specimen type change
  const handleSpecimenTypeChange = (rowIndex: number, specimenTypeId: string | undefined) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        specimenTypeId,
      };
      return updated;
    });
    // Clear error for this row
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${rowIndex}`];
      return updated;
    });
  };

  // Add new parent row
  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  // Remove parent row
  const handleRemoveRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  // Validate and submit - chỉ gửi parent indicators, không gửi sub-indicators
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const flatIndicators: { indicatorId: string; specimenTypeId: string; unitPrice: number }[] = [];
    const addedKeys = new Set<string>();

    rows.forEach((row, rowIndex) => {
      // Validate parent indicator
      if (!row.indicatorId) {
        newErrors[`row-${rowIndex}`] = "Chọn chỉ tiêu";
        return;
      }

      // Validate specimen type - bắt buộc
      if (!row.specimenTypeId) {
        newErrors[`row-${rowIndex}-specimenType`] = "Chọn nền mẫu";
        return;
      }

      // Check duplicate in existing indicators
      if (isKeyExisting(row.indicatorId, row.specimenTypeId)) {
        newErrors[`row-${rowIndex}`] = "Chỉ tiêu với nền mẫu này đã tồn tại";
        return;
      }

      // Check duplicate in current submission
      const key = `${row.indicatorId}|${row.specimenTypeId}`;
      if (addedKeys.has(key)) {
        newErrors[`row-${rowIndex}`] = "Trùng với dòng khác";
        return;
      }
      addedKeys.add(key);

      // Add parent indicator only
      flatIndicators.push({
        indicatorId: row.indicatorId,
        specimenTypeId: row.specimenTypeId,
        unitPrice: row.unitPrice,
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      message.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (flatIndicators.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    onOk(flatIndicators);
  };

  // Handle cancel
  const handleCancel = () => {
    setRows([]);
    setErrors({});
    onCancel();
  };

  return (
    <Modal
      className="add-indicators-modal"
      title="Thêm chỉ tiêu"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={900}
      centered
      destroyOnHidden
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        {rows.map((row, rowIndex) => {
          // Lấy danh sách sub-indicators của parent đã chọn (nếu có)
          const subIndicators = row.indicatorId
            ? getParentSubIndicators(row.indicatorId)
            : [];
          const hasSubIndicators = subIndicators.length > 0;

          return (
            <div
              key={row.id}
              style={{
                marginBottom: rowIndex === rows.length - 1 ? 0 : 24,
              }}
            >
              {/* Parent indicator row */}
              <Row gutter={8} align="top" wrap={false}>
                <Col flex="1 1 40%">
                  <Select
                    value={row.indicatorId}
                    onChange={(value) => handleParentChange(rowIndex, value)}
                    options={buildParentOptions()}
                    placeholder="Tìm và chọn chỉ tiêu"
                    showSearch
                    popupMatchSelectWidth={400}
                    optionLabelProp="label"
                    labelRender={({ value }) => {
                      if (!value) return null;
                      return renderIndicatorLabel(value as string);
                    }}
                    filterOption={(inputValue, option) => {
                      const searchText = (option as { searchText?: string })
                        ?.searchText;
                      if (!searchText) return false;
                      return searchText
                        .toLowerCase()
                        .includes(inputValue.toLowerCase());
                    }}
                    allowClear
                    status={errors[`row-${rowIndex}`] ? "error" : undefined}
                    style={{ width: "100%" }}
                  />
                  {errors[`row-${rowIndex}`] && (
                    <div
                      style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}
                    >
                      {errors[`row-${rowIndex}`]}
                    </div>
                  )}
                </Col>
                <Col flex="0 0 180px">
                  <Select
                    value={row.specimenTypeId}
                    onChange={(value) => handleSpecimenTypeChange(rowIndex, value)}
                    options={buildSpecimenTypeOptions(row.indicatorId)}
                    placeholder={row.indicatorId ? "Chọn nền mẫu *" : "Chọn chỉ tiêu trước"}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    allowClear
                    disabled={!row.indicatorId}
                    status={errors[`row-${rowIndex}-specimenType`] ? "error" : undefined}
                    style={{ width: "100%" }}
                  />
                  {errors[`row-${rowIndex}-specimenType`] && (
                    <div
                      style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}
                    >
                      {errors[`row-${rowIndex}-specimenType`]}
                    </div>
                  )}
                </Col>
                <Col flex="0 0 140px">
                  <InputNumber<number>
                    value={row.unitPrice}
                    onChange={(value) =>
                      handleParentPriceChange(rowIndex, value)
                    }
                    placeholder="Đơn giá"
                    min={0}
                    precision={0}
                    controls={false}
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => {
                      const parsed = parseInt(
                        value?.replace(/[^\d]/g, "") || "0",
                        10,
                      );
                      return Math.max(0, parsed);
                    }}
                    addonAfter="đ"
                  />
                </Col>
                <Col flex="32px">
                  {rows.length > 1 && (
                    <Tooltip title="Xóa chỉ tiêu">
                      <Icon
                        name="trash3"
                        onClick={() => handleRemoveRow(rowIndex)}
                        style={{
                          fontSize: 16,
                          color: "#CF1322",
                          cursor: "pointer",
                          marginTop: 8,
                        }}
                      />
                    </Tooltip>
                  )}
                </Col>
              </Row>

              {/* Sub-indicators - Auto display, read-only */}
              {hasSubIndicators && (
                <div
                  style={{
                    marginTop: 8,
                    paddingLeft: 20,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingRight: 8,
                    position: "relative",
                    backgroundColor: "#FAFAFA",
                    borderRadius: 4,
                  }}
                >
                  {subIndicators.map((sub, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === subIndicators.length - 1;
                    return (
                      <div
                        key={sub.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: 14,
                          paddingTop: 4,
                          paddingBottom: 4,
                          position: "relative",
                        }}
                      >
                        {/* Vertical line segment */}
                        <div
                          style={{
                            position: "absolute",
                            left: -12,
                            top: isFirst ? -16 : 0,
                            bottom: isLast ? "50%" : 0,
                            width: 1,
                            backgroundColor: "#D9D9D9",
                          }}
                        />
                        {/* Horizontal connector */}
                        <div
                          style={{
                            position: "absolute",
                            left: -12,
                            top: "50%",
                            width: 12,
                            height: 1,
                            backgroundColor: "#D9D9D9",
                          }}
                        />
                        <span
                          style={{
                            marginRight: 6,
                            paddingLeft: 8,
                          }}
                        >
                          {sub.code}
                        </span>
                        <span>
                          <IndicatorName
                            name={sub.name}
                            formattedName={sub.formattedName}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Add row button */}
      <Button
        type="default"
        onClick={handleAddRow}
        icon={<Icon name="plus-lg" />}
        style={{ marginBottom: 12 }}
      >
        Thêm dòng
      </Button>
    </Modal>
  );
};

export default AddIndicatorsModal;
