/**
 * Chat/CSKH Types - Zalo OA Integration
 */

// ============ ENUMS ============

export enum ChannelType {
  Zalo = 0,
  Facebook = 1,
  Email = 2,
  WebChat = 3,
}

export enum ConversationStatus {
  Pending = 0,
  Active = 1,
  Resolved = 2,
  Closed = 3,
}

export enum ConversationPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3,
}

export enum MessageSenderType {
  Contact = 0,
  Agent = 1,
  System = 2,
}

export enum MessageType {
  Text = 0,
  Image = 1,
  File = 2,
  Sticker = 3,
  Video = 4,
  Audio = 5,
  Location = 6,
  Link = 7,
}

export enum MessageStatus {
  Sending = 0,
  Sent = 1,
  Delivered = 2,
  Read = 3,
  Failed = 4,
}

// ============ LABELS & COLORS ============

export const ChannelTypeLabels: Record<ChannelType, string> = {
  [ChannelType.Zalo]: 'Zalo',
  [ChannelType.Facebook]: 'Facebook',
  [ChannelType.Email]: 'Email',
  [ChannelType.WebChat]: 'Web Chat',
};

export const ChannelTypeColors: Record<ChannelType, string> = {
  [ChannelType.Zalo]: '#0068ff',
  [ChannelType.Facebook]: '#1877f2',
  [ChannelType.Email]: '#ea4335',
  [ChannelType.WebChat]: '#52c41a',
};

export const ConversationStatusLabels: Record<ConversationStatus, string> = {
  [ConversationStatus.Pending]: 'Chờ xử lý',
  [ConversationStatus.Active]: 'Đang xử lý',
  [ConversationStatus.Resolved]: 'Đã giải quyết',
  [ConversationStatus.Closed]: 'Đã đóng',
};

export const ConversationStatusColors: Record<ConversationStatus, string> = {
  [ConversationStatus.Pending]: 'orange',
  [ConversationStatus.Active]: 'blue',
  [ConversationStatus.Resolved]: 'green',
  [ConversationStatus.Closed]: 'default',
};

export const ConversationPriorityLabels: Record<ConversationPriority, string> = {
  [ConversationPriority.Low]: 'Thấp',
  [ConversationPriority.Normal]: 'Bình thường',
  [ConversationPriority.High]: 'Cao',
  [ConversationPriority.Urgent]: 'Khẩn cấp',
};

export const ConversationPriorityColors: Record<ConversationPriority, string> = {
  [ConversationPriority.Low]: 'default',
  [ConversationPriority.Normal]: 'blue',
  [ConversationPriority.High]: 'orange',
  [ConversationPriority.Urgent]: 'red',
};

export const MessageSenderTypeLabels: Record<MessageSenderType, string> = {
  [MessageSenderType.Contact]: 'Khách hàng',
  [MessageSenderType.Agent]: 'Agent',
  [MessageSenderType.System]: 'Hệ thống',
};

// ============ DTOs ============

export interface ChatContactBriefDto {
  id: string;
  displayName?: string;
  avatar?: string;
  channelType: ChannelType;
}

export interface ChatContactDto {
  id: string;
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  externalId: string;
  displayName?: string;
  avatar?: string;
  phoneNumber?: string;
  email?: string;
  customerId?: string;
  customerName?: string;
  creationTime: string;
}

export interface ChatConversationDto {
  id: string;
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  contactId: string;
  contact?: ChatContactBriefDto;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  subject?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  creationTime: string;
}

export interface ChatConversationDetailDto extends ChatConversationDto {
  contactDetail?: ChatContactDto;
}

export interface MessageAttachmentDto {
  url: string;
  type?: string;
  name?: string;
  size?: number;
  thumbnailUrl?: string;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  senderType: MessageSenderType;
  messageType: MessageType;
  content?: string;
  attachments?: MessageAttachmentDto[];
  status: MessageStatus;
  errorMessage?: string;
  creationTime: string;
}

// ============ INPUT DTOs ============

export interface GetConversationsInput {
  skipCount?: number;
  maxResultCount?: number;
  channelId?: string;
  status?: ConversationStatus;
  assignedAgentId?: string;
  unassignedOnly?: boolean;
  myConversationsOnly?: boolean;
  searchText?: string;
  sorting?: string;
}

export interface GetMessagesInput {
  conversationId: string;
  skipCount?: number;
  maxResultCount?: number;
  before?: string;
  after?: string;
}

export interface SendMessageInput {
  conversationId: string;
  messageType?: MessageType;
  content?: string;
  attachments?: MessageAttachmentDto[];
}

export interface AssignConversationInput {
  conversationId: string;
  agentId?: string;
}

export interface UpdateConversationPriorityInput {
  conversationId: string;
  priority: ConversationPriority;
}

export interface LinkContactToCustomerInput {
  contactId: string;
  customerId: string;
}

// ============ RESULT DTOs ============

export interface SendMessageResult {
  success: boolean;
  message?: ChatMessageDto;
  errorMessage?: string;
}

// ============ PAGED RESULT ============

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}
