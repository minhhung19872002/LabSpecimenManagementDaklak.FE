export const formatCurrency = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return "-";
  return val.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";
};

export const formatNumber = (val: number | null | undefined, decimals = 2): string => {
  if (val == null || isNaN(val)) return "-";
  return val.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
};

export const safeDivCeil = (
  a: number | null | undefined,
  b: number | null | undefined,
): number | null => {
  if (a == null || b == null || b === 0) return null;
  return Math.ceil(a / b);
};

export const safeDiv = (
  a: number | null | undefined,
  b: number | null | undefined,
): number | null => {
  if (a == null || b == null || b === 0) return null;
  return a / b;
};

export const safeMul = (
  a: number | null | undefined,
  b: number | null | undefined,
): number | null => {
  if (a == null || b == null) return null;
  return a * b;
};
