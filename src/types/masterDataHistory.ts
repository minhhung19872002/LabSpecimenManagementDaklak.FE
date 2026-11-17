/**
 * Loại danh mục hỗ trợ xem lịch sử — trùng key BE (MasterDataHistoryTypes.ByKey)
 */
export type MasterDataHistoryEntityType =
  | "departments"
  | "laboratories"
  | "sampleTypeCategories"
  | "sampleConditions"
  | "specimenTypes"
  | "testMethods"
  | "standards"
  | "storageLocations"
  | "indicators"
  | "indicatorGroups"
  | "testResultValues"
  | "notes"
  | "customers"
  | "organizations";

const MASTER_DATA_HISTORY_ENTITY_TYPES: readonly MasterDataHistoryEntityType[] = [
  "departments",
  "laboratories",
  "sampleTypeCategories",
  "sampleConditions",
  "specimenTypes",
  "testMethods",
  "standards",
  "storageLocations",
  "indicators",
  "indicatorGroups",
  "testResultValues",
  "notes",
  "customers",
  "organizations",
];

export const isMasterDataHistoryEntityType = (
  value: string,
): value is MasterDataHistoryEntityType =>
  (MASTER_DATA_HISTORY_ENTITY_TYPES as readonly string[]).includes(value);

export interface MasterDataPropertyChangeDto {
  propertyName: string;
  displayName: string;
  originalValue?: string | null;
  newValue?: string | null;
}

export interface MasterDataChangeDto {
  id: string;
  changeTime: string;
  /** Created | Updated | Deleted */
  changeType: string;
  /** Tạo mới / Sửa / Ngừng hoạt động / Kích hoạt lại / Xóa */
  action: string;
  userName?: string | null;
  properties: MasterDataPropertyChangeDto[];
}
