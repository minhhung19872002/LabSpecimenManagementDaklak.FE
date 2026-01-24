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
  "Xác định hàm lượng Chì (Pb)",
  "Xác định hàm lượng Asen (As)",
  "Xác định hàm lượng Cadimi (Cd)",
  "Xác định hàm lượng Thủy ngân (Hg)",
];

export const HEAVY_METAL_FREE_INDICATOR = "Xác định hàm lượng Thủy ngân (Hg)";
