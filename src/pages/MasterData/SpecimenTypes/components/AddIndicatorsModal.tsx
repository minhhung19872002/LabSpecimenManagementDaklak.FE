import React, { useState, useMemo } from "react";
import { Modal, Select, Button, Typography, Space } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "../../../../components/common/Icon";
import { IndicatorDto, IndicatorGroupDto } from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";

const { Text } = Typography;

interface AddIndicatorsModalProps {
  open: boolean;
  loading: boolean;
  indicatorGroups: IndicatorGroupDto[];
  indicatorsByGroup: Record<string, IndicatorDto[]>;
  existingIndicatorIds?: string[];
  onOk: (indicatorIds: string[]) => void;
  onCancel: () => void;
}

const AddIndicatorsModal: React.FC<AddIndicatorsModalProps> = ({
  open,
  loading,
  indicatorGroups,
  indicatorsByGroup,
  existingIndicatorIds = [],
  onOk,
  onCancel,
}) => {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([""]);

  // Build grouped options for Select
  const buildGroupedOptions = (currentIndex: number) => {
    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) =>
            !existingIndicatorIds.includes(ind.id) &&
            !selectedIndicators.some(
              (id, idx) => id === ind.id && idx !== currentIndex
            )
        );

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

  const handleAddRow = () => {
    setSelectedIndicators([...selectedIndicators, ""]);
  };

  const handleRemoveRow = (index: number) => {
    const newSelected = selectedIndicators.filter((_, idx) => idx !== index);
    setSelectedIndicators(newSelected.length > 0 ? newSelected : [""]);
  };

  const handleSelectChange = (value: string, index: number) => {
    const newSelected = [...selectedIndicators];
    newSelected[index] = value;
    setSelectedIndicators(newSelected);
  };

  const handleOk = () => {
    const validIds = selectedIndicators.filter((id) => id && id.trim() !== "");
    onOk(validIds);
  };

  const handleCancel = () => {
    setSelectedIndicators([""]);
    onCancel();
  };

  // Check if we can add more rows
  const totalAvailable = useMemo(() => {
    let count = 0;
    indicatorGroups.forEach((group) => {
      if (group.isActive && indicatorsByGroup[group.id]) {
        indicatorsByGroup[group.id].forEach((ind) => {
          if (!existingIndicatorIds.includes(ind.id)) {
            count++;
          }
        });
      }
    });
    return count;
  }, [indicatorGroups, indicatorsByGroup, existingIndicatorIds]);

  const canAddMore = selectedIndicators.filter((id) => id).length < totalAvailable;

  return (
    <Modal
      title="Thêm chỉ tiêu"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Hủy"
      width={500}
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
        <Text strong style={{ marginBottom: 8, display: "block" }}>
          Chỉ tiêu <Text type="danger">*</Text>
        </Text>

        {selectedIndicators.map((selectedId, index) => {
          const groupedOptions = buildGroupedOptions(index);

          return (
            <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="start">
              <Select
                value={selectedId || undefined}
                options={groupedOptions}
                placeholder="Tìm và chọn chỉ tiêu"
                style={{ width: 400 }}
                showSearch
                popupMatchSelectWidth={400}
                optionLabelProp="label"
                filterOption={(inputValue, option) => {
                  // Use searchText for filtering (plain text for search)
                  const searchText = (option as { searchText?: string })?.searchText;
                  if (!searchText) return false;
                  return searchText.toLowerCase().includes(inputValue.toLowerCase());
                }}
                onChange={(value) => handleSelectChange(value, index)}
                allowClear
                onClear={() => handleSelectChange("", index)}
              />
              <MinusCircleOutlined
                onClick={() => handleRemoveRow(index)}
                style={{
                  color: selectedIndicators.length > 1 ? "#ff4d4f" : "#d9d9d9",
                  marginTop: 8,
                  cursor: selectedIndicators.length > 1 ? "pointer" : "not-allowed",
                  visibility: selectedIndicators.length > 1 ? "visible" : "hidden",
                }}
              />
            </Space>
          );
        })}

        {canAddMore && (
          <Button
            type="dashed"
            onClick={handleAddRow}
            block
            icon={<PlusOutlined />}
            style={{ marginTop: 8 }}
          >
            Thêm dòng
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AddIndicatorsModal;
