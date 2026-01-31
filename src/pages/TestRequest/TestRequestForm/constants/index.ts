// Fields that are locked when status >= InProgress
export const LOCKED_FIELDS = [
  "contractNumber",
  "contractDate",
  "customerName",
  "address",
  "taxCode",
  "contactPerson",
  "phone",
  "province",
  "ward",
];

// Combo kim loại nặng: khi đủ 4 chỉ tiêu này trong 1 sample thì Hg được miễn phí
export const HEAVY_METAL_COMBO_INDICATORS = [
  "Hàm lượng Chì (Pb)",
  "Hàm lượng Asen (As)",
  "Hàm lượng Cadimi (Cd)",
  "Hàm lượng Thủy ngân (Hg)",
];

export const HEAVY_METAL_FREE_INDICATOR = "Hàm lượng Thủy ngân (Hg)";

// Helper: Normalize tên chỉ tiêu để so sánh (trim + lowercase)
const normalizeIndicatorName = (name: string | undefined | null): string => {
  return (name || "").trim().toLowerCase();
};

// Helper: Kiểm tra xem một list tên chỉ tiêu có đủ combo kim loại nặng không
export const isHeavyMetalComboMet = (indicatorNames: (string | undefined | null)[]): boolean => {
  const normalizedNames = indicatorNames.map(normalizeIndicatorName);
  return HEAVY_METAL_COMBO_INDICATORS.every((comboName) =>
    normalizedNames.includes(normalizeIndicatorName(comboName))
  );
};

// Helper: Kiểm tra xem một chỉ tiêu có phải là Hg (được miễn phí khi có combo) không
export const isHgIndicator = (indicatorName: string | undefined | null): boolean => {
  return normalizeIndicatorName(indicatorName) === normalizeIndicatorName(HEAVY_METAL_FREE_INDICATOR);
};
