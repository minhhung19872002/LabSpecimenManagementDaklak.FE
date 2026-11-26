import React, { useState, useEffect } from "react";
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
import { withUngroupedGroup } from "../../../../utils/indicatorGroups";
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
  getSpecimenTypesByIndicator?: (indicatorId: string) => SpecimenTypeDto[]; // Kept for backward compatibility
  getIndicatorsBySpecimenType: (specimenTypeId: string) => IndicatorDto[];
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
  getIndicatorsBySpecimenType,
  onOk,
  onCancel,
}) => {
  // Controlled state for all indicator rows
  const [rows, setRows] = useState<IndicatorRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build specimen type options (all active specimen types)
  const buildSpecimenTypeOptions = () => {
    return specimenTypes
      .filter(st => st.isActive)
      .map(st => ({
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

  // Build parent options for Select - filtered by specimen type
  // Also filters out indicators already selected with same specimenType or existing in test method
  const buildParentOptions = (specimenTypeId: string | undefined, currentRowIndex?: number) => {
    if (!specimenTypeId) return [];

    // Get indicators available for this specimen type
    const availableIndicators = getIndicatorsBySpecimenType(specimenTypeId);
    const availableIndicatorIds = new Set(availableIndicators.map(ind => ind.id));

    // Get indicator IDs already selected with this specimenType in OTHER rows
    const selectedWithSameSpecimenType = new Set(
      rows
        .filter((row, idx) => idx !== currentRowIndex && row.indicatorId && row.specimenTypeId === specimenTypeId)
        .map(row => row.indicatorId!)
    );

    // Get indicator IDs already existing in test method with this specimenType
    const existingWithSameSpecimenType = new Set(
      existingIndicatorKeys
        .filter(key => key.specimenTypeId === specimenTypeId)
        .map(key => key.indicatorId)
    );

    return withUngroupedGroup(indicatorGroups)
      .filter(
        (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0,
      )
      .map((group) => {
        // Filter parent indicators that are:
        // 1. Available for this specimen type
        // 2. Not already selected with same specimenType in other rows
        // 3. Not already existing in test method with same specimenType
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) =>
            !ind.parentIndicatorId &&
            ind.isActive &&
            availableIndicatorIds.has(ind.id) &&
            !selectedWithSameSpecimenType.has(ind.id) &&
            !existingWithSameSpecimenType.has(ind.id),
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

  // Handle indicator change (indicator is selected after specimen type)
  const handleIndicatorChange = (
    rowIndex: number,
    indicatorId: string | undefined,
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        indicatorId,
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

  // Handle specimen type change (specimen type is selected first)
  // When specimen type changes, clear indicator if it's not valid for new specimen type
  const handleSpecimenTypeChange = (rowIndex: number, specimenTypeId: string | undefined) => {
    setRows((prev) => {
      const updated = [...prev];
      const currentRow = updated[rowIndex];

      // Check if current indicator is still valid for the new specimen type
      let newIndicatorId = currentRow.indicatorId;
      if (specimenTypeId && newIndicatorId) {
        const availableIndicators = getIndicatorsBySpecimenType(specimenTypeId);
        const isStillValid = availableIndicators.some(ind => ind.id === newIndicatorId);
        if (!isStillValid) {
          newIndicatorId = undefined; // Clear if not valid
        }
      } else if (!specimenTypeId) {
        newIndicatorId = undefined; // Clear if no specimen type selected
      }

      updated[rowIndex] = {
        ...currentRow,
        specimenTypeId,
        indicatorId: newIndicatorId,
      };
      return updated;
    });
    // Clear errors for this row
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${rowIndex}`];
      delete updated[`row-${rowIndex}-specimenType`];
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
              {/* Row: Nền mẫu -> Chỉ tiêu -> Đơn giá */}
              <Row gutter={8} align="top" wrap={false}>
                <Col flex="0 0 200px">
                  <Select
                    value={row.specimenTypeId}
                    onChange={(value) => handleSpecimenTypeChange(rowIndex, value)}
                    options={buildSpecimenTypeOptions()}
                    placeholder="Chọn nền mẫu *"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    allowClear
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
                <Col flex="1 1 40%">
                  <Select
                    value={row.indicatorId}
                    onChange={(value) => handleIndicatorChange(rowIndex, value)}
                    options={buildParentOptions(row.specimenTypeId, rowIndex)}
                    placeholder={row.specimenTypeId ? "Tìm và chọn chỉ tiêu" : "Chọn nền mẫu trước"}
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
                    disabled={!row.specimenTypeId}
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
