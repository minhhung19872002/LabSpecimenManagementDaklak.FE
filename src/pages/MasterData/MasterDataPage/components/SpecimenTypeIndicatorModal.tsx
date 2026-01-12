import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Spin,
  Empty,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import {
  SpecimenTypeIndicatorDto,
  SpecimenTypeWithIndicatorsDto,
  IndicatorDto,
  IndicatorGroupDto,
  specimenTypeService,
  indicatorService,
  indicatorGroupService,
} from "../../../../services/masterDataService";

const { Text, Title } = Typography;

interface SpecimenTypeIndicatorModalProps {
  open: boolean;
  specimenType: SpecimenTypeWithIndicatorsDto | null;
  onClose: () => void;
  onDataChange?: () => void;
}

const SpecimenTypeIndicatorModal: React.FC<SpecimenTypeIndicatorModalProps> = ({
  open,
  specimenType,
  onClose,
  onDataChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<SpecimenTypeIndicatorDto[]>([]);
  const [allIndicators, setAllIndicators] = useState<IndicatorDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  // Load indicator groups and all indicators
  const loadMasterData = useCallback(async () => {
    try {
      const [groupsRes, indicatorsRes] = await Promise.all([
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
      ]);
      setIndicatorGroups(groupsRes);
      setAllIndicators(indicatorsRes);
    } catch (error) {
      console.error("Failed to load master data:", error);
    }
  }, []);

  // Load indicators for specimen type
  const loadIndicators = useCallback(async () => {
    if (!specimenType) return;
    setLoading(true);
    try {
      const data = await specimenTypeService.getIndicators(specimenType.id);
      setIndicators(data);
    } catch (error) {
      console.error("Failed to load indicators:", error);
      message.error("Không thể tải danh sách chỉ tiêu");
    } finally {
      setLoading(false);
    }
  }, [specimenType]);

  useEffect(() => {
    if (open) {
      loadMasterData();
      loadIndicators();
      setSelectedIndicatorIds([]);
    }
  }, [open, loadMasterData, loadIndicators]);

  // Get existing indicator IDs
  const existingIndicatorIds = indicators.map((i) => i.indicatorId);

  // Build grouped options for Select
  const buildGroupedOptions = () => {
    // Group indicators by group
    const indicatorsByGroup: Record<string, IndicatorDto[]> = {};
    allIndicators.forEach((ind) => {
      if (!indicatorsByGroup[ind.indicatorGroupId]) {
        indicatorsByGroup[ind.indicatorGroupId] = [];
      }
      indicatorsByGroup[ind.indicatorGroupId].push(ind);
    });

    return indicatorGroups
      .filter((group) => group.isActive && indicatorsByGroup[group.id]?.length > 0)
      .map((group) => {
        const availableIndicators = (indicatorsByGroup[group.id] || []).filter(
          (ind) =>
            ind.isActive &&
            !existingIndicatorIds.includes(ind.id) &&
            !selectedIndicatorIds.includes(ind.id)
        );

        if (availableIndicators.length === 0) return null;

        return {
          label: <Text strong>{group.name}</Text>,
          options: availableIndicators.map((ind) => ({
            value: ind.id,
            label: `${ind.code} - ${ind.name}`,
          })),
        };
      })
      .filter(Boolean) as {
      label: React.ReactNode;
      options: { value: string; label: string }[];
    }[];
  };

  // Handle add indicators
  const handleAddIndicators = async () => {
    if (selectedIndicatorIds.length === 0 || !specimenType) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    setAddLoading(true);
    try {
      await specimenTypeService.addIndicators(specimenType.id, {
        indicatorIds: selectedIndicatorIds,
      });
      message.success(`Đã thêm ${selectedIndicatorIds.length} chỉ tiêu`);
      setSelectedIndicatorIds([]);
      await loadIndicators();
      onDataChange?.();
    } catch (error) {
      console.error("Failed to add indicators:", error);
      message.error("Không thể thêm chỉ tiêu");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle remove indicator
  const handleRemoveIndicator = async (indicatorId: string) => {
    if (!specimenType) return;
    try {
      await specimenTypeService.removeIndicator(specimenType.id, indicatorId);
      message.success("Đã xóa chỉ tiêu");
      await loadIndicators();
      onDataChange?.();
    } catch (error) {
      console.error("Failed to remove indicator:", error);
      message.error("Không thể xóa chỉ tiêu");
    }
  };

  // Handle toggle active
  const handleToggleActive = async (indicatorId: string) => {
    if (!specimenType) return;
    try {
      await specimenTypeService.toggleIndicatorActive(specimenType.id, indicatorId);
      await loadIndicators();
      onDataChange?.();
    } catch (error) {
      console.error("Failed to toggle indicator active:", error);
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const columns: ColumnsType<SpecimenTypeIndicatorDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã",
      dataIndex: "indicatorCode",
      key: "indicatorCode",
      width: 100,
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      ellipsis: true,
    },
    {
      title: "Nhóm chỉ tiêu",
      dataIndex: "indicatorGroupName",
      key: "indicatorGroupName",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      key: "isActive",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Tag
          color={record.isActive ? "green" : "default"}
          style={{ cursor: "pointer" }}
          onClick={() => handleToggleActive(record.indicatorId)}
        >
          {record.isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Xóa chỉ tiêu"
          description="Bạn có chắc chắn muốn xóa chỉ tiêu này?"
          onConfirm={() => handleRemoveIndicator(record.indicatorId)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Quản lý chỉ tiêu - {specimenType?.name}
          </Title>
          <Tag color="blue">{indicators.length} chỉ tiêu</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Spin spinning={loading}>
        {/* Add indicators section */}
        <div style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Select
              mode="multiple"
              placeholder="Chọn chỉ tiêu để thêm..."
              options={buildGroupedOptions()}
              value={selectedIndicatorIds}
              onChange={setSelectedIndicatorIds}
              style={{ width: "calc(100% - 100px)" }}
              showSearch
              filterOption={(input, option) => {
                if (!option?.label) return false;
                const label = String(option.label).toLowerCase();
                return label.includes(input.toLowerCase());
              }}
              maxTagCount={3}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}...`}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddIndicators}
              loading={addLoading}
              disabled={selectedIndicatorIds.length === 0}
            >
              Thêm
            </Button>
          </Space.Compact>
        </div>

        {/* Indicators table */}
        <Table
          columns={columns}
          dataSource={indicators}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có chỉ tiêu nào"
              />
            ),
          }}
        />
      </Spin>
    </Modal>
  );
};

export default SpecimenTypeIndicatorModal;
