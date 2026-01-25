import api from './api';

const BASE_URL = '/api/v1/notifications';

// Notification Type Enum
export enum NotificationType {
  // For QLKT (LabTechnicalManager) - type 0-9
  SampleSentToLab = 0,              // Mẫu đã gửi đến khoa phòng
  PendingWorkAssignment = 1,        // Chưa phân công công việc
  SingleIndicatorSubmitted = 2,     // KTV gửi 1 chỉ tiêu
  MultipleIndicatorsSubmitted = 3,  // KTV gửi nhiều chỉ tiêu
  SingleResultRejectedByQM = 4,     // QLCL từ chối 1 kết quả
  MultipleResultsRejectedByQM = 5,  // QLCL từ chối nhiều kết quả
  ResultApprovedByQM = 6,           // QLCL duyệt kết quả
  NewSamplesAdded = 7,              // Có mẫu/chỉ tiêu mới thêm
  SamplesCancelled = 8,             // Mẫu/chỉ tiêu bị hủy
  TestRequestChangeRequested = 9,   // Phiếu đang điều chỉnh

  // For QLCL (QualityManager) - type 10-14
  SingleResultSubmittedToQM = 10,   // QLKT gửi 1 kết quả cần QLCL phê duyệt
  MultipleResultsSubmittedToQM = 11,// QLKT gửi nhiều kết quả cần QLCL phê duyệt
  DeadlineReminder = 12,            // Nhắc nhở deadline trả kết quả
  HandoverReminder = 13,            // Nhắc nhở bàn giao kết quả
  TestRequestChangePendingApproval = 14, // Thay đổi phiếu cần phê duyệt

  // For SampleReceiver (Bộ phận Giao nhận mẫu) - type 20-24
  ChangeApproved = 20,              // QLCL phê duyệt thay đổi
  ChangeRejected = 21,              // QLCL từ chối thay đổi
  NewTestRequestPending = 22,       // Phiếu yêu cầu mới cần gửi mẫu
  SampleReturnReminder = 23,        // Nhắc nhở trả mẫu cho khách hàng
  ResultApprovedNotification = 24,  // Kết quả đã được duyệt

  // For KTV (Technician) - type 30-35
  SingleIndicatorAssignedToTechnician = 30,   // Được phân công 1 chỉ tiêu
  MultipleIndicatorsAssignedToTechnician = 31, // Được phân công nhiều chỉ tiêu
  PendingIndicatorReminder = 32,    // Nhắc nhở chỉ tiêu chưa thực hiện
  SingleResultRejectedByTechnicalManager = 33, // QLKT từ chối 1 kết quả
  MultipleResultsRejectedByTechnicalManager = 34, // QLKT từ chối nhiều kết quả
  CannotTest = 35,                  // Báo không thử nghiệm được
}

// Labels for NotificationType
export const NotificationTypeLabels: Record<NotificationType, string> = {
  // QLKT notifications (0-9)
  [NotificationType.SampleSentToLab]: 'Mẫu mới cần thử nghiệm',
  [NotificationType.PendingWorkAssignment]: 'Nhắc nhở phân công',
  [NotificationType.SingleIndicatorSubmitted]: 'Chờ phê duyệt',
  [NotificationType.MultipleIndicatorsSubmitted]: 'Chờ phê duyệt',
  [NotificationType.SingleResultRejectedByQM]: 'Kết quả bị từ chối',
  [NotificationType.MultipleResultsRejectedByQM]: 'Kết quả bị từ chối',
  [NotificationType.ResultApprovedByQM]: 'Kết quả đã duyệt',
  [NotificationType.NewSamplesAdded]: 'Mẫu/chỉ tiêu mới',
  [NotificationType.SamplesCancelled]: 'Mẫu bị hủy',
  [NotificationType.TestRequestChangeRequested]: 'Phiếu đang điều chỉnh',

  // QLCL notifications (10-14)
  [NotificationType.SingleResultSubmittedToQM]: 'Chờ phê duyệt',
  [NotificationType.MultipleResultsSubmittedToQM]: 'Chờ phê duyệt',
  [NotificationType.DeadlineReminder]: 'Sắp đến hạn',
  [NotificationType.HandoverReminder]: 'Cần bàn giao',
  [NotificationType.TestRequestChangePendingApproval]: 'Thay đổi cần duyệt',

  // SampleReceiver notifications (20-24)
  [NotificationType.ChangeApproved]: 'Thay đổi đã duyệt',
  [NotificationType.ChangeRejected]: 'Thay đổi bị từ chối',
  [NotificationType.NewTestRequestPending]: 'Mẫu cần gửi',
  [NotificationType.SampleReturnReminder]: 'Nhắc trả mẫu',
  [NotificationType.ResultApprovedNotification]: 'Kết quả đã duyệt',

  // KTV notifications (30-35)
  [NotificationType.SingleIndicatorAssignedToTechnician]: 'Công việc mới',
  [NotificationType.MultipleIndicatorsAssignedToTechnician]: 'Công việc mới',
  [NotificationType.PendingIndicatorReminder]: 'Nhắc nhở thực hiện',
  [NotificationType.SingleResultRejectedByTechnicalManager]: 'Kết quả bị từ chối',
  [NotificationType.MultipleResultsRejectedByTechnicalManager]: 'Kết quả bị từ chối',
  [NotificationType.CannotTest]: 'Báo không TN được',
};

// Icon mapping for NotificationType (Bootstrap Icons)
export const NotificationTypeIcons: Record<NotificationType, string> = {
  // Success/Approved - check icon
  [NotificationType.ResultApprovedByQM]: 'bi-check2',
  [NotificationType.ChangeApproved]: 'bi-check2',
  [NotificationType.ResultApprovedNotification]: 'bi-check2',

  // Rejected - x icon
  [NotificationType.SingleResultRejectedByQM]: 'bi-x-lg',
  [NotificationType.MultipleResultsRejectedByQM]: 'bi-x-lg',
  [NotificationType.ChangeRejected]: 'bi-x-lg',
  [NotificationType.SingleResultRejectedByTechnicalManager]: 'bi-x-lg',
  [NotificationType.MultipleResultsRejectedByTechnicalManager]: 'bi-x-lg',

  // Warning/Reminder - clock icon
  [NotificationType.DeadlineReminder]: 'bi-clock',
  [NotificationType.PendingWorkAssignment]: 'bi-clock',
  [NotificationType.PendingIndicatorReminder]: 'bi-clock',
  [NotificationType.CannotTest]: 'bi-exclamation-lg',

  // New Task/Document - file-text icon
  [NotificationType.SampleSentToLab]: 'bi-file-text',
  [NotificationType.NewTestRequestPending]: 'bi-file-text',
  [NotificationType.SingleIndicatorAssignedToTechnician]: 'bi-file-text',
  [NotificationType.MultipleIndicatorsAssignedToTechnician]: 'bi-file-text',

  // Pending Approval - file-text icon
  [NotificationType.SingleIndicatorSubmitted]: 'bi-file-text',
  [NotificationType.MultipleIndicatorsSubmitted]: 'bi-file-text',
  [NotificationType.SingleResultSubmittedToQM]: 'bi-file-text',
  [NotificationType.MultipleResultsSubmittedToQM]: 'bi-file-text',
  [NotificationType.TestRequestChangePendingApproval]: 'bi-file-text',

  // Info - file-text icon
  [NotificationType.NewSamplesAdded]: 'bi-file-text',
  [NotificationType.SamplesCancelled]: 'bi-file-text',
  [NotificationType.HandoverReminder]: 'bi-file-text',
  [NotificationType.SampleReturnReminder]: 'bi-file-text',
  [NotificationType.TestRequestChangeRequested]: 'bi-file-text',
};

// Icon colors for NotificationType
export const NotificationTypeIconColors: Record<NotificationType, string> = {
  // Success/Approved - green
  [NotificationType.ResultApprovedByQM]: '#52c41a',
  [NotificationType.ChangeApproved]: '#52c41a',
  [NotificationType.ResultApprovedNotification]: '#52c41a',

  // Rejected - red
  [NotificationType.SingleResultRejectedByQM]: '#ff4d4f',
  [NotificationType.MultipleResultsRejectedByQM]: '#ff4d4f',
  [NotificationType.ChangeRejected]: '#ff4d4f',
  [NotificationType.SingleResultRejectedByTechnicalManager]: '#ff4d4f',
  [NotificationType.MultipleResultsRejectedByTechnicalManager]: '#ff4d4f',

  // Warning/Reminder - orange
  [NotificationType.DeadlineReminder]: '#faad14',
  [NotificationType.PendingWorkAssignment]: '#faad14',
  [NotificationType.PendingIndicatorReminder]: '#faad14',
  [NotificationType.CannotTest]: '#faad14',

  // New Task - blue
  [NotificationType.SampleSentToLab]: '#1890ff',
  [NotificationType.NewTestRequestPending]: '#1890ff',
  [NotificationType.SingleIndicatorAssignedToTechnician]: '#1890ff',
  [NotificationType.MultipleIndicatorsAssignedToTechnician]: '#1890ff',

  // Pending Approval - blue
  [NotificationType.SingleIndicatorSubmitted]: '#1890ff',
  [NotificationType.MultipleIndicatorsSubmitted]: '#1890ff',
  [NotificationType.SingleResultSubmittedToQM]: '#1890ff',
  [NotificationType.MultipleResultsSubmittedToQM]: '#1890ff',
  [NotificationType.TestRequestChangePendingApproval]: '#1890ff',

  // Info - gray
  [NotificationType.NewSamplesAdded]: '#8c8c8c',
  [NotificationType.SamplesCancelled]: '#8c8c8c',
  [NotificationType.HandoverReminder]: '#8c8c8c',
  [NotificationType.SampleReturnReminder]: '#8c8c8c',
  [NotificationType.TestRequestChangeRequested]: '#8c8c8c',
};

// Icon background colors for NotificationType (solid colors)
export const NotificationTypeIconBgColors: Record<NotificationType, string> = {
  // Success/Approved - light green
  [NotificationType.ResultApprovedByQM]: '#F6FFED',
  [NotificationType.ChangeApproved]: '#F6FFED',
  [NotificationType.ResultApprovedNotification]: '#F6FFED',

  // Rejected - light red
  [NotificationType.SingleResultRejectedByQM]: '#FFF2F0',
  [NotificationType.MultipleResultsRejectedByQM]: '#FFF2F0',
  [NotificationType.ChangeRejected]: '#FFF2F0',
  [NotificationType.SingleResultRejectedByTechnicalManager]: '#FFF2F0',
  [NotificationType.MultipleResultsRejectedByTechnicalManager]: '#FFF2F0',

  // Warning/Reminder - light orange
  [NotificationType.DeadlineReminder]: '#FFF7E6',
  [NotificationType.PendingWorkAssignment]: '#FFF7E6',
  [NotificationType.PendingIndicatorReminder]: '#FFF7E6',
  [NotificationType.CannotTest]: '#FFF7E6',

  // New Task - light blue
  [NotificationType.SampleSentToLab]: '#E6F7FF',
  [NotificationType.NewTestRequestPending]: '#E6F7FF',
  [NotificationType.SingleIndicatorAssignedToTechnician]: '#E6F7FF',
  [NotificationType.MultipleIndicatorsAssignedToTechnician]: '#E6F7FF',

  // Pending Approval - light blue
  [NotificationType.SingleIndicatorSubmitted]: '#E6F7FF',
  [NotificationType.MultipleIndicatorsSubmitted]: '#E6F7FF',
  [NotificationType.SingleResultSubmittedToQM]: '#E6F7FF',
  [NotificationType.MultipleResultsSubmittedToQM]: '#E6F7FF',
  [NotificationType.TestRequestChangePendingApproval]: '#E6F7FF',

  // Info - light gray
  [NotificationType.NewSamplesAdded]: '#FAFAFA',
  [NotificationType.SamplesCancelled]: '#FAFAFA',
  [NotificationType.HandoverReminder]: '#FAFAFA',
  [NotificationType.SampleReturnReminder]: '#FAFAFA',
  [NotificationType.TestRequestChangeRequested]: '#FAFAFA',
};

// AdditionalData interface
export interface NotificationAdditionalData {
  contractNumber?: string;
  sampleName?: string;
  indicatorName?: string;
  methodName?: string;
  sampleCode?: string;
  senderName?: string;
  indicatorCount?: number;
  rejectedCount?: number;
  newSampleCount?: number;
  newIndicatorCount?: number;
  cancelledCount?: number;
  sampleCount?: number;
}

// Helper function to parse additionalData JSON
export const parseNotificationAdditionalData = (additionalData?: string): NotificationAdditionalData | null => {
  if (!additionalData) return null;
  try {
    return JSON.parse(additionalData) as NotificationAdditionalData;
  } catch {
    return null;
  }
};

// Helper function to get icon for notification type
export const getNotificationIcon = (type: NotificationType): string => {
  return NotificationTypeIcons[type] || 'bi-bell';
};

// Helper function to get icon color for notification type
export const getNotificationIconColor = (type: NotificationType): string => {
  return NotificationTypeIconColors[type] || '#1890ff';
};

// Helper function to get icon background color for notification type
export const getNotificationIconBgColor = (type: NotificationType): string => {
  return NotificationTypeIconBgColors[type] || '#FAFAFA';
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
