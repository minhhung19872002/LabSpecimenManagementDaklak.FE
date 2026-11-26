import type { IndicatorGroupDto } from "../services/masterDataService";

/**
 * Nhóm chỉ tiêu KHÔNG bắt buộc: chỉ tiêu không nhóm được gom vào nhánh ảo "Chưa phân nhóm"
 * để các màn chọn chỉ tiêu dạng cây (nhóm → chỉ tiêu) không bỏ sót.
 */
export const UNGROUPED_ID = "__none__";
export const UNGROUPED_NAME = "Chưa phân nhóm";

/** Khóa nhóm dùng khi gom chỉ tiêu theo nhóm (không nhóm → UNGROUPED_ID) */
export const indicatorGroupKey = (groupId?: string | null): string => groupId || UNGROUPED_ID;

/** Danh sách nhóm + nhánh ảo "Chưa phân nhóm" ở cuối (nhánh rỗng sẽ bị lọc bởi nơi dùng) */
export const withUngroupedGroup = (groups: IndicatorGroupDto[]): IndicatorGroupDto[] => [
  ...groups,
  { id: UNGROUPED_ID, name: UNGROUPED_NAME, isActive: true, indicatorCount: 0, creationTime: "" },
];

/** Gom chỉ tiêu theo khóa nhóm (indicatorGroupKey) */
export const groupIndicatorsByGroup = <T extends { indicatorGroupId?: string | null }>(
  indicators: T[],
): Record<string, T[]> => {
  const grouped: Record<string, T[]> = {};
  for (const indicator of indicators) {
    const key = indicatorGroupKey(indicator.indicatorGroupId);
    (grouped[key] ??= []).push(indicator);
  }
  return grouped;
};
