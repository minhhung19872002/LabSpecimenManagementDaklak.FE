import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, DatePicker, Divider, Input, Modal, Popconfirm, Row, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { NumericFormat } from "react-number-format";
import {
  serviceCatalogService,
  ServicePriceVersionStatus,
  type ServiceCatalogItemDto,
  type ServicePriceVersionDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { DeleteOutlined } from "../../../components/common/Icon";
import { formatDateTime } from "../../../utils/formatters";
import { formatPrice, formatShortDate, serviceDisplayName, toApiDate } from "./ServiceCatalog/utils";

export interface PriceHistoryModalProps {
  service: ServiceCatalogItemDto | null;
  canEdit: boolean;
  onChanged: (service: ServiceCatalogItemDto) => void;
  onClose: () => void;
}

const STATUS_TAG: Record<ServicePriceVersionStatus, React.ReactNode> = {
  [ServicePriceVersionStatus.Current]: <Tag color="green">Đang áp dụng</Tag>,
  [ServicePriceVersionStatus.Upcoming]: <Tag color="gold">Sắp áp dụng</Tag>,
  [ServicePriceVersionStatus.Replaced]: <Tag>Đã thay thế</Tag>,
};

/** Lịch sử phiên bản giá + thêm phiên bản mới (đổi giá / TAT theo ngày áp dụng) */
const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ service, canEdit, onChanged, onClose }) => {
  const [versions, setVersions] = useState<ServicePriceVersionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [tat, setTat] = useState<number | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Dayjs>(dayjs());
  const [note, setNote] = useState("");

  const serviceId = service?.id;

  const loadVersions = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setVersions(await serviceCatalogService.getPriceVersions(id));
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tải được lịch sử giá"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!serviceId || !service) return;
    setPrice(service.unitPrice);
    setTat(service.turnaroundDays ?? null);
    setEffectiveDate(dayjs());
    setNote("");
    loadVersions(serviceId);
    // Chỉ reset khi đổi dịch vụ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, loadVersions]);

  const handleSave = async () => {
    if (!service) return;
    if (price == null) {
      message.warning("Nhập đơn giá");
      return;
    }
    setSaving(true);
    try {
      const updated = await serviceCatalogService.setPrice(service.id, {
        unitPrice: price,
        turnaroundDays: tat,
        effectiveDate: toApiDate(effectiveDate),
        note: note.trim() || undefined,
      });
      message.success("Đã lưu phiên bản giá");
      onChanged(updated);
      await loadVersions(service.id);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được giá"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (version: ServicePriceVersionDto) => {
    if (!service) return;
    try {
      await serviceCatalogService.deletePriceVersion(version.id);
      message.success("Đã xóa phiên bản giá");
      await loadVersions(service.id);
      const list = await serviceCatalogService.getList({
        testMethodId: service.testMethodId,
        keyword: service.serviceCode ?? undefined,
      });
      const updated = list.find((s) => s.id === service.id);
      if (updated) onChanged(updated);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không xóa được phiên bản giá"));
    }
  };

  const columns: ColumnsType<ServicePriceVersionDto> = [
    { title: "Ngày áp dụng", key: "date", width: 120, render: (_, v) => (v.effectiveDate ? formatShortDate(v.effectiveDate) : "Giá gốc") },
    { title: "Đơn giá", dataIndex: "unitPrice", key: "price", width: 120, align: "right", render: (v) => formatPrice(v) },
    { title: "TAT", dataIndex: "turnaroundDays", key: "tat", width: 70, align: "right", render: (v) => (v != null ? `${v} ngày` : "—") },
    { title: "Trạng thái", dataIndex: "status", key: "status", width: 120, render: (s: ServicePriceVersionStatus) => STATUS_TAG[s] },
    { title: "Ghi chú", dataIndex: "note", key: "note", render: (v) => v || "—" },
    {
      title: "Người tạo",
      key: "creator",
      width: 150,
      render: (_, v) => (
        <span style={{ fontSize: 12 }}>
          {v.creatorName || "—"}
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {formatDateTime(v.creationTime)}
          </Typography.Text>
        </span>
      ),
    },
  ];
  if (canEdit) {
    columns.push({
      key: "actions",
      width: 50,
      render: (_, v) =>
        v.status === ServicePriceVersionStatus.Upcoming ? (
          <Popconfirm title="Xóa phiên bản giá sắp áp dụng?" okText="Xóa" cancelText="Hủy" onConfirm={() => handleDelete(v)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    });
  }

  return (
    <Modal
      open={!!service}
      title={service ? `Lịch sử giá — ${service.serviceCode ?? ""}` : ""}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={900}
    >
      {service && (
        <>
          <Typography.Paragraph type="secondary">{serviceDisplayName(service)}</Typography.Paragraph>
          <Table
            columns={columns}
            dataSource={versions}
            rowKey="id"
            size="small"
            loading={loading}
            pagination={false}
            scroll={{ y: 300 }}
          />
          {canEdit && (
            <>
              <Divider style={{ margin: "16px 0 12px" }}>Thêm phiên bản giá</Divider>
              <Row gutter={12} align="bottom">
                <Col span={6}>
                  <div>Đơn giá</div>
                  <NumericFormat
                    value={price ?? ""}
                    onValueChange={(v) => setPrice(v.floatValue ?? null)}
                    allowNegative={false}
                    decimalScale={0}
                    thousandSeparator="."
                    decimalSeparator=","
                    customInput={Input}
                    addonAfter="đ"
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col span={4}>
                  <div>TAT</div>
                  <NumericFormat
                    value={tat ?? ""}
                    onValueChange={(v) => setTat(v.floatValue ?? null)}
                    allowNegative={false}
                    decimalScale={0}
                    customInput={Input}
                    addonAfter="ngày"
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col span={5}>
                  <div>Ngày áp dụng</div>
                  <DatePicker
                    value={effectiveDate}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    disabledDate={(d) => d.isBefore(dayjs(), "day")}
                    onChange={(v) => v && setEffectiveDate(v)}
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col span={6}>
                  <div>Ghi chú</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do đổi giá" />
                </Col>
                <Col span={3}>
                  <Button type="primary" block loading={saving} onClick={handleSave}>
                    Lưu
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default PriceHistoryModal;
