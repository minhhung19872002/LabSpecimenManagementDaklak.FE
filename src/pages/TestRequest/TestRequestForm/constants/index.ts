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

// Helper: Strip HTML tags từ string
const stripHtmlTags = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

// Helper: Normalize tên chỉ tiêu để so sánh
// - Strip HTML tags
// - Normalize Unicode (NFC form) - giống BE để đảm bảo consistent
// - Trim + lowercase
const normalizeIndicatorName = (name: string | undefined | null): string => {
  const stripped = stripHtmlTags(name || "");
  // Normalize Unicode to NFC form (same as BE: NormalizationForm.FormC)
  // This ensures "Hàm lượng" from different sources compare equal
  const normalized = stripped.normalize('NFC');
  return normalized.trim().toLowerCase();
};

// Helper: Kiểm tra xem một list tên chỉ tiêu có đủ combo kim loại nặng không
export const isHeavyMetalComboMet = (indicatorNames: (string | undefined | null)[]): boolean => {
  const normalizedNames = indicatorNames.map(normalizeIndicatorName);
  const normalizedComboNames = HEAVY_METAL_COMBO_INDICATORS.map(normalizeIndicatorName);

  return normalizedComboNames.every((comboName) =>
    normalizedNames.includes(comboName)
  );
};

// Helper: Kiểm tra xem một chỉ tiêu có phải là Hg (được miễn phí khi có combo) không
export const isHgIndicator = (indicatorName: string | undefined | null): boolean => {
  return normalizeIndicatorName(indicatorName) === normalizeIndicatorName(HEAVY_METAL_FREE_INDICATOR);
};
