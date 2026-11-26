import React, { useState, useMemo, useEffect } from "react";
import { Modal, Select, Button, Typography, Space } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "../../../../components/common/Icon";
import { IndicatorDto, IndicatorGroupDto, SpecimenTypeDto } from "../../../../services/masterDataService";
import { TestResultValueIndicatorDto } from "../../../../services/testResultValueService";
import IndicatorName from "../../../../components/common/IndicatorName";
import { withUngroupedGroup } from "../../../../utils/indicatorGroups";

const { Text } = Typography;

interface IndicatorSpecimenTypePair {
  indicatorId: string;
  specimenTypeId: string;
}

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  specimenTypes: SpecimenTypeDto[];
  existingIndicators?: TestResultValueIndicatorDto[];
  getIndicatorsBySpecimenType: (specimenTypeId: string) => IndicatorDto[];
  onOk: (indicators: IndicatorSpecimenTypePair[]) => void;
  onCancel: () => void;
}

interface RowData {
  specimenTypeId: string;
  indicatorId: string;
}

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  indicatorGroups,
  indicatorsByGroup,
  specimenTypes,
  existingIndicators = [],
  getIndicatorsBySpecimenType,
  onOk,
  onCancel,
}) => {
  const [rows, setRows] = useState<RowData[]>([{ specimenTypeId: "", indicatorId: "" }]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRows([{ specimenTypeId: "", indicatorId: "" }]);
    }
  }, [open]);

  // Build set of existing (indicatorId, specimenTypeId) pairs
  const existingPairs = useMemo(() => {
    const pairs = new Set<string>();
    existingIndicators.forEach((ind) => {
      pairs.add(`${ind.indicatorId}_${ind.specimenTypeId}`);
    });
    return pairs;
  }, [existingIndicators]);

  // Build grouped options for Indicator Select - filtered by specimen type
  const buildIndicatorOptions = (currentIndex: number) => {
    const currentRow = rows[currentIndex];
    const currentSpecimenTypeId = currentRow.specimenTypeId;

    // If no specimen type selected, return empty
    if (!currentSpecimenTypeId) return [];

    // Get indicators that belong to this specimen type
    const indicatorsForSpecimenType = getIndicatorsBySpecimenType(currentSpecimenTypeId);
    const indicatorIdsForSpecimenType = new Set(indicatorsForSpecimenType.map(ind => ind.id));

    return withUngroupedGroup(indicatorGroups)
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter((ind) => {
          // Only show indicators that belong to selected specimen type
          if (!indicatorIdsForSpecimenType.has(ind.id)) return false;

          const pairKey = `${ind.id}_${currentSpecimenTypeId}`;
          // Check if this pair already exists in the database
          if (existingPairs.has(pairKey)) return false;
          // Check if this pair is already selected in other rows
          const alreadySelectedInOtherRow = rows.some(
            (row, idx) =>
              idx !== currentIndex &&
              row.indicatorId === ind.id &&
              row.specimenTypeId === currentSpecimenTypeId
          );
          if (alreadySelectedInOtherRow) return false;

          return true;
        });

        if (availableIndicators.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableIndicators.map((ind) => ({
            value: ind.id,
            label: (
              <span>
                {ind.code} -{" "}
                <IndicatorName name={ind.name} formattedName={ind.formattedName} />
              </span>
            ),
            searchText: `${ind.code} - ${ind.name}`,
          })),
        };
      })
      .filter(Boolean) as {
      label: React.ReactNode;
      options: { value: string; label: React.ReactNode; searchText: string }[];
    }[];
  };

  // Build options for SpecimenType Select - show all active specimen types
  const buildSpecimenTypeOptions = () => {
    return specimenTypes
      .filter((st) => st.isActive)
      .map((st) => ({
        value: st.id,
        label: `${st.code} - ${st.name}`,
        searchText: `${st.code} - ${st.name}`,
      }));
  };

  const handleAddRow = () => {
    setRows([...rows, { specimenTypeId: "", indicatorId: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = rows.filter((_, idx) => idx !== index);
    setRows(newRows.length > 0 ? newRows : [{ specimenTypeId: "", indicatorId: "" }]);
  };

  const handleIndicatorChange = (value: string, index: number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], indicatorId: value };
    setRows(newRows);
  };

  const handleSpecimenTypeChange = (value: string, index: number) => {
    const newRows = [...rows];
    // Clear indicatorId when specimenTypeId changes
    newRows[index] = { ...newRows[index], specimenTypeId: value, indicatorId: "" };
    setRows(newRows);
  };

  const handleOk = () => {
    // Only include rows that have both indicator and specimen type selected
    const validPairs = rows.filter(
      (row) => row.indicatorId && row.specimenTypeId
    );
    if (validPairs.length === 0) {
      return;
    }
    onOk(validPairs);
  };

  const handleCancel = () => {
    setRows([{ specimenTypeId: "", indicatorId: "" }]);
    onCancel();
  };

  // Check if current rows have valid data
  const hasValidData = rows.some((row) => row.indicatorId && row.specimenTypeId);

  return (
    <Modal
      title="Thêm chỉ tiêu"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      okButtonProps={{ disabled: !hasValidData }}
      width={650}
      centered
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
    >
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", marginBottom: 8 }}>
          <Text strong style={{ width: 200, marginRight: 8 }}>
            Nền mẫu <Text type="danger">*</Text>
          </Text>
          <Text strong style={{ flex: 1 }}>
            Chỉ tiêu <Text type="danger">*</Text>
          </Text>
          <div style={{ width: 32 }} />
        </div>

        {rows.map((row, index) => {
          const specimenTypeOptions = buildSpecimenTypeOptions();
          const indicatorOptions = buildIndicatorOptions(index);

          return (
            <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="start">
              <Select
                value={row.specimenTypeId || undefined}
                options={specimenTypeOptions}
                placeholder="Chọn nền mẫu"
                style={{ width: 200 }}
                showSearch
                optionFilterProp="label"
                filterOption={(inputValue, option) => {
                  const searchText = (option as { searchText?: string })?.searchText;
                  if (!searchText) return false;
                  return searchText.toLowerCase().includes(inputValue.toLowerCase());
                }}
                onChange={(value) => handleSpecimenTypeChange(value, index)}
                allowClear
                onClear={() => handleSpecimenTypeChange("", index)}
              />
              <Select
                value={row.indicatorId || undefined}
                options={indicatorOptions}
                placeholder="Chọn chỉ tiêu"
                style={{ flex: 1, minWidth: 350 }}
                showSearch
                popupMatchSelectWidth={400}
                optionLabelProp="label"
                disabled={!row.specimenTypeId}
                filterOption={(inputValue, option) => {
                  const searchText = (option as { searchText?: string })?.searchText;
                  if (!searchText) return false;
                  return searchText.toLowerCase().includes(inputValue.toLowerCase());
                }}
                onChange={(value) => handleIndicatorChange(value, index)}
                allowClear
                onClear={() => handleIndicatorChange("", index)}
              />
              <MinusCircleOutlined
                onClick={() => handleRemoveRow(index)}
                style={{
                  color: rows.length > 1 ? "#ff4d4f" : "#d9d9d9",
                  marginTop: 8,
                  cursor: rows.length > 1 ? "pointer" : "not-allowed",
                  visibility: rows.length > 1 ? "visible" : "hidden",
                }}
              />
            </Space>
          );
        })}

        <Button
          type="dashed"
          onClick={handleAddRow}
          block
          icon={<PlusOutlined />}
          style={{ marginTop: 8 }}
        >
          Thêm dòng
        </Button>
      </div>
    </Modal>
  );
};

export default AddIndicatorsModal;
