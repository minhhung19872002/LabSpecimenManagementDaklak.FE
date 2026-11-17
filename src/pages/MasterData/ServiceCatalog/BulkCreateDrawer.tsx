import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { NumericFormat } from "react-number-format";
import type {
  IndicatorDto,
  IndicatorGroupDto,
  SpecimenTypeDto,
  TestMethodDto,
} from "../../../services/masterDataService";
import { serviceCatalogService, type ServiceCatalogItemDto } from "../../../services/serviceCatalogService";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { IndicatorName } from "../../../components/common";
import { DeleteOutlined, PlusOutlined } from "../../../components/common/Icon";
import { specimenKeyOf, toApiDate } from "./ServiceCatalog/utils";

export interface BulkCreatePrefill {
  testMethodId?: string;
  indicatorId?: string;
  /** null = Mọi nền mẫu */
  specimenTypeId?: string | null;
}

export interface BulkCreateDrawerProps {
  open: boolean;
  prefill: BulkCreatePrefill | null;
  testMethods: TestMethodDto[];
  specimenTypes: SpecimenTypeDto[];
  indicators: IndicatorDto[];
  indicatorGroups: IndicatorGroupDto[];
  /** Dịch vụ đang có — đánh dấu "đã có DV" (BE tự bỏ qua) */
  existingServices: ServiceCatalogItemDto[];
  onDone: () => void;
  onCancel: () => void;
}

interface DraftRow {
  indicatorId: string;
  /** Rỗng = Mọi nền mẫu */
  specimenTypeIds: string[];
}

/** Tạo dịch vụ hàng loạt: 1 phương pháp × nhiều chỉ tiêu × nhiều nền mẫu, cùng giá / TAT */
const BulkCreateDrawer: React.FC<BulkCreateDrawerProps> = ({
  open,
  prefill,
  testMethods,
  specimenTypes,
  indicators,
  indicatorGroups,
  existingServices,
  onDone,
  onCancel,
}) => {
  const [testMethodId, setTestMethodId] = useState<string | undefined>();
  const [commonSpecimenIds, setCommonSpecimenIds] = useState<string[]>([]);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [pickIndicatorIds, setPickIndicatorIds] = useState<string[]>([]);
  const [pickGroupId, setPickGroupId] = useState<string | undefined>();
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [tat, setTat] = useState<number | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Dayjs>(dayjs());
  const [isSubcontract, setIsSubcontract] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const specimenIds = prefill?.specimenTypeId ? [prefill.specimenTypeId] : [];
    setTestMethodId(prefill?.testMethodId);
    setCommonSpecimenIds(specimenIds);
    setRows(prefill?.indicatorId ? [{ indicatorId: prefill.indicatorId, specimenTypeIds: specimenIds }] : []);
    setPickIndicatorIds([]);
    setPickGroupId(undefined);
    setUnitPrice(null);
    setTat(null);
    setEffectiveDate(dayjs());
    setIsSubcontract(false);
  }, [open, prefill]);

  const indicatorMap = useMemo(() => new Map(indicators.map((i) => [i.id, i])), [indicators]);
  const specimenMap = useMemo(() => new Map(specimenTypes.map((s) => [s.id, s])), [specimenTypes]);

  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of existingServices) {
      if (s.testMethodId === testMethodId) keys.add(`${s.indicatorId}|${specimenKeyOf(s.specimenTypeId)}`);
    }
    return keys;
  }, [existingServices, testMethodId]);

  const methodOptions = useMemo(
    () =>
      testMethods
        .filter((m) => m.isActive && m.name !== "-")
        .map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` })),
    [testMethods]
  );
  const specimenOptions = useMemo(
    () => specimenTypes.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [specimenTypes]
  );
  const indicatorOptions = useMemo(() => {
    const added = new Set(rows.map((r) => r.indicatorId));
    return indicators
      .filter((i) => i.isActive && !added.has(i.id))
      .map((i) => ({
        value: i.id,
        label: `${i.code} - ${i.name}${i.indicatorGroupName ? ` (${i.indicatorGroupName})` : ""}`,
      }));
  }, [indicators, rows]);

  const addIndicators = (ids: string[]) => {
    setRows((prev) => {
      const added = new Set(prev.map((r) => r.indicatorId));
      const next = ids.filter((id) => !added.has(id)).map((id) => ({ indicatorId: id, specimenTypeIds: commonSpecimenIds }));
      return [...prev, ...next];
    });
  };

  const handleAddGroup = () => {
    if (!pickGroupId) return;
    addIndicators(indicators.filter((i) => i.isActive && i.indicatorGroupId === pickGroupId).map((i) => i.id));
    setPickGroupId(undefined);
  };

  const existingOf = (row: DraftRow): string[] => {
    const keys = row.specimenTypeIds.length > 0 ? row.specimenTypeIds : [null];
    return keys
      .filter((sid) => existingKeys.has(`${row.indicatorId}|${specimenKeyOf(sid)}`))
      .map((sid) => (sid ? specimenMap.get(sid)?.name ?? "?" : "Mọi nền mẫu"));
  };

  const newCount = rows.reduce((sum, r) => {
    const total = r.specimenTypeIds.length > 0 ? r.specimenTypeIds.length : 1;
    return sum + total - existingOf(r).length;
  }, 0);

  const handleSubmit = async () => {
    if (!testMethodId) return message.warning("Chọn phương pháp");
    if (rows.length === 0) return message.warning("Thêm ít nhất 1 chỉ tiêu");
    if (unitPrice == null) return message.warning("Nhập đơn giá");
    if (tat == null) return message.warning("Nhập thời gian trả kết quả (TAT)");
    setSaving(true);
    try {
      const result = await serviceCatalogService.bulkCreate({
        testMethodId,
        rows,
        unitPrice,
        turnaroundDays: tat,
        effectiveDate: toApiDate(effectiveDate),
        isSubcontract,
      });
      message.success(
        `Đã tạo ${result.createdCount} dịch vụ${result.skippedCount ? `, bỏ qua ${result.skippedCount} đã có` : ""}`
      );
      onDone();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không tạo được dịch vụ"));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<DraftRow> = [
    {
      title: "Chỉ tiêu",
      key: "indicator",
      render: (_, r) => {
        const ind = indicatorMap.get(r.indicatorId);
        return ind ? (
          <span>
            <IndicatorName name={ind.name} formattedName={ind.formattedName} />
            <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
              {ind.code}
            </Typography.Text>
          </span>
        ) : (
          r.indicatorId
        );
      },
    },
    {
      title: "Nền mẫu (bỏ trống = Mọi nền mẫu)",
      key: "specimens",
      width: 340,
      render: (_, r, idx) => (
        <Select
          mode="multiple"
          allowClear
          size="small"
          optionFilterProp="label"
          placeholder="Mọi nền mẫu"
          value={r.specimenTypeIds}
          options={specimenOptions}
          onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, specimenTypeIds: v } : x)))}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "",
      key: "existing",
      width: 160,
      render: (_, r) => {
        const existing = existingOf(r);
        return existing.length > 0 ? (
          <Tag color="orange" style={{ whiteSpace: "normal" }}>
            Đã có DV: {existing.join(", ")}
          </Tag>
        ) : null;
      },
    },
    {
      key: "remove",
      width: 40,
      render: (_, __, idx) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
        />
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      title="Tạo dịch vụ hàng loạt"
      width={960}
      onClose={onCancel}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" loading={saving} disabled={newCount <= 0} onClick={handleSubmit}>
            Tạo {newCount > 0 ? `${newCount} dịch vụ` : ""}
          </Button>
        </Space>
      }
    >
      <Divider titlePlacement="start" style={{ marginTop: 0 }}>
        Bước 1 · Phương pháp
      </Divider>
      <Select
        showSearch
        optionFilterProp="label"
        placeholder="Chọn phương pháp"
        value={testMethodId}
        onChange={setTestMethodId}
        options={methodOptions}
        style={{ width: "100%" }}
      />

      <Divider titlePlacement="start">Bước 2 · Chỉ tiêu & nền mẫu</Divider>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col flex="auto">
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            placeholder="Nền mẫu chung cho chỉ tiêu thêm mới (bỏ trống = Mọi nền mẫu)"
            value={commonSpecimenIds}
            onChange={setCommonSpecimenIds}
            options={specimenOptions}
            style={{ width: "100%" }}
          />
        </Col>
        <Col>
          <Button
            disabled={rows.length === 0}
            onClick={() => setRows((prev) => prev.map((r) => ({ ...r, specimenTypeIds: commonSpecimenIds })))}
          >
            Áp cho mọi dòng
          </Button>
        </Col>
      </Row>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col flex="auto">
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn chỉ tiêu"
            value={pickIndicatorIds}
            onChange={setPickIndicatorIds}
            options={indicatorOptions}
            style={{ width: "100%" }}
            maxTagCount="responsive"
          />
        </Col>
        <Col>
          <Button
            icon={<PlusOutlined />}
            disabled={pickIndicatorIds.length === 0}
            onClick={() => {
              addIndicators(pickIndicatorIds);
              setPickIndicatorIds([]);
            }}
          >
            Thêm
          </Button>
        </Col>
        <Col span={7}>
          <Space.Compact style={{ width: "100%" }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Nhóm chỉ tiêu"
              value={pickGroupId}
              onChange={setPickGroupId}
              options={indicatorGroups.filter((g) => g.isActive).map((g) => ({ value: g.id, label: g.name }))}
              style={{ width: "100%" }}
            />
            <Button disabled={!pickGroupId} onClick={handleAddGroup}>
              + Cả nhóm
            </Button>
          </Space.Compact>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="indicatorId"
        size="small"
        pagination={false}
        scroll={{ y: 360 }}
        locale={{ emptyText: "Chưa thêm chỉ tiêu" }}
      />

      <Divider titlePlacement="start">Bước 3 · Giá & thời gian trả kết quả</Divider>
      <Row gutter={12}>
        <Col span={7}>
          <div>Đơn giá</div>
          <NumericFormat
            value={unitPrice ?? ""}
            onValueChange={(v) => setUnitPrice(v.floatValue ?? null)}
            allowNegative={false}
            decimalScale={0}
            thousandSeparator="."
            decimalSeparator=","
            customInput={Input}
            addonAfter="đ"
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={5}>
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
        <Col span={6}>
          <div>Ngày áp dụng</div>
          <DatePicker
            value={effectiveDate}
            format="DD/MM/YYYY"
            allowClear={false}
            onChange={(v) => v && setEffectiveDate(v)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={6} style={{ paddingTop: 22 }}>
          <Checkbox checked={isSubcontract} onChange={(e) => setIsSubcontract(e.target.checked)}>
            Thầu phụ
          </Checkbox>
        </Col>
      </Row>
    </Drawer>
  );
};

export default BulkCreateDrawer;
