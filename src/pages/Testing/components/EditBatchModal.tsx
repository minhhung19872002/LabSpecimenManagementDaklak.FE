import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Modal,
  Button,
  message,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  Tooltip,
  Input,
} from "antd";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  PlusOutlined,
  CloseOutlined,
  SearchOutlined,
} from "../../../components/common/Icon";
import testBatchService from "../../../services/testBatchService";
import {
  AvailableIndicatorDto,
  TestBatchDto,
} from "../../../types/testBatch";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  open: boolean;
  batch: TestBatchDto | null;
  onClose: () => void;
  onSaved: () => void;
}

type SelectedItem = {
  id: string;
  contractNumber?: string;
  sampleCode?: string;
  sampleName?: string;
  technicianName?: string;
  requestCompletionDate?: string;
  hasResult: boolean;
  isOriginal: boolean;
};

const EditBatchModal: React.FC<Props> = ({
  open,
  batch,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedError, setSelectedError] = useState(false);

  const [availableItems, setAvailableItems] = useState<AvailableIndicatorDto[]>(
    [],
  );
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [originalItemIds, setOriginalItemIds] = useState<Set<string>>(
    new Set(),
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((i) => i.id)),
    [selectedItems],
  );

  const batchCondition = useMemo(() => {
    if (!batch) return null;
    return {
      indicatorId: batch.indicatorId,
      indicatorName: batch.indicatorName,
      methodId: batch.methodId,
      methodName: batch.methodName,
      specimenTypeId: batch.specimenTypeId,
      specimenTypeName: batch.specimenTypeName,
    };
  }, [batch]);

  const loadAvailableIndicators = useCallback(async () => {
    if (!batch) return;
    setLoadingItems(true);
    try {
      const res = await testBatchService.getAvailableIndicators({
        indicatorId: batch.indicatorId,
        methodId: batch.methodId,
        specimenTypeId: batch.specimenTypeId,
        maxResultCount: 500,
      });
      setAvailableItems(res.data?.items || []);
    } catch {
      message.error("Lỗi tải danh sách chỉ tiêu khả dụng");
    } finally {
      setLoadingItems(false);
    }
  }, [batch]);

  useEffect(() => {
    if (open && batch) {
      const originals: SelectedItem[] = batch.items.map((item) => ({
        id: item.laboratoryTaskIndicatorId,
        contractNumber: item.contractNumber,
        sampleCode: item.sampleCode,
        sampleName: item.sampleName,
        technicianName: item.technicianName,
        hasResult: !!item.result,
        isOriginal: true,
      }));
      setSelectedItems(originals);
      setOriginalItemIds(
        new Set(batch.items.map((i) => i.laboratoryTaskIndicatorId)),
      );
      loadAvailableIndicators();
    }
  }, [open, batch, loadAvailableIndicators]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    return items;
  }, [availableItems, searchText]);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const handleAddItem = (item: AvailableIndicatorDto) => {
    if (selectedIds.has(item.id) || item.isAlreadyInBatch) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        id: item.id,
        contractNumber: item.contractNumber,
        sampleCode: item.sampleCode,
        sampleName: item.sampleName,
        technicianName: item.technicianName,
        requestCompletionDate: item.requestCompletionDate,
        hasResult: false,
        isOriginal: false,
      },
    ]);
    setSelectedError(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSave = async () => {
    if (!batch) return;
    if (selectedItems.length === 0) {
      setSelectedError(true);
      return;
    }

    setLoading(true);
    try {
      const currentIds = new Set(selectedItems.map((i) => i.id));
      const toAdd = selectedItems
        .filter((i) => !originalItemIds.has(i.id))
        .map((i) => i.id);
      const toRemoveTaskIndicatorIds = [...originalItemIds].filter(
        (id) => !currentIds.has(id),
      );

      if (toRemoveTaskIndicatorIds.length > 0) {
        const batchItemIds = batch.items
          .filter((i) =>
            toRemoveTaskIndicatorIds.includes(i.laboratoryTaskIndicatorId),
          )
          .map((i) => i.id);
        if (batchItemIds.length > 0) {
          await testBatchService.removeItems(batch.id, batchItemIds);
        }
      }

      if (toAdd.length > 0) {
        await testBatchService.addItems(batch.id, toAdd);
      }

      message.success("Cập nhật mẻ thành công");
      handleClose();
      onSaved();
    } catch (err: any) {
      message.error(
        err?.response?.data?.error?.message || "Lỗi cập nhật mẻ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchText("");
    setAvailableItems([]);
    setSelectedItems([]);
    setOriginalItemIds(new Set());
    setSelectedError(false);
    onClose();
  };

  return (
    <Modal
      title={`Chỉnh sửa mẻ: ${batch?.code || ""}`}
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      confirmLoading={loading}
      width={1100}
      centered
      okText="Lưu thay đổi"
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
                  const isInOtherBatch =
                    item.isAlreadyInBatch && !originalItemIds.has(item.id);

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
                          background: isSelected
                            ? "#f6ffed"
                            : "#fff",
                          opacity: isInOtherBatch ? 0.6 : 1,
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
                                Ngày gửi KP: {item.sampleSentDate ? dayjs(item.sampleSentDate).format("DD/MM/YYYY") : "—"}
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
                              <Tooltip
                                title={
                                  isInOtherBatch
                                    ? "Đã thuộc mẻ khác"
                                    : "Thêm vào mẻ"
                                }
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  disabled={isInOtherBatch}
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
          {batchCondition && (
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Điều kiện mẻ:
              </Text>
              <Space wrap size={4}>
                {batchCondition.specimenTypeName && (
                  <Tag>{batchCondition.specimenTypeName}</Tag>
                )}
                <Tag color="blue">{batchCondition.indicatorName}</Tag>
                <Tag color="green">{batchCondition.methodName}</Tag>
              </Space>
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
                    background: !item.isOriginal ? "#e6f7ff" : "#fafafa",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      HĐ - {item.contractNumber || "—"}
                      {!item.isOriginal && (
                        <Tag
                          color="blue"
                          style={{ fontSize: 10, marginLeft: 6 }}
                        >
                          Mới
                        </Tag>
                      )}
                      {item.hasResult && (
                        <Tag
                          color="orange"
                          style={{ fontSize: 10, marginLeft: 6 }}
                        >
                          Có KQ
                        </Tag>
                      )}
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
                  {!item.hasResult && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
          {selectedError && (
            <div style={{ color: "#ff4d4f", fontSize: 12, marginBottom: 12 }}>
              Vui lòng chọn ít nhất 1 chỉ tiêu
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditBatchModal;
