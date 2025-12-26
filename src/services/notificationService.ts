import api from './api';

const BASE_URL = '/api/v1/notifications';

// Notification Type Enum
export enum NotificationType {
  ChangeApprovalRequest = 0,    // Yêu cầu phê duyệt thay đổi
  ChangeApproved = 1,           // Thay đổi được duyệt
  ChangeRejected = 2,           // Thay đổi bị từ chối
  ResultApprovalRequest = 3,    // Yêu cầu phê duyệt KQ
  ResultApproved = 4,           // KQ được duyệt
  ResultRejected = 5,           // KQ bị từ chối
  NewTestRequest = 6,           // Phiếu mới
  DeadlineReminder = 7          // Nhắc deadline
}

// Labels for NotificationType
export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.ChangeApprovalRequest]: 'Yêu cầu phê duyệt thay đổi',
  [NotificationType.ChangeApproved]: 'Thay đổi được duyệt',
  [NotificationType.ChangeRejected]: 'Thay đổi bị từ chối',
  [NotificationType.ResultApprovalRequest]: 'Yêu cầu phê duyệt KQ',
  [NotificationType.ResultApproved]: 'KQ được duyệt',
  [NotificationType.ResultRejected]: 'KQ bị từ chối',
  [NotificationType.NewTestRequest]: 'Phiếu mới',
  [NotificationType.DeadlineReminder]: 'Nhắc deadline',
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

export const notificationService = {
  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  getMyNotifications: async (params: PagedResultRequestDto = {}): Promise<PagedResultDto<NotificationDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
    if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;

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
