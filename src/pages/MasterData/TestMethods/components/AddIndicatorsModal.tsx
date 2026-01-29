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
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import "./AddIndicatorsModal.css";

const { Text } = Typography;

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  existingIndicatorIds?: string[];
  onOk: (data: { indicatorId: string; unitPrice: number }[]) => void;
  onCancel: () => void;
}

// Internal state for each indicator row - chỉ lưu parent, sub-indicators tự động hiển thị read-only
interface IndicatorRow {
  id: string; // unique key for React
  indicatorId: string | undefined;
  unitPrice: number;
}

// Generate unique ID
const generateId = () => crypto.randomUUID();

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  indicatorGroups,
  indicatorsByGroup,
  existingIndicatorIds = [],
  onOk,
  onCancel,
}) => {
  // Controlled state for all indicator rows
  const [rows, setRows] = useState<IndicatorRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    unitPrice: 0,
  });

  // Get all selected indicator IDs (to filter out from options)
  const selectedIndicatorIds = useMemo(() => {
    const ids = new Set<string>();
    rows.forEach((row) => {
      if (row.indicatorId) ids.add(row.indicatorId);
    });
    return ids;
  }, [rows]);

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
  const buildParentOptions = (currentIndicatorId?: string) => {
    return indicatorGroups
      .filter(
        (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0,
      )
      .map((group) => {
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => !ind.parentIndicatorId && ind.isActive,
        );

        const availableParents = parentIndicators.filter(
          (ind) =>
            ind.id === currentIndicatorId ||
            (!selectedIndicatorIds.has(ind.id) &&
              !existingIndicatorIds.includes(ind.id)),
        );

        if (availableParents.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableParents.map((ind) => ({
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
    const flatIndicators: { indicatorId: string; unitPrice: number }[] = [];

    rows.forEach((row, rowIndex) => {
      // Validate parent indicator
      if (!row.indicatorId) {
        newErrors[`row-${rowIndex}`] = "Chọn chỉ tiêu";
        return;
      }

      // Add parent indicator only
      flatIndicators.push({
        indicatorId: row.indicatorId,
        unitPrice: row.unitPrice,
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      message.error("Vui lòng điền đầy đủ thông tin");
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
      width={700}
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
                <Col flex="auto">
                  <Select
                    value={row.indicatorId}
                    onChange={(value) => handleParentChange(rowIndex, value)}
                    options={buildParentOptions(row.indicatorId)}
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
                <Col flex="140px">
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
                          fontSize: 13,
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
                        <span style={{ color: "#595959", marginRight: 6 }}>
                          {sub.code}
                        </span>
                        <span style={{ color: "#8C8C8C" }}>
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
