import React, { useEffect, useMemo, useState } from "react";
import { Col, Input, Modal, Radio, Row, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { NumericFormat } from "react-number-format";
import {
  BulkPriceAdjustMode,
  serviceCatalogService,
  type ServiceCatalogItemDto,
} from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { basisPriceAt, computeAdjustedPrice, formatPrice, PENDING_PRICE_LABEL, toApiDate } from "./ServiceCatalog/utils";

export interface BulkPriceModalProps {
  open: boolean;
  services: ServiceCatalogItemDto[];
  onDone: () => void;
  onCancel: () => void;
}

interface PreviewRow {
  id: string;
  serviceCode?: string | null;
  name: string;
  /** null = Chờ định giá → BE bỏ qua */
  oldPrice: number | null;
  newPrice: number | null;
}

/**
 * Cập nhật giá hàng loạt theo % hoặc số tiền, áp dụng ngay hôm nay, có xem trước (cùng cách làm tròn với BE).
 * Dịch vụ Chờ định giá không có giá gốc → bỏ qua.
 */
const BulkPriceModal: React.FC<BulkPriceModalProps> = ({ open, services, onDone, onCancel }) => {
  const [mode, setMode] = useState<BulkPriceAdjustMode>(BulkPriceAdjustMode.Percent);
  const [increase, setIncrease] = useState(true);
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(BulkPriceAdjustMode.Percent);
      setIncrease(true);
      setValue(null);
    }
  }, [open]);

  const invalidPercent = mode === BulkPriceAdjustMode.Percent && !increase && (value ?? 0) > 100;

  const preview = useMemo<PreviewRow[]>(() => {
    const today = toApiDate(dayjs());
    return services.map((s) => {
      const oldPrice = basisPriceAt(s, today);
      return {
        id: s.id,
        serviceCode: s.serviceCode,
        name: `${s.indicatorName} · ${s.specimenTypeName || "Mọi nền mẫu"}`,
        oldPrice,
        newPrice: oldPrice == null || value == null ? oldPrice : computeAdjustedPrice(oldPrice, mode, increase, value),
      };
    });
  }, [services, mode, increase, value]);

  const pendingCount = useMemo(() => preview.filter((r) => r.oldPrice == null).length, [preview]);

  const handleOk = async () => {
    if (value == null || value <= 0) {
      message.warning("Nhập mức điều chỉnh");
      return;
    }
    if (invalidPercent) {
      message.warning("Giảm giá không được quá 100%");
      return;
    }
    setSaving(true);
    try {
      const result = await serviceCatalogService.bulkUpdatePrice({
        serviceIds: services.map((s) => s.id),
        mode,
        increase,
        value,
        effectiveDate: toApiDate(dayjs()),
        turnaroundDays: null,
      });
      message.success(`Đã cập nhật giá ${result.updatedCount} dịch vụ`);
      onDone();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không cập nhật được giá"));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<PreviewRow> = [
    { title: "Mã DV", dataIndex: "serviceCode", key: "code", width: 100 },
    { title: "Dịch vụ", dataIndex: "name", key: "name" },
    {
      title: "Giá cũ",
      dataIndex: "oldPrice",
      key: "old",
      width: 120,
      align: "right",
      render: (v) =>
        v == null ? (
          <Tag color="gold" style={{ margin: 0 }}>
            {PENDING_PRICE_LABEL}
          </Tag>
        ) : (
          formatPrice(v)
        ),
    },
    {
      title: "Giá mới",
      dataIndex: "newPrice",
      key: "new",
      width: 120,
      align: "right",
      render: (v, r) =>
        v == null ? (
          <Typography.Text type="secondary">Bỏ qua</Typography.Text>
        ) : (
          <b style={{ color: v !== r.oldPrice ? "#1677ff" : undefined }}>{formatPrice(v)}</b>
        ),
    },
  ];

  return (
    <Modal
      open={open}
      title={`Cập nhật giá hàng loạt — ${services.length} dịch vụ`}
      okText="Áp dụng"
      cancelText="Hủy"
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
      width={820}
    >
      <Row gutter={[12, 12]} align="bottom" style={{ marginBottom: 12 }}>
        <Col span={7}>
          <div>Kiểu điều chỉnh</div>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            optionType="button"
            options={[
              { value: BulkPriceAdjustMode.Percent, label: "Theo %" },
              { value: BulkPriceAdjustMode.Amount, label: "Số tiền" },
            ]}
          />
        </Col>
        <Col span={6}>
          <div>Tăng / giảm</div>
          <Radio.Group
            value={increase}
            onChange={(e) => setIncrease(e.target.value)}
            optionType="button"
            options={[
              { value: true, label: "Tăng" },
              { value: false, label: "Giảm" },
            ]}
          />
        </Col>
        <Col span={5}>
          <div>Mức</div>
          <NumericFormat
            value={value ?? ""}
            onValueChange={(v) => setValue(v.floatValue ?? null)}
            allowNegative={false}
            decimalScale={mode === BulkPriceAdjustMode.Percent ? 2 : 0}
            thousandSeparator="."
            decimalSeparator=","
            customInput={Input}
            addonAfter={mode === BulkPriceAdjustMode.Percent ? "%" : "đ"}
            status={invalidPercent ? "error" : undefined}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Giá mới làm tròn tới đồng, không âm, áp dụng ngay hôm nay. Mỗi dịch vụ tạo 1 phiên bản giá mới (giữ lịch sử).
        {pendingCount > 0 && ` ${pendingCount} dịch vụ ${PENDING_PRICE_LABEL.toLowerCase()} sẽ bị bỏ qua.`}
      </Typography.Text>
      <Table
        columns={columns}
        dataSource={preview}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 320 }}
        style={{ marginTop: 8 }}
      />
    </Modal>
  );
};

export default BulkPriceModal;
