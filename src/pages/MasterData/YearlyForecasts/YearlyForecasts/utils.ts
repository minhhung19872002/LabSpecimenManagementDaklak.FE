import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";

/** BR-01 + BR-03: lượng ghi nhận / mẫu = Tiêu hao / mẫu (L3) ÷ số mẫu dự toán, làm tròn 4 chữ số */
export const computePerSample = (batchQuantity: number, estimatedSamples?: number | null): number | null => {
  if (!estimatedSamples || estimatedSamples <= 0) return null;
  return Math.round((batchQuantity / estimatedSamples) * 10000) / 10000;
};

export const formatSamples = (value?: number | null): string =>
  value == null ? "—" : value.toLocaleString("vi-VN");

export const formatPerSample = (value?: number | null): string =>
  value == null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });

/** Tab năm: T-1 (khóa), T, T+1 */
export const getForecastYears = (currentYear: number): number[] => [currentYear - 1, currentYear, currentYear + 1];

/** Nhãn tab năm: "2025 · đã khóa", "2026 · hiện hành", "2027" */
export const getYearLabel = (year: number, currentYear: number): string => {
  if (year < currentYear) return `${year} · đã khóa`;
  if (year === currentYear) return `${year} · hiện hành`;
  return String(year);
};

export interface ForecastRule {
  code: string;
  text: string;
}

export const FORECAST_RULES: ForecastRule[] = [
  { code: "Unique", text: "[Mã dịch vụ + Năm dự toán] — 1 dịch vụ / 1 năm chỉ có 1 dự toán." },
  { code: "WF-1", text: "Đầu năm, Clone dữ liệu năm cũ sang năm mới (chỉ điền các dòng còn trống), sau đó sửa lại số mẫu dự toán." },
  { code: "BR-01-03", text: "Tiêu hao 1 phép thử = Định mức theo mẻ (Level 3) ÷ Số mẫu dự toán năm, làm tròn 4 chữ số thập phân." },
  { code: "BR-02-04", text: "Dự toán trống / 0 ở năm của ngày trả kết quả → hiện popup “Thiết lập dự toán” khi chấp nhận thử nghiệm, chưa ghi nhận được tiêu hao." },
  { code: "BR-07", text: "Sau 31/12, bản ghi năm cũ chuyển Read-Only." },
];

export interface ForecastMethodGroup {
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  rows: YearlyForecastRowDto[];
  missingCount: number;
  /** Tổng số mẫu dự toán (gồm cả số đang sửa) */
  estimatedTotal: number;
  previousTotal: number;
}

/** Gom dòng theo phương pháp, giữ thứ tự BE trả về */
export const groupByMethod = (
  rows: YearlyForecastRowDto[],
  getValue: (row: YearlyForecastRowDto) => number | null | undefined
): ForecastMethodGroup[] => {
  const groups = new Map<string, ForecastMethodGroup>();
  for (const row of rows) {
    let group = groups.get(row.testMethodId);
    if (!group) {
      group = {
        testMethodId: row.testMethodId,
        testMethodCode: row.testMethodCode,
        testMethodName: row.testMethodName,
        rows: [],
        missingCount: 0,
        estimatedTotal: 0,
        previousTotal: 0,
      };
      groups.set(row.testMethodId, group);
    }
    group.rows.push(row);
    const value = getValue(row);
    if (!value || value <= 0) group.missingCount++;
    else group.estimatedTotal += value;
    group.previousTotal += row.previousYearSamples ?? 0;
  }
  return [...groups.values()];
};

export const serviceLabel = (row: Pick<YearlyForecastRowDto, "indicatorName" | "specimenTypeName">): string =>
  row.specimenTypeName ? `${row.indicatorName} · ${row.specimenTypeName}` : row.indicatorName;
