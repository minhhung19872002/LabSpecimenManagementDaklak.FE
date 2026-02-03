/**
 * Chat Service - API client for CSKH/Chat operations
 */

import { api } from './api';
import {
  ChatConversationDto,
  ChatConversationDetailDto,
  ChatMessageDto,
  ChatContactDto,
  GetConversationsInput,
  GetMessagesInput,
  SendMessageInput,
  AssignConversationInput,
  UpdateConversationPriorityInput,
  LinkContactToCustomerInput,
  SendMessageResult,
  PagedResultDto,
} from '../types/chat';

const CONVERSATION_URL = '/api/app/conversation';
const MESSAGE_URL = '/api/app/message';
const CONTACT_URL = '/api/app/contact';

export const chatService = {
  // ============ CONVERSATIONS ============

  /**
   * Lấy danh sách conversations với filters
   */
  getConversations: async (
    params: GetConversationsInput
  ): Promise<PagedResultDto<ChatConversationDto>> => {
    const response = await api.get<PagedResultDto<ChatConversationDto>>(
      CONVERSATION_URL,
      { params }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết một conversation
   */
  getConversation: async (id: string): Promise<ChatConversationDetailDto> => {
    const response = await api.get<ChatConversationDetailDto>(
      `${CONVERSATION_URL}/${id}`
    );
    return response.data;
  },

  /**
   * Agent tự nhận conversation
   */
  pickupConversation: async (
    conversationId: string
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/${conversationId}/pickup`
    );
    return response.data;
  },

  /**
   * Assign conversation cho agent khác
   */
  assignConversation: async (
    input: AssignConversationInput
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/assign`,
      input
    );
    return response.data;
  },

  /**
   * Bỏ assign conversation
   */
  unassignConversation: async (
    conversationId: string
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/${conversationId}/unassign`
    );
    return response.data;
  },

  /**
   * Đóng conversation
   */
  closeConversation: async (
    conversationId: string
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/${conversationId}/close`
    );
    return response.data;
  },

  /**
   * Mở lại conversation
   */
  reopenConversation: async (
    conversationId: string
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/${conversationId}/reopen`
    );
    return response.data;
  },

  /**
   * Đánh dấu đã giải quyết
   */
  resolveConversation: async (
    conversationId: string
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/${conversationId}/resolve`
    );
    return response.data;
  },

  /**
   * Cập nhật priority
   */
  updateConversationPriority: async (
    input: UpdateConversationPriorityInput
  ): Promise<ChatConversationDto> => {
    const response = await api.post<ChatConversationDto>(
      `${CONVERSATION_URL}/update-priority`,
      input
    );
    return response.data;
  },

  /**
   * Đánh dấu đã đọc
   */
  markConversationAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`${CONVERSATION_URL}/${conversationId}/mark-as-read`);
  },

  /**
   * Lấy số conversation chưa assign
   */
  getUnassignedCount: async (): Promise<number> => {
    const response = await api.get<number>(
      `${CONVERSATION_URL}/unassigned-count`
    );
    return response.data;
  },

  /**
   * Lấy số conversation đang active của current agent
   */
  getMyActiveCount: async (): Promise<number> => {
    const response = await api.get<number>(
      `${CONVERSATION_URL}/my-active-count`
    );
    return response.data;
  },

  // ============ MESSAGES ============

  /**
   * Lấy danh sách messages của conversation
   */
  getMessages: async (
    params: GetMessagesInput
  ): Promise<PagedResultDto<ChatMessageDto>> => {
    const response = await api.get<PagedResultDto<ChatMessageDto>>(MESSAGE_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Agent gửi tin nhắn
   */
  sendMessage: async (input: SendMessageInput): Promise<SendMessageResult> => {
    const response = await api.post<SendMessageResult>(MESSAGE_URL, input);
    return response.data;
  },

  /**
   * Retry gửi tin nhắn bị fail
   */
  retryMessage: async (messageId: string): Promise<SendMessageResult> => {
    const response = await api.post<SendMessageResult>(
      `${MESSAGE_URL}/${messageId}/retry`
    );
    return response.data;
  },

  // ============ CONTACTS ============

  /**
   * Lấy danh sách contacts
   */
  getContacts: async (params?: {
    skipCount?: number;
    maxResultCount?: number;
  }): Promise<PagedResultDto<ChatContactDto>> => {
    const response = await api.get<PagedResultDto<ChatContactDto>>(CONTACT_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết contact
   */
  getContact: async (id: string): Promise<ChatContactDto> => {
    const response = await api.get<ChatContactDto>(`${CONTACT_URL}/${id}`);
    return response.data;
  },

  /**
   * Link contact với customer
   */
  linkContactToCustomer: async (
    input: LinkContactToCustomerInput
  ): Promise<ChatContactDto> => {
    const response = await api.post<ChatContactDto>(
      `${CONTACT_URL}/link-to-customer`,
      input
    );
    return response.data;
  },

  /**
   * Unlink contact khỏi customer
   */
  unlinkContactFromCustomer: async (
    contactId: string
  ): Promise<ChatContactDto> => {
    const response = await api.post<ChatContactDto>(
      `${CONTACT_URL}/${contactId}/unlink-from-customer`
    );
    return response.data;
  },
};
