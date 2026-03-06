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

// Helper: Kiểm tra tên có chứa "Nước" không (case-insensitive, NFC normalized)
const containsNuoc = (name?: string | null): boolean => {
  if (!name) return false;
  const normalized = name.normalize('NFC').toLowerCase();
  const target = 'nước'.normalize('NFC');
  return normalized.includes(target);
};

// Helper: Kiểm tra xem một list tên chỉ tiêu có đủ combo kim loại nặng không
// Nếu nền mẫu là "Nước" (chứa từ "Nước" trong tên loại mẫu hoặc tên danh mục) thì không áp dụng combo
export const isHeavyMetalComboMet = (
  indicatorNames: (string | undefined | null)[],
  sampleTypeCategoryName?: string | null,
  specimenTypeName?: string | null,
): boolean => {
  // Mẫu nước không được khuyến mãi combo kim loại nặng
  // Check cả tên danh mục loại mẫu (category) và tên loại mẫu (specimen type)
  if (containsNuoc(sampleTypeCategoryName) || containsNuoc(specimenTypeName)) {
    return false;
  }

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

// ============================================================
// Combo E.Coli + Coliform: khi cả 2 cùng có trong 1 sample thì E.Coli miễn phí
// ============================================================

// Các tên khác nhau của Coliform (Coliforms = Coliform Tổng số)
const COLIFORM_NAMES = ["Coliforms", "Coliform Tổng số"];
// Các tên khác nhau của E.Coli (E.Coli = Escherichia coli)
const ECOLI_NAMES = ["E.Coli", "Escherichia coli"];

// Helper: Kiểm tra tên chỉ tiêu có match với 1 trong các tên cho trước không
const matchesAnyName = (
  indicatorName: string | undefined | null,
  names: string[],
): boolean => {
  const normalized = normalizeIndicatorName(indicatorName);
  return names.some((n) => normalizeIndicatorName(n) === normalized);
};

// Helper: Kiểm tra xem một chỉ tiêu có phải là Coliform không
export const isColiformIndicator = (indicatorName: string | undefined | null): boolean => {
  return matchesAnyName(indicatorName, COLIFORM_NAMES);
};

// Helper: Kiểm tra xem một chỉ tiêu có phải là E.Coli không
export const isEcoliIndicator = (indicatorName: string | undefined | null): boolean => {
  return matchesAnyName(indicatorName, ECOLI_NAMES);
};

// Helper: Kiểm tra xem sample có đủ combo E.Coli + Coliform không
// Cần ít nhất 1 chỉ tiêu E.Coli VÀ 1 chỉ tiêu Coliform
export const isEcoliColiformComboMet = (
  indicatorNames: (string | undefined | null)[],
): boolean => {
  const hasColiform = indicatorNames.some((name) => isColiformIndicator(name));
  const hasEcoli = indicatorNames.some((name) => isEcoliIndicator(name));
  return hasColiform && hasEcoli;
};
