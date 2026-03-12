import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Input,
  Button,
  Typography,
  InputNumber,
  DatePicker,
  Radio,
  Card,
  Tooltip,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  CloseOutlined,
} from "../../../../components/common/Icon";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { testRequestService } from "../../../../services/testRequestService";
import type {
  ExistingSampleDto,
  ExistingSampleIndicatorDto,
} from "../../../../services/testRequestService";
import { IndicatorName } from "../../../../components/common";
import "./IndicatorSelectionModal.css";

const { Text } = Typography;

interface SelectedIndicator extends ExistingSampleIndicatorDto {
  key: string;
  transferDate: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
}

interface ExistingSampleSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (sample: ExistingSampleDto, indicators: SelectedIndicator[]) => void;
}

// Truncate tooltip - only show when text is clipped
const TruncateTooltip: React.FC<{
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, children, style }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setShowTooltip(scrollWidth > clientWidth);
    }
  }, []);

  return (
    <Tooltip title={title} open={showTooltip} placement="topLeft">
      <span
        ref={containerRef}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
    </Tooltip>
  );
};

const ExistingSampleSelectionModal: React.FC<
  ExistingSampleSelectionModalProps
> = ({ visible, onCancel, onOk }) => {
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<ExistingSampleDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedSample, setSelectedSample] =
    useState<ExistingSampleDto | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<
    SelectedIndicator[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadSamples = useCallback(async (search: string, page: number) => {
    setLoading(true);
    try {
      const result = await testRequestService.getAllSamples({
        search: search || undefined,
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
      });
      setSamples(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to load samples:", error);
      message.error("Không thể tải danh sách mẫu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearchText("");
      setSelectedSample(null);
      setSelectedIndicators([]);
      setCurrentPage(1);
      loadSamples("", 1);
    }
  }, [visible, loadSamples]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    loadSamples(value, 1);
  };

  const handleSelectSample = (sample: ExistingSampleDto) => {
    setSelectedSample(sample);
    const now = dayjs();
    setSelectedIndicators(
      sample.indicators.map((ind) => ({
        ...ind,
        key: `${ind.indicatorId}_${ind.testMethodId || "null"}_${ind.specimenTypeId || "null"}`,
        transferDate: now,
        requestDate: undefined,
      })),
    );
  };

  const handleRemoveIndicator = (key: string) => {
    setSelectedIndicators((prev) => prev.filter((ind) => ind.key !== key));
  };

  const handleUpdateUnitPrice = (key: string, value: number | null) => {
    setSelectedIndicators((prev) =>
      prev.map((ind) =>
        ind.key === key ? { ...ind, unitPrice: value || 0 } : ind,
      ),
    );
  };

  const handleDateChange = (
    key: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null,
  ) => {
    setSelectedIndicators((prev) =>
      prev.map((ind) => {
        if (ind.key !== key) return ind;
        if (field === "requestDate" && value && ind.transferDate) {
          if (value.isBefore(ind.transferDate)) {
            message.warning("Ngày yêu cầu không được nhỏ hơn ngày chuyển giao");
            return ind;
          }
        }
        return { ...ind, [field]: value || undefined };
      }),
    );
  };

  const handleOk = () => {
    if (!selectedSample) {
      message.warning("Vui lòng chọn một mẫu");
      return;
    }
    if (selectedIndicators.length === 0) {
      message.warning("Mẫu phải có ít nhất một chỉ tiêu");
      return;
    }
    onOk(selectedSample, selectedIndicators);
  };

  const totalPrice = selectedIndicators.reduce(
    (sum, ind) => sum + ind.unitPrice,
    0,
  );
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <Icon icon="mdi:flask-outline" width={24} height={24} />
          <span>Chọn chỉ tiêu từ mẫu có sẵn</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onCancel}
            className="indicator-close-button-desktop"
            style={{ marginLeft: "auto" }}
          />
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={1500}
      centered
      closable={false}
      okText="Chọn"
      cancelText="Hủy"
      okButtonProps={{
        disabled: !selectedSample,
        style: {
          minWidth: 100,
          background: !selectedSample
            ? undefined
            : "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          borderColor: !selectedSample ? undefined : "transparent",
        },
      }}
      cancelButtonProps={{
        style: { minWidth: 100 },
      }}
      styles={{ body: { padding: 0 } }}
      className="indicator-selection-modal"
    >
      <div className="indicator-modal-body">
        {/* Left panel - Sample list with radio, sample code, sample name columns */}
        <div className="indicator-modal-left" style={{ width: 480 }}>
          <div style={{ padding: "12px 12px 8px" }}>
            <Input
              placeholder="Tìm kiếm theo mã mẫu, tên mẫu"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              size="small"
            />
          </div>
          <div className="indicator-table-container">
            <div className="indicator-table-scroll">
              <div className="indicator-table-inner" style={{ minWidth: 0 }}>
                {/* Table header - same #E6F7FF style as right panel */}
                <div
                  className="indicator-table-header"
                  style={{ fontWeight: 600, fontSize: 13 }}
                >
                  <span style={{ width: 24, flexShrink: 0 }} />
                  <span style={{ width: 160, flexShrink: 0 }}>Mã mẫu</span>
                  <span style={{ flex: 1, minWidth: 0 }}>Tên mẫu</span>
                </div>
                {/* Table body */}
                <div className="indicator-table-body">
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 48,
                      }}
                    >
                      <Spin />
                    </div>
                  ) : samples.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center" }}>
                      <Text type="secondary">Không tìm thấy mẫu nào</Text>
                    </div>
                  ) : (
                    samples.map((sample) => {
                      const isSelected =
                        selectedSample?.sampleId === sample.sampleId;
                      return (
                        <div
                          key={sample.sampleId}
                          className="indicator-table-row"
                          onClick={() => handleSelectSample(sample)}
                          style={{
                            cursor: "pointer",
                            borderBottom: "1px solid #f5f5f5",
                            background: isSelected ? "#e6f7ff" : "#fff",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = "#fafafa";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = "#fff";
                          }}
                        >
                          <span style={{ width: 24, flexShrink: 0, display: "flex", alignItems: "center" }}>
                            <Radio
                              checked={isSelected}
                              style={{ marginRight: 0 }}
                            />
                          </span>
                          <TruncateTooltip
                            title={sample.sampleCode}
                            style={{
                              width: 160,
                              flexShrink: 0,
                              fontSize: 13,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sample.sampleCode}
                          </TruncateTooltip>
                          <TruncateTooltip
                            title={sample.sampleName}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 13,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sample.sampleName}
                          </TruncateTooltip>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Pagination + count */}
          <div
            style={{
              padding: "6px 12px",
              borderTop: "1px solid #d9d9d9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {totalCount} mẫu
            </Text>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  size="small"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const p = currentPage - 1;
                    setCurrentPage(p);
                    loadSamples(searchText, p);
                  }}
                >
                  ‹
                </Button>
                <Text style={{ fontSize: 12 }}>
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  size="small"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const p = currentPage + 1;
                    setCurrentPage(p);
                    loadSamples(searchText, p);
                  }}
                >
                  ›
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Indicators of selected sample (same style as IndicatorSelectionModal) */}
        <div className="indicator-modal-right">
          <Card
            styles={{
              body: {
                padding: 0,
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              },
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #d9d9d9",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ color: "#fff" }}>
                Danh sách đã chọn
              </Text>
            </div>
            <div className="indicator-table-container">
              <div className="indicator-table-scroll">
                <div className="indicator-table-inner">
                  {/* Table header - same columns as IndicatorSelectionModal */}
                  <div
                    className="indicator-table-header"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    <span style={{ flex: 1, minWidth: 80 }}>Chỉ tiêu</span>
                    <span style={{ width: 120, flexShrink: 0 }}>
                      Phương pháp
                    </span>
                    <span style={{ width: 110, flexShrink: 0 }}>Đơn giá</span>
                    <span
                      style={{ width: 100, flexShrink: 0, textAlign: "center" }}
                    >
                      Ngày CG
                    </span>
                    <span
                      style={{ width: 100, flexShrink: 0, textAlign: "center" }}
                    >
                      Ngày YC
                    </span>
                    <span style={{ width: 32, flexShrink: 0 }}>Xóa</span>
                  </div>
                  {/* Table body */}
                  <div className="indicator-table-body">
                    {selectedIndicators.map((ind) => (
                      <div
                        key={ind.key}
                        className="indicator-table-row"
                        style={{
                          borderBottom: "1px solid #f5f5f5",
                          background: "#fff",
                        }}
                      >
                        {/* Indicator name */}
                        <TruncateTooltip
                          title={ind.indicatorName || ""}
                          style={{
                            flex: 1,
                            minWidth: 80,
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <IndicatorName
                            name={ind.indicatorName || ""}
                            formattedName={ind.indicatorFormattedName}
                          />
                        </TruncateTooltip>
                        {/* Method name */}
                        <TruncateTooltip
                          title={ind.testMethodName || ""}
                          style={{
                            width: 120,
                            flexShrink: 0,
                            fontSize: 12,
                            color: "#1890ff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <IndicatorName
                            name={ind.testMethodName || ""}
                            formattedName={ind.testMethodFormattedName}
                          />
                        </TruncateTooltip>
                        {/* Unit price */}
                        <div style={{ width: 110, flexShrink: 0 }}>
                          <InputNumber
                            value={ind.unitPrice}
                            min={0}
                            size="small"
                            style={{ width: "100%", height: 32 }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              Number(value?.replace(/,/g, "") || 0)
                            }
                            onChange={(val) =>
                              handleUpdateUnitPrice(ind.key, val)
                            }
                          />
                        </div>
                        {/* Transfer date - disabled, auto-set to current date */}
                        <DatePicker
                          value={ind.transferDate}
                          onChange={(date) =>
                            handleDateChange(ind.key, "transferDate", date)
                          }
                          format="DD/MM/YYYY"
                          size="small"
                          style={{ width: 100, flexShrink: 0 }}
                          placeholder="CG"
                          disabled
                        />
                        {/* Request date */}
                        <DatePicker
                          value={ind.requestDate}
                          onChange={(date) =>
                            handleDateChange(ind.key, "requestDate", date)
                          }
                          format="DD/MM/YYYY"
                          size="small"
                          style={{ width: 100, flexShrink: 0 }}
                          placeholder="YC"
                          disabledDate={(current) =>
                            current && current.isBefore(dayjs().startOf("day"))
                          }
                        />
                        {/* Delete button */}
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<CloseOutlined />}
                          style={{ width: 32, flexShrink: 0 }}
                          onClick={() => handleRemoveIndicator(ind.key)}
                        />
                      </div>
                    ))}

                    {/* Empty state */}
                    {selectedIndicators.length === 0 && (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <Text type="secondary">
                          {selectedSample
                            ? "Không còn chỉ tiêu nào"
                            : "Chưa chọn chỉ tiêu nào"}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Footer stats - same as IndicatorSelectionModal */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #d9d9d9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>
                Số chỉ tiêu: <Text strong>{selectedIndicators.length}</Text>
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 14 }}>Tổng tiền:</Text>
                <Text strong style={{ fontSize: 16, color: "#FF0000" }}>
                  {totalPrice.toLocaleString("vi-VN")} đ
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default ExistingSampleSelectionModal;
