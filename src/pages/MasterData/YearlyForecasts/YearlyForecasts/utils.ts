import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";

/** BR-01 + BR-03: tiêu hao / mẫu = tổng tiêu hao 1 mẻ ÷ số mẫu dự toán, làm tròn 4 chữ số */
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

export interface ForecastMethodGroup {
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  rows: YearlyForecastRowDto[];
  missingCount: number;
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
      };
      groups.set(row.testMethodId, group);
    }
    group.rows.push(row);
    const value = getValue(row);
    if (!value || value <= 0) group.missingCount++;
  }
  return [...groups.values()];
};

export const serviceLabel = (row: Pick<YearlyForecastRowDto, "indicatorName" | "specimenTypeName">): string =>
  row.specimenTypeName ? `${row.indicatorName} · ${row.specimenTypeName}` : row.indicatorName;
