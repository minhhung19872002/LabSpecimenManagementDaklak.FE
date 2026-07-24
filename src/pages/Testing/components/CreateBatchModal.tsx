import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Modal,
  Input,
  Button,
  message,
  Typography,
  Spin,
  Empty,
  Tooltip,
  Form,
  Select,
  Tag,
  Space,
} from "antd";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  PlusOutlined,
  CloseOutlined,
  SearchOutlined,
} from "../../../components/common/Icon";
import testBatchService from "../../../services/testBatchService";
import { authService } from "../../../services/authService";
import {
  AvailableIndicatorDto,
  CreateTestBatchDto,
} from "../../../types/testBatch";
import dayjs from "dayjs";

const { Text } = Typography;

const sortAvailableIndicators = (
  items: AvailableIndicatorDto[],
  currentUserId?: string,
): AvailableIndicatorDto[] => {
  return [...items].sort((a, b) => {
    // 1. Giảm dần theo số hợp đồng
    const byContract = (b.contractNumber || "").localeCompare(a.contractNumber || "");
    if (byContract !== 0) return byContract;

    // 2. Chỉ tiêu của user hiện tại lên trước
    const byCurrentUser =
      Number(b.technicianId === currentUserId) - Number(a.technicianId === currentUserId);
    if (byCurrentUser !== 0) return byCurrentUser;

    // 3. Tăng dần theo ngày yêu cầu hoàn thành
    const byDeadline = (a.requestCompletionDate || "").localeCompare(b.requestCompletionDate || "");
    if (byDeadline !== 0) return byDeadline;

    // 4. Ưu tiên trạng thái: Cần làm(0) → Đang TN(1) → Hoàn thành(4)
    return (a.testingStatus ?? 99) - (b.testingStatus ?? 99);
  });
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateBatchModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterSpecimenType, setFilterSpecimenType] = useState<string | null>(null);
  const [filterIndicator, setFilterIndicator] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState(false);

  const [availableItems, setAvailableItems] = useState<AvailableIndicatorDto[]>(
    [],
  );
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItems, setSelectedItems] = useState<AvailableIndicatorDto[]>(
    [],
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((i) => i.id)),
    [selectedItems],
  );

  const loadAvailableIndicators = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await testBatchService.getAvailableIndicators({
        maxResultCount: 500,
      });
      setAvailableItems(res.data?.items || []);
    } catch {
      message.error("Lỗi tải danh sách chỉ tiêu khả dụng");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadAvailableIndicators();
    }
  }, [open, loadAvailableIndicators]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentUserId = useMemo(() => authService.getUserInfo()?.id, []);

  const specimenTypeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of availableItems) {
      if (i.specimenTypeId && !seen.has(i.specimenTypeId))
        seen.set(i.specimenTypeId, i.specimenTypeName || i.specimenTypeId);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [availableItems]);

  const indicatorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of availableItems) {
      if (i.indicatorId && !seen.has(i.indicatorId))
        seen.set(i.indicatorId, i.indicatorName || i.indicatorId);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [availableItems]);

  const methodOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of availableItems) {
      if (i.methodId && !seen.has(i.methodId))
        seen.set(i.methodId, i.methodName || i.methodId);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [availableItems]);

  const selectedGroups = useMemo(() => {
    const map = new Map<string, { specimenTypeName?: string; indicatorName?: string; methodName?: string }>();
    for (const item of selectedItems) {
      const key = `${item.specimenTypeId ?? ""}|${item.indicatorId ?? ""}|${item.methodId ?? ""}`;
      if (!map.has(key))
        map.set(key, { specimenTypeName: item.specimenTypeName, indicatorName: item.indicatorName, methodName: item.methodName });
    }
    return [...map.values()];
  }, [selectedItems]);

  const filteredItems = useMemo(() => {
    let items = availableItems;
    if (searchText) {
      const lower = searchText.toLowerCase();
      items = items.filter(
        (i) =>
          i.contractNumber?.toLowerCase().includes(lower) ||
          i.sampleCode?.toLowerCase().includes(lower) ||
          i.sampleName?.toLowerCase().includes(lower) ||
          i.technicianName?.toLowerCase().includes(lower) ||
          i.indicatorName?.toLowerCase().includes(lower) ||
          i.methodName?.toLowerCase().includes(lower),
      );
    }
    if (filterSpecimenType) items = items.filter((i) => i.specimenTypeId === filterSpecimenType);
    if (filterIndicator) items = items.filter((i) => i.indicatorId === filterIndicator);
    if (filterMethod) items = items.filter((i) => i.methodId === filterMethod);
    items = sortAvailableIndicators(items, currentUserId);
    return items;
  }, [availableItems, searchText, filterSpecimenType, filterIndicator, filterMethod, currentUserId]);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const handleAddItem = (item: AvailableIndicatorDto) => {
    if (selectedIds.has(item.id) || item.isAlreadyInBatch) return;
    setSelectedItems((prev) => [...prev, item]);
    setSelectedError(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleCreate = async () => {
    const noItems = selectedItems.length === 0;
    if (noItems) setSelectedError(true);

    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (noItems) return;

    setLoading(true);
    try {
      const dto: CreateTestBatchDto = {
        name: values.name.trim(),
        note: values.note?.trim() || undefined,
        laboratoryTaskIndicatorIds: selectedItems.map((i) => i.id),
      };
      await testBatchService.create(dto);
      message.success("Tạo mẻ thử nghiệm thành công");
      handleClose();
      onCreated();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi tạo mẻ");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSearchText("");
    setFilterSpecimenType(null);
    setFilterIndicator(null);
    setFilterMethod(null);
    setAvailableItems([]);
    setSelectedItems([]);
    setSelectedError(false);
    onClose();
  };

  return (
    <Modal
      title="Tạo mẻ thử nghiệm"
      open={open}
      onCancel={handleClose}
      onOk={handleCreate}
      confirmLoading={loading}
      width={1100}
      centered
      okText="Tạo mẻ"
      cancelText="Hủy"
      styles={{
        body: {
          padding: "12px 0",
          overflow: "hidden",
        },
      }}
    >
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 180px)", minHeight: 400 }}>
        {/* Left: Available Indicators */}
        <div
          style={{
            width: 480,
            flexShrink: 0,
            borderRight: "1px solid #f0f0f0",
            paddingRight: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: 8, paddingLeft: 12 }}>
            <Text strong>Chỉ tiêu khả dụng</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              ({filteredItems.length})
            </Text>
          </div>
          <div style={{ paddingLeft: 12, marginBottom: 8 }}>
            <Input
              size="small"
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ paddingLeft: 12, marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Select
              size="small"
              allowClear
              showSearch
              placeholder="Nền mẫu"
              style={{ width: "calc(50% - 3px)" }}
              options={specimenTypeOptions}
              value={filterSpecimenType}
              onChange={(v) => setFilterSpecimenType(v ?? null)}
              optionFilterProp="label"
            />
            <Select
              size="small"
              allowClear
              showSearch
              placeholder="Chỉ tiêu"
              style={{ width: "calc(50% - 3px)" }}
              options={indicatorOptions}
              value={filterIndicator}
              onChange={(v) => setFilterIndicator(v ?? null)}
              optionFilterProp="label"
            />
            <Select
              size="small"
              allowClear
              showSearch
              placeholder="Phương pháp thử"
              style={{ width: "calc(50% - 3px)" }}
              options={methodOptions}
              value={filterMethod}
              onChange={(v) => setFilterMethod(v ?? null)}
              optionFilterProp="label"
            />
          </div>
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              paddingLeft: 12,
            }}
          >
            {loadingItems ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 40,
                }}
              >
                <Spin />
              </div>
            ) : filteredItems.length === 0 ? (
              <Empty
                description="Không có chỉ tiêu khả dụng"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = filteredItems[virtualRow.index];
                  const isSelected = selectedIds.has(item.id);
                  const isInBatch = item.isAlreadyInBatch;

                  return (
                    <div
                      key={item.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 10px",
                          marginBottom: 6,
                          borderRadius: 6,
                          border: "1px solid #f0f0f0",
                          background: isSelected ? "#f6ffed" : "#fff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.contractNumber || "—"} - {item.sampleCode} - {item.sampleName} - {item.specimenTypeName || ""}
                            </Text>
                            <div style={{ marginTop: 2 }}>
                              <Text strong style={{ fontSize: 13 }}>
                                {item.indicatorName} - {item.methodName}
                              </Text>
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Ngày nhận mẫu: {item.sampleReceivedDate ? dayjs(item.sampleReceivedDate).format("DD/MM/YYYY") : "—"}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Ngày YC hoàn thành: {item.requestCompletionDate ? dayjs(item.requestCompletionDate).format("DD/MM/YYYY") : "—"}
                              </Text>
                            </div>
                          </div>
                          <div style={{ marginLeft: 8, flexShrink: 0 }}>
                            {isSelected ? (
                              <Button
                                size="small"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                Hủy
                              </Button>
                            ) : (
                              <Tooltip title={isInBatch ? "Đã thuộc mẻ khác" : "Thêm vào mẻ"}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  disabled={isInBatch}
                                  onClick={() => handleAddItem(item)}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Batch Info + Selected Items */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            paddingRight: 12,
          }}
        >
          <Form form={form} layout="vertical" style={{ display: "contents" }}>
            <Form.Item
              name="name"
              label="Tên mẻ"
              rules={[
                { required: true, message: "Vui lòng nhập tên mẻ" },
                { max: 200, message: "Tên mẻ không quá 200 ký tự" },
                {
                  whitespace: true,
                  message: "Tên mẻ không được chỉ chứa khoảng trắng",
                },
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Nhập tên mẻ thử nghiệm" maxLength={200} />
            </Form.Item>

            {selectedGroups.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>
                  Điều kiện mẻ:
                </Text>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selectedGroups.map((g, idx) => (
                    <Space key={idx} wrap size={4}>
                      {g.specimenTypeName && <Tag>{g.specimenTypeName}</Tag>}
                      {g.indicatorName && <Tag color="blue">{g.indicatorName}</Tag>}
                      {g.methodName && <Tag color="green">{g.methodName}</Tag>}
                    </Space>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13 }}>
                Danh sách chỉ tiêu trong mẻ ({selectedItems.length})
              </Text>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: selectedError ? "1px solid #ff4d4f" : "1px solid #f0f0f0",
                borderRadius: 6,
                padding: 8,
                marginBottom: selectedError ? 0 : 12,
              }}
            >
              {selectedItems.length === 0 ? (
                <Empty
                  description="Chưa chọn chỉ tiêu nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: "40px 0" }}
                />
              ) : (
                selectedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "8px 10px",
                      marginBottom: 4,
                      borderRadius: 6,
                      border: "1px solid #f0f0f0",
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        HĐ - {item.contractNumber || "—"}
                      </Text>
                      <div>
                        <Text strong style={{ fontSize: 13 }}>
                          {item.sampleName}
                        </Text>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                        Ngày YC hoàn thành:
                      </Text>
                      <Text style={{ fontSize: 11 }}>
                        {item.requestCompletionDate
                          ? dayjs(item.requestCompletionDate).format("DD/MM/YYYY")
                          : "—"}
                      </Text>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ marginLeft: 4 }}
                    />
                  </div>
                ))
              )}
            </div>
            {selectedError && (
              <div style={{ color: "#ff4d4f", fontSize: 12, marginBottom: 12 }}>
                Vui lòng chọn ít nhất 1 chỉ tiêu
              </div>
            )}

            <Form.Item
              name="note"
              label="Ghi chú"
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
                placeholder="Ghi chú..."
                maxLength={2000}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default CreateBatchModal;
