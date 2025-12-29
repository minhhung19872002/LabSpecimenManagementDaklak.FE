/**
 * Trạng thái quản lý mẫu lưu kho
 */
export enum SampleStorageStatus {
  /** Đã nhận mẫu */
  Received = 0,
  /** Cần hủy mẫu (HĐ hoàn thành + 5 ngày) */
  PendingDisposal = 1,
  /** Đã hủy (tất cả mẫu đã hủy) */
  Disposed = 2,
}

/**
 * Labels cho SampleStorageStatus
 */
export const SampleStorageStatusLabels: Record<SampleStorageStatus, string> = {
  [SampleStorageStatus.Received]: "Đã nhận",
  [SampleStorageStatus.PendingDisposal]: "Cần hủy mẫu",
  [SampleStorageStatus.Disposed]: "Đã hủy",
};

/**
 * Colors cho SampleStorageStatus (Ant Design Tag)
 */
export const SampleStorageStatusColors: Record<SampleStorageStatus, string> = {
  [SampleStorageStatus.Received]: "blue",
  [SampleStorageStatus.PendingDisposal]: "warning",
  [SampleStorageStatus.Disposed]: "default",
};

/**
 * DTO cho danh sách quản lý mẫu (hiển thị theo HĐ/phiếu yêu cầu)
 */
export interface SampleStorageDto {
  id: string;
  contractNumber: string;
  customerName: string;
  totalSampleCount: number;
  storageDate: string | null;
  status: SampleStorageStatus;
  cancelledCount: number;
}

/**
 * DTO cho từng mẫu trong chi tiết quản lý mẫu
 */
export interface SampleStorageItemDto {
  id: string;
  sampleCode: string;
  sampleName: string;
  specimenTypeName: string | null;
  storageDate: string | null;
  sampleQuantity: string | null;
  statusText: string | null;
  isCancelled: boolean;
  cancelledDate: string | null;
  /** Cần hủy mẫu (được set bởi cronjob khi HĐ hoàn thành + 5 ngày) */
  needDisposal: boolean;
  /** Ngày được đánh dấu cần hủy */
  needDisposalDate: string | null;
}

/**
 * DTO chi tiết quản lý mẫu (HĐ + danh sách mẫu)
 */
export interface SampleStorageDetailDto {
  id: string;
  contractNumber: string;
  customerName: string;
  totalSampleCount: number;
  storageDate: string | null;
  status: SampleStorageStatus;
  samples: SampleStorageItemDto[];
}

/**
 * Input DTO cho lấy danh sách quản lý mẫu
 */
export interface GetSampleStorageListDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: SampleStorageStatus;
}

/**
 * Input DTO để cập nhật thông tin mẫu
 */
export interface UpdateSampleDto {
  sampleName?: string;
  storageDate?: string;
  sampleQuantity?: string;
  statusText?: string;
}
