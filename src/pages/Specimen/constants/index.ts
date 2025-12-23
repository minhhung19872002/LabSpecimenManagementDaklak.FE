import { SpecimenStatus } from "../../../types/specimen";

export const SPECIMEN_STATUS_CONFIG: Record<
  SpecimenStatus,
  { color: string; text: string }
> = {
  [SpecimenStatus.Received]: { color: "blue", text: "Đã nhận" },
  [SpecimenStatus.Testing]: { color: "processing", text: "Đang thử nghiệm" },
  [SpecimenStatus.Storage]: { color: "cyan", text: "Lưu kho" },
  [SpecimenStatus.Disposal]: { color: "warning", text: "Chờ hủy" },
  [SpecimenStatus.Destroyed]: { color: "error", text: "Đã hủy" },
  [SpecimenStatus.ReturnedToCustomer]: { color: "success", text: "Đã trả khách" },
};

export const UNIT_OPTIONS = [
  { value: "mẫu", label: "mẫu" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
];

export const STORAGE_CONDITION_OPTIONS = [
  { value: "2-8°C", label: "2-8°C (Lạnh)" },
  { value: "-20°C", label: "-20°C (Đông lạnh)" },
  { value: "Nhiệt độ phòng", label: "Nhiệt độ phòng" },
];

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [50, 100, 150];

export const MESSAGES = {
  DELETE_SUCCESS: "Xóa mẫu thành công!",
  DELETE_ERROR: "Không thể xóa mẫu. Vui lòng thử lại.",
  CREATE_SUCCESS: (count: number) => `Thêm ${count} mẫu mới thành công!`,
  UPDATE_SUCCESS: "Cập nhật mẫu thành công!",
  SAVE_ERROR: "Không thể lưu mẫu. Vui lòng thử lại.",
  DOWNLOAD_TEMPLATE_SUCCESS: "Tải template thành công!",
  DOWNLOAD_TEMPLATE_ERROR: "Không thể tải template. Vui lòng thử lại.",
};
