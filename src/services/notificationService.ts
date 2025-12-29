import api from './api';

const BASE_URL = '/api/v1/notifications';

// Notification Type Enum - For QLKT (LabTechnicalManager)
export enum NotificationType {
  SampleSentToLab = 0,              // Mẫu đã gửi đến khoa phòng
  PendingWorkAssignment = 1,        // Chưa phân công công việc
  SingleIndicatorSubmitted = 2,     // KTV gửi 1 chỉ tiêu
  MultipleIndicatorsSubmitted = 3,  // KTV gửi nhiều chỉ tiêu
  SingleResultRejectedByQM = 4,     // QLCL từ chối 1 kết quả
  MultipleResultsRejectedByQM = 5,  // QLCL từ chối nhiều kết quả
  ResultApprovedByQM = 6,           // QLCL duyệt kết quả
  NewSamplesAdded = 7,              // Có mẫu/chỉ tiêu mới thêm
  SamplesCancelled = 8,             // Mẫu/chỉ tiêu bị hủy
}

// Labels for NotificationType
export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.SampleSentToLab]: 'Mẫu gửi đến khoa phòng',
  [NotificationType.PendingWorkAssignment]: 'Chưa phân công công việc',
  [NotificationType.SingleIndicatorSubmitted]: 'Chỉ tiêu cần phê duyệt',
  [NotificationType.MultipleIndicatorsSubmitted]: 'Nhiều chỉ tiêu cần phê duyệt',
  [NotificationType.SingleResultRejectedByQM]: 'Kết quả bị từ chối',
  [NotificationType.MultipleResultsRejectedByQM]: 'Nhiều kết quả bị từ chối',
  [NotificationType.ResultApprovedByQM]: 'Kết quả được phê duyệt',
  [NotificationType.NewSamplesAdded]: 'Có mẫu/chỉ tiêu mới',
  [NotificationType.SamplesCancelled]: 'Mẫu/chỉ tiêu bị hủy',
};

// Notification DTO
export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  creationTime: string;
  deadlineDate?: string;
  senderName?: string;
  itemCount?: number;
  additionalData?: string;
  daysRemaining?: number;
}

// Paged result DTO
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

// Paged request params
export interface PagedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
}

// Get notifications input with filters
export interface GetNotificationsInput extends PagedResultRequestDto {
  isRead?: boolean;
  type?: NotificationType;
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  getMyNotifications: async (params: GetNotificationsInput = {}): Promise<PagedResultDto<NotificationDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
    if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
    if (params.isRead !== undefined) apiParams.IsRead = params.isRead;
    if (params.type !== undefined) apiParams.Type = params.type;

    const response = await api.get<PagedResultDto<NotificationDto>>(BASE_URL, { params: apiParams });
    return response.data;
  },

  /**
   * Lấy số thông báo chưa đọc
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<number>(`${BASE_URL}/unread-count`);
    return response.data;
  },

  /**
   * Đánh dấu đã đọc một thông báo
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/mark-read`);
  },

  /**
   * Đánh dấu đã đọc tất cả thông báo
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post(`${BASE_URL}/mark-all-read`);
  }
};

export default notificationService;
