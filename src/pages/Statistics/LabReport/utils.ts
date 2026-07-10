import dayjs, { Dayjs } from "dayjs";

export type FilterPeriod = "month" | "quarter" | "half_year" | "year";

export const getDateRangeForPeriod = (period: FilterPeriod): [Dayjs, Dayjs] => {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1;
  switch (period) {
    case "month":
      return [now.startOf("month"), now.endOf("month")];
    case "quarter": {
      const q = Math.ceil(month / 3);
      const qStart = (q - 1) * 3;
      return [dayjs().month(qStart).startOf("month"), dayjs().month(qStart + 2).endOf("month")];
    }
    case "half_year":
      return month <= 6
        ? [dayjs(`${year}-01-01`), dayjs(`${year}-06-30`)]
        : [dayjs(`${year}-07-01`), dayjs(`${year}-12-31`)];
    case "year":
      return [now.startOf("year"), now.endOf("year")];
    default:
      return [now.startOf("month"), now.endOf("month")];
  }
};

export const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toString();
};

export const formatCurrencyFull = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
