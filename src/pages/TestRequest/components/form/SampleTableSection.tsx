import React from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Popconfirm,
  Popover,
  Tooltip,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { SampleFormData, LaboratoryAssignment } from "../../types";
import { PROCESSING_STATUS_OPTIONS } from "../../constants";

const { Title, Text } = Typography;

interface SampleTableSectionProps {
  samples: SampleFormData[];
  isSamplesLocked: boolean;
  indicators: Array<{ id: string; name: string; unitPrice: number }>;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  onAddSample: () => void;
  onRemoveSample: (key: string) => void;
  onUpdateSample: (key: string, field: keyof SampleFormData, value: any) => void;
  onOpenIndicatorModal: (sampleKey: string) => void;
}

const SampleTableSection: React.FC<SampleTableSectionProps> = ({
  samples,
  isSamplesLocked,
  indicators,
  indicatorLaboratoryMap,
  onAddSample,
  onRemoveSample,
  onUpdateSample,
  onOpenIndicatorModal,
}) => {
  const getIndicatorInfo = (indicatorId: string) => {
    return indicators.find((ind) => ind.id === indicatorId);
  };

  const renderIndicatorCell = (value: string[], record: SampleFormData) => {
    const unsentIndicators = value.filter(
      (id) => !indicatorLaboratoryMap[`${record.key}_${id}`]
    );
    const sentIndicators = value.filter(
      (id) => indicatorLaboratoryMap[`${record.key}_${id}`]
    );

    const groupedByLab: Record<string, { labName: string; indicators: string[] }> = {};
    sentIndicators.forEach((id) => {
      const labInfo = indicatorLaboratoryMap[`${record.key}_${id}`];
      if (!groupedByLab[labInfo.laboratoryId]) {
        groupedByLab[labInfo.laboratoryId] = {
          labName: labInfo.laboratoryName,
          indicators: [],
        };
      }
      groupedByLab[labInfo.laboratoryId].indicators.push(id);
    });

    const popoverContent = (
      <div style={{ maxHeight: 300, overflowY: "auto", minWidth: 280 }}>
        {value.length === 0 ? (
          <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
        ) : (
          <>
            {unsentIndicators.map((indId) => {
              const ind = getIndicatorInfo(indId);
              return ind ? (
                <div
                  key={indId}
                  style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}
                >
                  <span>- {ind.name}</span>
                </div>
              ) : null;
            })}
            {Object.entries(groupedByLab).map(([labId, { labName, indicators: labInds }]) => (
              <div key={labId}>
                <div
                  style={{
                    padding: "6px 0 4px 0",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#000",
                    borderBottom: "1px solid #f0f0f0",
                    marginTop: unsentIndicators.length > 0 ? 8 : 0,
                  }}
                >
                  {labName} ({labInds.length})
                </div>
                {labInds.map((indId) => {
                  const ind = getIndicatorInfo(indId);
                  return ind ? (
                    <div
                      key={indId}
                      style={{ padding: "4px 0 4px 12px", borderBottom: "1px solid #f0f0f0" }}
                    >
                      <span>- {ind.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            ))}
          </>
        )}
      </div>
    );

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {value.length > 0 ? (
          <Popover
            content={popoverContent}
            title={`Chỉ tiêu kiểm nghiệm (${value.length})`}
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              type="text"
              icon={<Icon icon="mdi:clipboard-check-outline" width={20} />}
              style={{
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                padding: 0,
              }}
            />
          </Popover>
        ) : (
          <Text type="secondary" style={{ fontSize: 12, width: "100%", textAlign: "center" }}>
            Chưa chọn
          </Text>
        )}
        <Tooltip title="Thêm chỉ tiêu">
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onOpenIndicatorModal(record.key)}
            style={{ flexShrink: 0 }}
            disabled={isSamplesLocked}
          />
        </Tooltip>
      </div>
    );
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã mẫu *",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "sampleCode", e.target.value)}
          placeholder="Mã mẫu"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: "Tên mẫu *",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 180,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "sampleName", e.target.value)}
          placeholder="Tên mẫu"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: 200,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "samplingAddress", e.target.value)}
          placeholder="Địa chỉ"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Lượng mẫu</span>,
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 90,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "sampleQuantity", e.target.value)}
          placeholder="Số lượng"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: 140,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "statusText", e.target.value)}
          placeholder="Tình trạng"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Chỉ tiêu kiểm nghiệm</span>,
      dataIndex: "indicatorIds",
      key: "indicatorIds",
      width: 280,
      render: renderIndicatorCell,
    },
    {
      title: "Trạng thái",
      dataIndex: "processingStatus",
      key: "processingStatus",
      width: 140,
      render: (value: string, record: SampleFormData) => (
        <Select
          value={value}
          onChange={(v) => onUpdateSample(record.key, "processingStatus", v)}
          placeholder="Chọn..."
          size="small"
          style={{ width: "100%" }}
          allowClear
          disabled={isSamplesLocked}
        >
          {PROCESSING_STATUS_OPTIONS.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => onUpdateSample(record.key, "notes", e.target.value)}
          placeholder="Ghi chú"
          size="small"
          disabled={isSamplesLocked}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      fixed: "right" as const,
      render: (_: any, record: SampleFormData) => (
        <Popconfirm
          title="Xóa mẫu này?"
          onConfirm={() => onRemoveSample(record.key)}
          okText="Xóa"
          cancelText="Hủy"
          disabled={isSamplesLocked}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={isSamplesLocked}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="form-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title
          level={5}
          className="section-title"
          style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}
        >
          Thông tin mẫu ({samples.length} mẫu)
        </Title>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddSample}
          disabled={isSamplesLocked}
          title={isSamplesLocked ? "Không thể thêm mẫu khi đang thực hiện" : ""}
        >
          Thêm mẫu
        </Button>
      </div>

      {isSamplesLocked && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 16px",
            background: "#fff7e6",
            borderRadius: 4,
            border: "1px solid #ffd591",
          }}
        >
          <Text type="warning">
            Không thể thêm/sửa/xóa mẫu khi phiếu đang thực hiện. Chỉ có thể sửa các thông tin khác.
          </Text>
        </div>
      )}

      <Table
        dataSource={samples}
        columns={columns}
        pagination={false}
        scroll={{ x: 1500 }}
        size="small"
        bordered
        locale={{ emptyText: 'Chưa có mẫu nào. Nhấn "Thêm mẫu" để thêm.' }}
      />
    </div>
  );
};

export default SampleTableSection;
