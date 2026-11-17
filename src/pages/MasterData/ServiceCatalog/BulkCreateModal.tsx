import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  Input,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Modal,
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
import { CheckCircleFilled, DeleteOutlined, PlusOutlined, SearchOutlined } from "../../../components/common/Icon";
import { specimenKeyOf, toApiDate } from "./ServiceCatalog/utils";

export interface BulkCreatePrefill {
  testMethodId?: string;
  indicatorId?: string;
  /** null = Mọi nền mẫu */
  specimenTypeId?: string | null;
}

export interface BulkCreateModalProps {
  open: boolean;
  /** Điền sẵn khi mở (nhấp đúp ô trống / đang lọc 1 phương pháp) */
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

/** Đang chọn nền mẫu cho: "common" = nền mẫu dùng chung, còn lại = indicatorId của dòng */
interface PickerState {
  target: "common" | string;
  selected: string[];
}

const SECTION_HEAD: React.CSSProperties = { background: "#E6F7FF" };
const NO_CATEGORY = "Khác";
const PREVIEW_LIMIT = 16;

/** Nội dung 3 bước: 1 phương pháp × nhiều chỉ tiêu × nhiều nền mẫu, cùng giá / TAT */
const BulkCreateForm: React.FC<Omit<BulkCreateModalProps, "open">> = ({
  prefill,
  testMethods,
  specimenTypes,
  indicators,
  indicatorGroups,
  existingServices,
  onDone,
  onCancel,
}) => {
  const initialSpecimens = prefill?.specimenTypeId ? [prefill.specimenTypeId] : [];
  const [testMethodId, setTestMethodId] = useState<string | undefined>(prefill?.testMethodId);
  const [pickingMethod, setPickingMethod] = useState(!prefill?.testMethodId);
  const [methodQuery, setMethodQuery] = useState("");
  const [commonSpecimenIds, setCommonSpecimenIds] = useState<string[]>(initialSpecimens);
  const [rows, setRows] = useState<DraftRow[]>(
    prefill?.indicatorId ? [{ indicatorId: prefill.indicatorId, specimenTypeIds: initialSpecimens }] : []
  );
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [tat, setTat] = useState<number | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Dayjs>(dayjs());
  const [isSubcontract, setIsSubcontract] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const indicatorMap = useMemo(() => new Map(indicators.map((i) => [i.id, i])), [indicators]);
  const specimenMap = useMemo(() => new Map(specimenTypes.map((s) => [s.id, s])), [specimenTypes]);
  const activeSpecimens = useMemo(() => specimenTypes.filter((s) => s.isActive), [specimenTypes]);
  const activeIndicators = useMemo(() => indicators.filter((i) => i.isActive), [indicators]);

  const serviceCountByMethod = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of existingServices) counts.set(s.testMethodId, (counts.get(s.testMethodId) ?? 0) + 1);
    return counts;
  }, [existingServices]);

  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of existingServices) {
      if (s.testMethodId === testMethodId) keys.add(`${s.indicatorId}|${specimenKeyOf(s.specimenTypeId)}`);
    }
    return keys;
  }, [existingServices, testMethodId]);

  const activeMethods = useMemo(() => testMethods.filter((m) => m.isActive && m.name !== "-"), [testMethods]);
  const filteredMethods = useMemo(() => {
    const q = methodQuery.trim().toLowerCase();
    return q
      ? activeMethods.filter((m) => `${m.code} ${m.name}`.toLowerCase().includes(q))
      : activeMethods;
  }, [activeMethods, methodQuery]);
  const selectedMethod = testMethods.find((m) => m.id === testMethodId);

  const addedIds = useMemo(() => new Set(rows.map((r) => r.indicatorId)), [rows]);
  const groupChips = useMemo(
    () =>
      indicatorGroups
        .filter((g) => g.isActive)
        .map((g) => {
          const ids = activeIndicators.filter((i) => i.indicatorGroupId === g.id).map((i) => i.id);
          return { id: g.id, name: g.name, total: ids.length, remaining: ids.filter((id) => !addedIds.has(id)) };
        })
        .filter((g) => g.total > 0),
    [indicatorGroups, activeIndicators, addedIds]
  );
  const indicatorOptions = useMemo(
    () =>
      activeIndicators
        .filter((i) => !addedIds.has(i.id))
        .map((i) => ({
          value: i.id,
          label: `${i.code} - ${i.name}${i.indicatorGroupName ? ` (${i.indicatorGroupName})` : ""}`,
        })),
    [activeIndicators, addedIds]
  );

  const addIndicators = (ids: string[]) => {
    setError(null);
    setRows((prev) => {
      const added = new Set(prev.map((r) => r.indicatorId));
      const next = ids
        .filter((id) => !added.has(id))
        .map((id) => ({ indicatorId: id, specimenTypeIds: commonSpecimenIds }));
      return [...prev, ...next];
    });
  };

  const existingOf = (row: DraftRow): (string | null)[] => {
    const keys = row.specimenTypeIds.length > 0 ? row.specimenTypeIds : [null];
    return keys.filter((sid) => existingKeys.has(`${row.indicatorId}|${specimenKeyOf(sid)}`));
  };
  const specimenName = (sid: string | null) => (sid ? specimenMap.get(sid)?.name ?? "?" : "Mọi nền mẫu");

  const combos = rows.flatMap((r) => {
    const existing = new Set(existingOf(r));
    const keys = r.specimenTypeIds.length > 0 ? r.specimenTypeIds : [null];
    return keys
      .filter((sid) => !existing.has(sid))
      .map((sid) => `${indicatorMap.get(r.indicatorId)?.name ?? "?"} × ${specimenName(sid)}`);
  });
  const skippedCount = rows.reduce((sum, r) => sum + existingOf(r).length, 0);
  const step = !testMethodId || pickingMethod ? 0 : rows.length === 0 ? 1 : 2;

  // ---------- Picker nền mẫu ----------
  const openPicker = (target: PickerState["target"]) => {
    const current =
      target === "common" ? commonSpecimenIds : rows.find((r) => r.indicatorId === target)?.specimenTypeIds ?? [];
    setPickerQuery("");
    setPicker({ target, selected: current });
  };
  const pickerExisting = useMemo(() => {
    if (!picker || picker.target === "common") return new Set<string>();
    return new Set(activeSpecimens.filter((s) => existingKeys.has(`${picker.target}|${s.id}`)).map((s) => s.id));
  }, [picker, activeSpecimens, existingKeys]);
  const pickerGroups = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const groups = new Map<string, SpecimenTypeDto[]>();
    for (const s of activeSpecimens) {
      const cat = s.sampleTypeCategoryName || NO_CATEGORY;
      if (q && !`${s.name} ${cat}`.toLowerCase().includes(q)) continue;
      groups.set(cat, [...(groups.get(cat) ?? []), s]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [activeSpecimens, pickerQuery]);

  const setPickerSelected = (updater: (prev: string[]) => string[]) =>
    setPicker((prev) => (prev ? { ...prev, selected: updater(prev.selected) } : prev));

  const applyPicker = () => {
    if (!picker) return;
    if (picker.target === "common") setCommonSpecimenIds(picker.selected);
    else
      setRows((prev) =>
        prev.map((r) => (r.indicatorId === picker.target ? { ...r, specimenTypeIds: picker.selected } : r))
      );
    setPicker(null);
  };

  const removeRowSpecimen = (indicatorId: string, sid: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.indicatorId === indicatorId ? { ...r, specimenTypeIds: r.specimenTypeIds.filter((x) => x !== sid) } : r
      )
    );

  // ---------- Lưu ----------
  const handleSubmit = async () => {
    if (!testMethodId) return setError("Chọn phương pháp ở Bước 1.");
    if (rows.length === 0) return setError("Thêm ít nhất 1 chỉ tiêu ở Bước 2.");
    if (combos.length === 0) return setError("Mọi tổ hợp đã có dịch vụ — không có gì để tạo.");
    if (unitPrice == null) return setError("Nhập Giá.");
    if (tat == null) return setError("Nhập TAT (ngày).");
    setError(null);
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tạo được dịch vụ"));
    } finally {
      setSaving(false);
    }
  };

  const rowColumns: ColumnsType<DraftRow> = [
    {
      title: `Chỉ tiêu (${rows.length})`,
      key: "indicator",
      width: 240,
      render: (_, r) => {
        const ind = indicatorMap.get(r.indicatorId);
        return ind ? (
          <span style={{ display: "inline-flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 500 }}>
              <IndicatorName name={ind.name} formattedName={ind.formattedName} />
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {ind.code}
              {ind.indicatorGroupName ? ` · ${ind.indicatorGroupName}` : ""}
            </Typography.Text>
          </span>
        ) : (
          r.indicatorId
        );
      },
    },
    {
      title: "Nền mẫu sẽ tạo dịch vụ",
      key: "specimens",
      render: (_, r) => {
        const existing = existingOf(r);
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {r.specimenTypeIds.map((sid) => (
              <Tag
                key={sid}
                color={existing.includes(sid) ? "default" : "blue"}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  removeRowSpecimen(r.indicatorId, sid);
                }}
                style={{ margin: 0 }}
              >
                {specimenName(sid)}
              </Tag>
            ))}
            {r.specimenTypeIds.length === 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Mọi nền mẫu
              </Typography.Text>
            )}
            <Button size="small" type="dashed" onClick={() => openPicker(r.indicatorId)}>
              + Nền mẫu
            </Button>
            {existing.length > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Đã có DV: {existing.map(specimenName).join(", ")} (bỏ qua)
              </Typography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Số DV",
      key: "count",
      width: 70,
      align: "right",
      render: (_, r) => (r.specimenTypeIds.length || 1) - existingOf(r).length,
    },
    {
      key: "remove",
      width: 48,
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          danger
          title="Bỏ chỉ tiêu"
          icon={<DeleteOutlined />}
          onClick={() => setRows((prev) => prev.filter((x) => x.indicatorId !== r.indicatorId))}
        />
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Steps
        size="small"
        current={step}
        items={[{ title: "Chọn phương pháp" }, { title: "Chọn chỉ tiêu & nền mẫu" }, { title: "Nhập giá & lưu" }]}
        style={{ maxWidth: 720 }}
      />

      {/* Bước 1 */}
      <Card
        size="small"
        title="Bước 1 · Chọn 1 phương pháp làm gốc"
        extra={pickingMethod && <Typography.Text type="secondary">{filteredMethods.length} phương pháp</Typography.Text>}
        styles={{ header: SECTION_HEAD }}
      >
        {!pickingMethod && selectedMethod ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Space size={10}>
              <CheckCircleFilled style={{ color: "#52c41a", fontSize: 22 }} />
              <span style={{ display: "inline-flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 500, fontSize: 15 }}>{selectedMethod.name}</span>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedMethod.code} · {serviceCountByMethod.get(selectedMethod.id) ?? 0} dịch vụ hiện có
                </Typography.Text>
              </span>
            </Space>
            <Button onClick={() => setPickingMethod(true)}>Đổi phương pháp</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input
              autoFocus
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Gõ tên hoặc mã phương pháp..."
              value={methodQuery}
              onChange={(e) => setMethodQuery(e.target.value)}
              style={{ maxWidth: 520 }}
            />
            <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #F0F0F0", borderRadius: 8 }}>
              {filteredMethods.map((m) => {
                const current = m.id === testMethodId;
                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setTestMethodId(m.id);
                      setPickingMethod(false);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setTestMethodId(m.id);
                        setPickingMethod(false);
                      }
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px minmax(200px, 1fr) 140px 90px",
                      gap: 10,
                      alignItems: "center",
                      minHeight: 40,
                      padding: "4px 12px",
                      borderBottom: "1px solid #F0F0F0",
                      background: current ? "#E6F7FF" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: `1px solid ${current ? "#1890FF" : "#D9D9D9"}`,
                        boxShadow: "inset 0 0 0 3px #fff",
                        background: current ? "#1890FF" : "#fff",
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {m.code}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12, textAlign: "right" }}>
                      {serviceCountByMethod.get(m.id) ?? 0} DV
                    </Typography.Text>
                  </div>
                );
              })}
              {filteredMethods.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#8c8c8c" }}>
                  Không tìm thấy phương pháp phù hợp
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {!testMethodId ? (
        <div
          style={{
            padding: "28px 12px",
            border: "1px dashed #D9D9D9",
            borderRadius: 8,
            textAlign: "center",
            color: "#8c8c8c",
          }}
        >
          Chọn một phương pháp ở Bước 1 để bắt đầu thêm chỉ tiêu và nền mẫu.
        </div>
      ) : (
        <>
          {/* Bước 2 */}
          <Card
            size="small"
            title={
              <span style={{ display: "inline-flex", flexDirection: "column", padding: "4px 0" }}>
                <span>Bước 2 · Chọn chỉ tiêu và nền mẫu</span>
                <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                  Mỗi dòng là 1 chỉ tiêu · mỗi nền mẫu gắn trên dòng = 1 dịch vụ sẽ được tạo.
                </Typography.Text>
              </span>
            }
            extra={
              <Typography.Text strong style={{ color: "#096DD9" }}>
                Sẽ tạo {combos.length} dịch vụ
              </Typography.Text>
            }
            styles={{ header: SECTION_HEAD }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px dashed #91D5FF",
                  background: "#F0F9FF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "inline-flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500 }}>① Nền mẫu dùng chung (nên chọn trước)</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Chọn 1 lần — mọi chỉ tiêu thêm sau sẽ tự nhận các nền mẫu này, sau đó chỉnh riêng từng dòng nếu
                      cần. Bỏ trống = Mọi nền mẫu.
                    </Typography.Text>
                  </span>
                  <Space wrap>
                    <Button onClick={() => openPicker("common")}>Chọn nền mẫu chung</Button>
                    <Button
                      disabled={rows.length === 0}
                      onClick={() => setRows((prev) => prev.map((r) => ({ ...r, specimenTypeIds: commonSpecimenIds })))}
                    >
                      Áp dụng cho tất cả dòng
                    </Button>
                  </Space>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {commonSpecimenIds.map((sid) => (
                    <Tag
                      key={sid}
                      color="blue"
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        setCommonSpecimenIds((prev) => prev.filter((x) => x !== sid));
                      }}
                      style={{ margin: 0, background: "#fff" }}
                    >
                      {specimenName(sid)}
                    </Tag>
                  ))}
                  {commonSpecimenIds.length === 0 && (
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      Chưa chọn nền mẫu chung.
                    </Typography.Text>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontWeight: 500 }}>② Thêm chỉ tiêu</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {groupChips.map((g) => (
                    <Button
                      key={g.id}
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={g.remaining.length === 0}
                      onClick={() => addIndicators(g.remaining)}
                      style={{ color: g.remaining.length ? "#096DD9" : undefined, borderColor: g.remaining.length ? "#1890FF" : undefined }}
                    >
                      Cả nhóm {g.name} ({g.total})
                    </Button>
                  ))}
                </div>
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="Hoặc gõ tên / mã chỉ tiêu để thêm từng cái..."
                  value={null}
                  options={indicatorOptions}
                  onSelect={(id: string | null) => id && addIndicators([id])}
                  style={{ maxWidth: 520 }}
                  suffixIcon={<SearchOutlined />}
                />
              </div>

              <Table
                columns={rowColumns}
                dataSource={rows}
                rowKey="indicatorId"
                size="small"
                bordered={false}
                pagination={rows.length > 20 ? { pageSize: 20, size: "small" } : false}
                locale={{ emptyText: "Chưa có chỉ tiêu — thêm cả nhóm hoặc tìm từng chỉ tiêu ở trên." }}
                footer={
                  rows.length > 0
                    ? () => (
                        <div style={{ textAlign: "right" }}>
                          <Button size="small" onClick={() => setRows([])}>
                            Bỏ tất cả chỉ tiêu
                          </Button>
                        </div>
                      )
                    : undefined
                }
              />
            </div>
          </Card>

          {/* Bước 3 */}
          <Card
            size="small"
            title="Bước 3 · Giá & TAT dùng chung cho tất cả dịch vụ ở Bước 2"
            styles={{ header: SECTION_HEAD }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>
                    <span style={{ color: "#ff4d4f" }}>* </span>Giá (VNĐ)
                  </span>
                  <NumericFormat
                    value={unitPrice ?? ""}
                    onValueChange={(v) => setUnitPrice(v.floatValue ?? null)}
                    allowNegative={false}
                    decimalScale={0}
                    thousandSeparator="."
                    decimalSeparator=","
                    customInput={Input}
                    addonAfter="đ"
                    placeholder="VD: 250.000"
                    style={{ width: "100%" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>
                    <span style={{ color: "#ff4d4f" }}>* </span>TAT (ngày)
                  </span>
                  <NumericFormat
                    value={tat ?? ""}
                    onValueChange={(v) => setTat(v.floatValue ?? null)}
                    allowNegative={false}
                    decimalScale={0}
                    customInput={Input}
                    addonAfter="ngày"
                    placeholder="VD: 5"
                    style={{ width: "100%" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>
                    <span style={{ color: "#ff4d4f" }}>* </span>Ngày áp dụng
                  </span>
                  <DatePicker
                    value={effectiveDate}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    onChange={(v) => v && setEffectiveDate(v)}
                    style={{ width: "100%" }}
                  />
                </label>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
                  <Checkbox checked={isSubcontract} onChange={(e) => setIsSubcontract(e.target.checked)}>
                    Dịch vụ thầu phụ
                  </Checkbox>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 8,
                  background: "#FAFAFA",
                  border: "1px solid #F0F0F0",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>
                    {selectedMethod?.name} · {rows.length} chỉ tiêu → {combos.length} dịch vụ mới
                    {skippedCount > 0 && (
                      <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                        {" "}
                        (bỏ qua {skippedCount} đã có)
                      </Typography.Text>
                    )}
                  </span>
                  <Space>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" size="large" loading={saving} onClick={handleSubmit}>
                      Tạo {combos.length} dịch vụ
                    </Button>
                  </Space>
                </div>
                {error && <Alert type="error" showIcon message={error} />}
                {combos.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {combos.slice(0, PREVIEW_LIMIT).map((c) => (
                      <Tag key={c} color="blue" style={{ margin: 0 }}>
                        {c}
                      </Tag>
                    ))}
                    {combos.length > PREVIEW_LIMIT && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        + {combos.length - PREVIEW_LIMIT} dịch vụ nữa
                      </Typography.Text>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      <Drawer
        open={!!picker}
        width={540}
        destroyOnHidden
        onClose={() => setPicker(null)}
        title={
          <span style={{ display: "inline-flex", flexDirection: "column" }}>
            <span>
              {picker?.target === "common"
                ? "Chọn nền mẫu dùng chung"
                : `Nền mẫu cho ${indicatorMap.get(picker?.target ?? "")?.name ?? ""}`}
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              Tick nền mẫu hoặc cả nhóm · bỏ trống = Mọi nền mẫu
            </Typography.Text>
          </span>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography.Text strong style={{ color: "#096DD9" }}>
              Đã chọn {picker?.selected.length ?? 0} nền mẫu
            </Typography.Text>
            <Space>
              <Button onClick={() => setPickerSelected(() => [])}>Bỏ chọn hết</Button>
              <Button type="primary" onClick={applyPicker}>
                Xong
              </Button>
            </Space>
          </div>
        }
      >
        <Input
          autoFocus
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm nền mẫu hoặc nhóm (VD: nước, thủy sản)..."
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          style={{ marginBottom: 4 }}
        />
        {pickerGroups.map(([cat, items]) => {
          const free = items.filter((s) => !pickerExisting.has(s.id)).map((s) => s.id);
          const checkedCount = free.filter((id) => picker?.selected.includes(id)).length;
          return (
            <div key={cat} style={{ marginTop: 12, border: "1px solid #F0F0F0", borderRadius: 8, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 40,
                  padding: "0 12px",
                  background: "#FAFAFA",
                  fontWeight: 500,
                }}
              >
                <Checkbox
                  disabled={free.length === 0}
                  checked={free.length > 0 && checkedCount === free.length}
                  indeterminate={checkedCount > 0 && checkedCount < free.length}
                  onChange={(e) =>
                    setPickerSelected((prev) =>
                      e.target.checked ? [...new Set([...prev, ...free])] : prev.filter((id) => !free.includes(id))
                    )
                  }
                >
                  {cat}
                </Checkbox>
                <Typography.Text type="secondary" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 400 }}>
                  {checkedCount}/{items.length}
                </Typography.Text>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {items.map((s) =>
                  pickerExisting.has(s.id) ? (
                    <span
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minHeight: 40,
                        padding: "0 12px",
                        borderTop: "1px solid #F0F0F0",
                        background: "#F5F5F5",
                        color: "#8c8c8c",
                      }}
                    >
                      {s.name}
                      <span style={{ marginLeft: "auto", fontSize: 11 }}>đã có DV</span>
                    </span>
                  ) : (
                    <Checkbox
                      key={s.id}
                      checked={picker?.selected.includes(s.id)}
                      onChange={(e) =>
                        setPickerSelected((prev) =>
                          e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                        )
                      }
                      style={{ minHeight: 40, padding: "0 12px", borderTop: "1px solid #F0F0F0", alignItems: "center", margin: 0 }}
                    >
                      {s.name}
                    </Checkbox>
                  )
                )}
              </div>
            </div>
          );
        })}
        {pickerGroups.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#8c8c8c" }}>Không tìm thấy nền mẫu</div>
        )}
      </Drawer>
    </div>
  );
};

/** Modal "Tạo dịch vụ hàng loạt" — đóng là hủy toàn bộ nháp, mở lại nhận prefill mới */
const BulkCreateModal: React.FC<BulkCreateModalProps> = ({ open, onCancel, ...rest }) => (
  <Modal
    open={open}
    title="Tạo dịch vụ hàng loạt"
    width={1120}
    footer={null}
    destroyOnHidden
    maskClosable={false}
    onCancel={onCancel}
    styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 } }}
  >
    <BulkCreateForm {...rest} onCancel={onCancel} />
  </Modal>
);

export default BulkCreateModal;
