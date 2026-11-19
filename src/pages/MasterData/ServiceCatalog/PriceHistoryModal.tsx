import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { NumericFormat } from "react-number-format";
import {
  serviceCatalogService,
  ServicePriceVersionStatus,
  type ServiceCatalogItemDto,
  type ServicePriceVersionDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { formatDateTime } from "../../../utils/formatters";
import { formatPrice, formatShortDate, serviceDisplayName } from "./ServiceCatalog/utils";

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

/** Lịch sử phiên bản giá + đổi giá (áp dụng ngay hôm nay, giữ lịch sử version) */
const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ service, canEdit, onChanged, onClose }) => {
  const [versions, setVersions] = useState<ServicePriceVersionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
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

  const columns: ColumnsType<ServicePriceVersionDto> = [
    { title: "Ngày áp dụng", key: "date", width: 120, render: (_, v) => (v.effectiveDate ? formatShortDate(v.effectiveDate) : "Giá gốc") },
    { title: "Đơn giá", dataIndex: "unitPrice", key: "price", width: 120, align: "right", render: (v) => formatPrice(v) },
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
              <Divider style={{ margin: "16px 0 12px" }}>Đổi giá (áp dụng từ hôm nay)</Divider>
              <Row gutter={12} align="bottom">
                <Col span={7}>
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
                <Col span={13}>
                  <div>Ghi chú</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do đổi giá" />
                </Col>
                <Col span={4}>
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
