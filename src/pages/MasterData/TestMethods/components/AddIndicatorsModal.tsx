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

// Internal state for each indicator row
interface IndicatorRow {
  id: string; // unique key for React
  indicatorId: string | undefined;
  unitPrice: number;
  subIndicators: SubIndicatorRow[];
}

interface SubIndicatorRow {
  id: string;
  indicatorId: string | undefined;
  unitPrice: number | undefined;
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
    subIndicators: [],
  });

  // Create empty sub-indicator row
  const createEmptySubRow = (): SubIndicatorRow => ({
    id: generateId(),
    indicatorId: undefined,
    unitPrice: undefined,
  });

  // Get all selected indicator IDs (to filter out from options)
  const selectedIndicatorIds = useMemo(() => {
    const ids = new Set<string>();
    rows.forEach((row) => {
      if (row.indicatorId) ids.add(row.indicatorId);
      row.subIndicators.forEach((sub) => {
        if (sub.indicatorId) ids.add(sub.indicatorId);
      });
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

  // Check if parent indicator has sub-indicators
  const getParentSubIndicators = (parentIndicatorId: string): IndicatorDto[] => {
    const allIndicators = Object.values(indicatorsByGroup).flat();
    const parent = allIndicators.find((ind) => ind.id === parentIndicatorId);
    return parent?.subIndicators?.filter((sub) => sub.isActive) || [];
  };

  // Build parent options for Select
  const buildParentOptions = (currentIndicatorId?: string) => {
    return indicatorGroups
      .filter(
        (group) => group.isActive && indicatorsByGroup[group.id]?.length > 0
      )
      .map((group) => {
        const parentIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) => !ind.parentIndicatorId && ind.isActive
        );

        const availableParents = parentIndicators.filter(
          (ind) =>
            ind.id === currentIndicatorId ||
            (!selectedIndicatorIds.has(ind.id) &&
              !existingIndicatorIds.includes(ind.id))
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

  // Build sub-indicator options
  const buildSubOptions = (
    parentIndicatorId: string,
    rowIndex: number,
    currentSubIndicatorId?: string
  ) => {
    const availableSubs = getParentSubIndicators(parentIndicatorId);
    const row = rows[rowIndex];
    const selectedSubIds = row.subIndicators
      .map((sub) => sub.indicatorId)
      .filter(Boolean) as string[];

    return availableSubs
      .filter(
        (sub) =>
          sub.id === currentSubIndicatorId ||
          (!selectedSubIds.includes(sub.id) &&
            !existingIndicatorIds.includes(sub.id))
      )
      .map((sub) => ({
        value: sub.id,
        label: (
          <span>
            {sub.code} -{" "}
            <IndicatorName name={sub.name} formattedName={sub.formattedName} />
          </span>
        ),
        searchText: `${sub.code} - ${sub.name}`,
      }));
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
  const handleParentChange = (rowIndex: number, indicatorId: string | undefined) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        indicatorId,
        subIndicators: [], // Clear sub-indicators when parent changes
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

  // Add sub-indicator row
  const handleAddSubIndicator = (rowIndex: number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        subIndicators: [...updated[rowIndex].subIndicators, createEmptySubRow()],
      };
      return updated;
    });
  };

  // Remove sub-indicator row
  const handleRemoveSubIndicator = (rowIndex: number, subIndex: number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        subIndicators: updated[rowIndex].subIndicators.filter(
          (_, i) => i !== subIndex
        ),
      };
      return updated;
    });
  };

  // Handle sub-indicator change
  const handleSubIndicatorChange = (
    rowIndex: number,
    subIndex: number,
    indicatorId: string | undefined
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      const subIndicators = [...updated[rowIndex].subIndicators];
      subIndicators[subIndex] = {
        ...subIndicators[subIndex],
        indicatorId,
      };
      updated[rowIndex] = {
        ...updated[rowIndex],
        subIndicators,
      };
      return updated;
    });
    // Clear error
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`row-${rowIndex}-sub-${subIndex}`];
      return updated;
    });
  };

  // Handle sub-indicator price change
  const handleSubPriceChange = (
    rowIndex: number,
    subIndex: number,
    price: number | null
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      const subIndicators = [...updated[rowIndex].subIndicators];
      subIndicators[subIndex] = {
        ...subIndicators[subIndex],
        unitPrice: price ?? undefined,
      };
      updated[rowIndex] = {
        ...updated[rowIndex],
        subIndicators,
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

  // Validate and submit
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const flatIndicators: { indicatorId: string; unitPrice: number }[] = [];

    rows.forEach((row, rowIndex) => {
      // Validate parent indicator
      if (!row.indicatorId) {
        newErrors[`row-${rowIndex}`] = "Chọn chỉ tiêu";
        return;
      }

      // Add parent indicator
      flatIndicators.push({
        indicatorId: row.indicatorId,
        unitPrice: row.unitPrice,
      });

      // Validate and add sub-indicators
      row.subIndicators.forEach((sub, subIndex) => {
        if (!sub.indicatorId) {
          newErrors[`row-${rowIndex}-sub-${subIndex}`] = "Chọn chỉ tiêu phụ";
        } else {
          flatIndicators.push({
            indicatorId: sub.indicatorId,
            unitPrice: sub.unitPrice ?? 0,
          });
        }
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
          const parentSubs = row.indicatorId
            ? getParentSubIndicators(row.indicatorId)
            : [];
          const hasAvailableSubs = parentSubs.length > 0;
          const hasSubRows = row.subIndicators.length > 0;

          return (
            <div
              key={row.id}
              style={{
                marginBottom: rowIndex === rows.length - 1 ? 0 : 24,
              }}
            >
              {/* Parent indicator row */}
              <Row gutter={8} align="top" wrap={false}>
                <Col flex="32px">
                  {hasAvailableSubs ? (
                    <Tooltip title="Thêm chỉ tiêu phụ">
                      <Icon
                        name="plus-lg"
                        onClick={() => handleAddSubIndicator(rowIndex)}
                        style={{
                          fontSize: 16,
                          color: "#8C8C8C",
                          cursor: "pointer",
                          marginTop: 8,
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <div style={{ width: 16 }} />
                  )}
                </Col>
                <Col flex="auto">
                  <div
                    className={`add-indicators-parent-wrapper ${hasSubRows ? "has-children" : ""}`}
                  >
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
                      <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                        {errors[`row-${rowIndex}`]}
                      </div>
                    )}
                  </div>
                </Col>
                <Col flex="140px">
                  <InputNumber<number>
                    value={row.unitPrice}
                    onChange={(value) => handleParentPriceChange(rowIndex, value)}
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
                        10
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

              {/* Sub-indicators */}
              {hasSubRows && (
                <Row gutter={8} style={{ marginTop: 12 }}>
                  <Col flex="32px" />
                  <Col flex="auto">
                    <div
                      style={{
                        padding: "12px 12px 12px 32px",
                        background: "#F5F5F5",
                        borderRadius: "12px",
                      }}
                    >
                      {row.subIndicators.map((sub, subIndex) => (
                        <Row
                          key={sub.id}
                          gutter={8}
                          align="top"
                          wrap={false}
                          style={{
                            marginBottom:
                              subIndex === row.subIndicators.length - 1 ? 0 : 12,
                          }}
                        >
                          <Col flex="auto">
                            <div
                              className={`add-indicators-sub-wrapper ${subIndex === 0 ? "is-first" : ""} ${subIndex === row.subIndicators.length - 1 ? "is-last" : ""}`}
                            >
                              <Select
                                value={sub.indicatorId}
                                onChange={(value) =>
                                  handleSubIndicatorChange(rowIndex, subIndex, value)
                                }
                                options={buildSubOptions(
                                  row.indicatorId!,
                                  rowIndex,
                                  sub.indicatorId
                                )}
                                placeholder="Chọn chỉ tiêu phụ"
                                showSearch
                                popupMatchSelectWidth={400}
                                optionLabelProp="label"
                                labelRender={({ value }) => {
                                  if (!value) return null;
                                  return renderIndicatorLabel(value as string);
                                }}
                                filterOption={(inputValue, option) => {
                                  const searchText = (
                                    option as { searchText?: string }
                                  )?.searchText;
                                  if (!searchText) return false;
                                  return searchText
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase());
                                }}
                                allowClear
                                status={
                                  errors[`row-${rowIndex}-sub-${subIndex}`]
                                    ? "error"
                                    : undefined
                                }
                                style={{ width: "100%" }}
                              />
                              {errors[`row-${rowIndex}-sub-${subIndex}`] && (
                                <div
                                  style={{
                                    color: "#ff4d4f",
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}
                                >
                                  {errors[`row-${rowIndex}-sub-${subIndex}`]}
                                </div>
                              )}
                            </div>
                          </Col>
                          <Col flex="140px">
                            <InputNumber<number>
                              value={sub.unitPrice}
                              onChange={(value) =>
                                handleSubPriceChange(rowIndex, subIndex, value)
                              }
                              placeholder="Đơn giá (tùy chọn)"
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
                                  10
                                );
                                return Math.max(0, parsed);
                              }}
                              addonAfter="đ"
                            />
                          </Col>
                          <Col flex="32px">
                            <Tooltip title="Xóa chỉ tiêu phụ">
                              <Icon
                                name="trash3"
                                onClick={() =>
                                  handleRemoveSubIndicator(rowIndex, subIndex)
                                }
                                style={{
                                  fontSize: 16,
                                  color: "#CF1322",
                                  cursor: "pointer",
                                  marginTop: 8,
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
