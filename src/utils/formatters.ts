import dayjs from "dayjs";

/**
 * Format date to DD/MM/YYYY format
 * @param date - Date string or null/undefined
 * @returns Formatted date string or "-" if no date
 */
export const formatDate = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY") : "-";

/**
 * Format date to DD/MM/YYYY HH:mm format
 * @param date - Date string or null/undefined
 * @returns Formatted datetime string or "-" if no date
 */
export const formatDateTime = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-";

/**
 * Format currency value to Vietnamese VND format
 * @param value - Number value
 * @returns Formatted currency string with VND suffix
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

/**
 * Format number with thousands separator
 * @param value - Number value
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

/**
 * Parse scientific notation result string to number
 * Supports formats:
 * - Plain number: "200", "0.5", "1,5"
 * - Scientific notation: "2,0 x 10^2", "1.5 x 10^-3", "2,0x10^2"
 * - With multiplication sign variations: "x", "×", "*"
 *
 * @param result - Result string to parse
 * @param decimalPlaces - Number of decimal places (default: 4)
 * @returns Parsed number rounded to specified decimal places, or null if cannot parse
 *
 * @example
 * parseResultToNumber("2,0 x 10^2") // returns 200.0000
 * parseResultToNumber("1,5 x 10^-3") // returns 0.0015
 * parseResultToNumber("200") // returns 200.0000
 * parseResultToNumber("Âm tính") // returns null
 */
export const parseResultToNumber = (
  result: string | null | undefined,
  decimalPlaces: number = 4
): number | null => {
  if (!result || typeof result !== "string") {
    return null;
  }

  // Trim and normalize the string
  let normalized = result.trim();

  // Replace Vietnamese decimal separator (comma) with dot
  // But be careful with scientific notation like "2,0 x 10^2"

  // Check if it's scientific notation pattern: number x 10^exponent
  // Patterns: "2,0 x 10^2", "2.0 x 10^2", "2,0x10^2", "2,0 × 10^2", "2,0 * 10^2"
  const scientificPattern = /^([+-]?\d+[,.]?\d*)\s*[x×*]\s*10\^([+-]?\d+)$/i;
  const match = normalized.match(scientificPattern);

  if (match) {
    // Scientific notation format
    const mantissa = parseFloat(match[1].replace(",", "."));
    const exponent = parseInt(match[2], 10);

    if (isNaN(mantissa) || isNaN(exponent)) {
      return null;
    }

    const value = mantissa * Math.pow(10, exponent);
    return parseFloat(value.toFixed(decimalPlaces));
  }

  // Try parsing as plain number
  // Replace comma with dot for Vietnamese format
  normalized = normalized.replace(",", ".");

  // Remove any whitespace
  normalized = normalized.replace(/\s/g, "");

  // Check if it's a valid number
  const num = parseFloat(normalized);

  if (isNaN(num)) {
    return null;
  }

  return parseFloat(num.toFixed(decimalPlaces));
};

/**
 * Compare result value with limit
 * @param result - Result string (can be scientific notation)
 * @param limit - Limit value (number)
 * @param decimalPlaces - Decimal places for comparison (default: 4)
 * @returns Object with comparison result:
 *   - parsedValue: The parsed numeric value (or null if not parseable)
 *   - isWithinLimit: true if result <= limit, false if result > limit, null if cannot compare
 *   - canCompare: true if both values are numeric and can be compared
 *
 * @example
 * compareResultWithLimit("2,0 x 10^2", 500)
 * // returns { parsedValue: 200, isWithinLimit: true, canCompare: true }
 *
 * compareResultWithLimit("2,0 x 10^3", 500)
 * // returns { parsedValue: 2000, isWithinLimit: false, canCompare: true }
 *
 * compareResultWithLimit("Âm tính", 500)
 * // returns { parsedValue: null, isWithinLimit: null, canCompare: false }
 */
export const compareResultWithLimit = (
  result: string | null | undefined,
  limit: number | string | null | undefined,
  decimalPlaces: number = 4
): {
  parsedValue: number | null;
  isWithinLimit: boolean | null;
  canCompare: boolean;
} => {
  const parsedValue = parseResultToNumber(result, decimalPlaces);

  // Cannot compare if result is not a number
  if (parsedValue === null) {
    return {
      parsedValue: null,
      isWithinLimit: null,
      canCompare: false,
    };
  }

  // Convert limit to number (handle string input)
  const numericLimit = typeof limit === "string" ? parseFloat(limit) : limit;

  // Cannot compare if limit is not defined or not a valid number
  if (numericLimit === null || numericLimit === undefined || isNaN(numericLimit)) {
    return {
      parsedValue,
      isWithinLimit: null,
      canCompare: false,
    };
  }

  return {
    parsedValue,
    isWithinLimit: parsedValue <= numericLimit,
    canCompare: true,
  };
};