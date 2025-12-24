// @ts-nocheck
import React from "react";
import {
  Button,
  Input,
  Table,
  Space,
  Popconfirm,
  Typography,
  Tooltip,
  Popover,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { SampleFormData, LaboratoryAssignment, IndicatorMethodKey, IndicatorMethodInfo } from "../types";
import { IndicatorDto } from "../../../../services/masterDataService";

const { Text } = Typography;

interface SampleTableSectionProps {
  samples: SampleFormData[];
  sampleCodePrefix: string;
  isSamplesLocked: () => boolean;
  addSample: () => void;
  removeSample: (key: string) => void;
  updateSample: (key: string, field: keyof SampleFormData, value: any) => void;
  duplicateSample: (key: string) => void;
  printBarcode: (sampleCode: string, sampleName: string) => void;
  openIndicatorModal: (sampleKey: string) => void;
  getIndicatorInfo: (indicatorId: string) => any;
  getIndicatorMethodInfo: (key: IndicatorMethodKey) => {
    indicator: IndicatorDto | undefined;
    method: IndicatorMethodInfo | undefined;
    indicatorId: string;
    testMethodId: string;
  };
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
}

const SampleTableSection: React.FC<SampleTableSectionProps> = ({
  samples,
  sampleCodePrefix,
  isSamplesLocked,
  addSample,
  removeSample,
  updateSample,
  duplicateSample,
  printBarcode,
  openIndicatorModal,
  getIndicatorInfo,
  getIndicatorMethodInfo,
  indicatorLaboratoryMap,
}) => {
  const sampleColumns = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 130,
      render: (_: string, __: SampleFormData, index: number) => {
        const orderNum = String(index + 1).padStart(2, "0");
        const autoCode = sampleCodePrefix
          ? `${sampleCodePrefix}/${orderNum}`
          : `--/${orderNum}`;
        return (
          <Input
            value={autoCode}
            disabled
            size="small"
            style={{ backgroundColor: "#f5f5f5" }}
          />
        );
      },
    },
    {
      title: "Tên mẫu *",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 180,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) =>
            updateSample(record.key, "sampleName", e.target.value)
          }
          placeholder="Tên mẫu"
          size="small"
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
          onChange={(e) =>
            updateSample(record.key, "samplingAddress", e.target.value)
          }
          placeholder="Địa chỉ"
          size="small"
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
          onChange={(e) =>
            updateSample(record.key, "sampleQuantity", e.target.value)
          }
          placeholder="Số lượng"
          size="small"
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
          onChange={(e) =>
            updateSample(record.key, "statusText", e.target.value)
          }
          placeholder="Tình trạng"
          size="small"
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Chỉ tiêu kiểm nghiệm</span>,
      dataIndex: "indicatorMethods",
      key: "indicatorMethods",
      width: 280,
      render: (_: IndicatorMethodKey[], record: SampleFormData) => {
        // Use indicatorMethods if available, fallback to indicatorIds for backward compat
        const methods = record.indicatorMethods || [];
        const hasData = methods.length > 0;

        const unsentMethods = methods.filter(
          (key) => !indicatorLaboratoryMap[`${record.key}_${key}`]
        );
        const sentMethods = methods.filter(
          (key) => indicatorLaboratoryMap[`${record.key}_${key}`]
        );
        const groupedByLab: Record<
          string,
          { labName: string; methods: IndicatorMethodKey[] }
        > = {};
        sentMethods.forEach((key) => {
          const labInfo = indicatorLaboratoryMap[`${record.key}_${key}`];
          if (!groupedByLab[labInfo.laboratoryId]) {
            groupedByLab[labInfo.laboratoryId] = {
              labName: labInfo.laboratoryName,
              methods: [],
            };
          }
          groupedByLab[labInfo.laboratoryId].methods.push(key);
        });

        const popoverContent = (
          <div style={{ maxHeight: 300, overflowY: "auto", minWidth: 320 }}>
            {!hasData ? (
              <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
            ) : (
              <>
                {unsentMethods.map((key) => {
                  const { indicator, method } = getIndicatorMethodInfo(key);
                  return indicator && method ? (
                    <div
                      key={key}
                      style={{
                        padding: "4px 0",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ flex: 1 }}>- {indicator.name}</span>
                      <span style={{ color: "#1890ff", fontSize: 12 }}>{method.testMethodName}</span>
                    </div>
                  ) : null;
                })}
                {Object.entries(groupedByLab).map(
                  ([labId, { labName, methods: labMethods }]) => (
                    <div key={labId}>
                      <div
                        style={{
                          padding: "6px 0 4px 0",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#000",
                          borderBottom: "1px solid #f0f0f0",
                          marginTop: unsentMethods.length > 0 ? 8 : 0,
                        }}
                      >
                        {labName} ({labMethods.length})
                      </div>
                      {labMethods.map((key) => {
                        const { indicator, method } = getIndicatorMethodInfo(key);
                        return indicator && method ? (
                          <div
                            key={key}
                            style={{
                              padding: "4px 0 4px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ flex: 1 }}>- {indicator.name}</span>
                            <span style={{ color: "#1890ff", fontSize: 12 }}>{method.testMethodName}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        );

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {hasData ? (
              <Popover
                content={popoverContent}
                title={`Chỉ tiêu kiểm nghiệm (${methods.length})`}
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
              <Text
                type="secondary"
                style={{ fontSize: 12, width: "100%", textAlign: "center" }}
              >
                Chưa chọn
              </Text>
            )}
            <Tooltip title="Thêm chỉ tiêu">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openIndicatorModal(record.key)}
                style={{ flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (value: string, record: SampleFormData) => (
        <Input
          value={value}
          onChange={(e) => updateSample(record.key, "notes", e.target.value)}
          placeholder="Ghi chú"
          size="small"
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: SampleFormData, index: number) => {
        const orderNum = String(index + 1).padStart(2, "0");
        const sampleCode = sampleCodePrefix
          ? `${sampleCodePrefix}/${orderNum}`
          : `--/${orderNum}`;
        return (
          <Space size={0}>
            <Tooltip title="Nhân đôi">
              <Button
                type="link"
                icon={<CopyOutlined />}
                size="small"
                onClick={() => duplicateSample(record.key)}
              />
            </Tooltip>
            <Tooltip title="In Barcode">
              <Button
                type="link"
                icon={<BarcodeOutlined />}
                size="small"
                onClick={() => printBarcode(sampleCode, record.sampleName)}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa mẫu này?"
              onConfirm={() => removeSample(record.key)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Space>
        );
      },
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
        <Typography.Title
          level={5}
          className="section-title"
          style={{
            marginBottom: 0,
            borderBottom: "none",
            paddingBottom: 0,
          }}
        >
          Thông tin mẫu ({samples.length} mẫu)
        </Typography.Title>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={addSample}
          disabled={isSamplesLocked()}
          title={
            isSamplesLocked() ? "Không thể thêm mẫu khi đang thực hiện" : ""
          }
        >
          Thêm mẫu
        </Button>
      </div>

      {isSamplesLocked() && (
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
            Không thể thêm/sửa/xóa mẫu khi phiếu đang thực hiện. Chỉ có thể
            sửa các thông tin khác.
          </Text>
        </div>
      )}

      <Table
        dataSource={samples}
        columns={sampleColumns}
        pagination={false}
        scroll={{ x: "max-content", y: 220 }}
        size="small"
        bordered
        className="sample-table-fixed-height"
        locale={{
          emptyText: (
            <div style={{ padding: "60px 0" }}>
              Chưa có mẫu nào. Nhấn "Thêm mẫu" để thêm.
            </div>
          ),
        }}
      />
    </div>
  );
};

export default SampleTableSection;
