/**
 * Chat SignalR Service - Real-time chat updates via WebSocket
 */

import * as signalR from '@microsoft/signalr';
import { STORAGE_KEYS } from '../constants/storage';
import {
  ChatConversationDto,
  ChatMessageDto,
  MessageStatus,
} from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:44381';

type NewConversationCallback = (conversation: ChatConversationDto) => void;
type ConversationUpdatedCallback = (conversation: ChatConversationDto) => void;
type ConversationAssignedCallback = (conversation: ChatConversationDto) => void;
type NewMessageCallback = (message: ChatMessageDto) => void;
type MessageSentCallback = (message: ChatMessageDto) => void;
type MessageFailedCallback = (message: ChatMessageDto) => void;
type MessageStatusUpdatedCallback = (data: {
  messageId: string;
  status: MessageStatus;
}) => void;
type AgentTypingCallback = (data: {
  conversationId: string;
  agentId: string;
  agentName: string;
}) => void;

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  // Callbacks
  private newConversationCallbacks: NewConversationCallback[] = [];
  private conversationUpdatedCallbacks: ConversationUpdatedCallback[] = [];
  private conversationAssignedCallbacks: ConversationAssignedCallback[] = [];
  private newMessageCallbacks: NewMessageCallback[] = [];
  private messageSentCallbacks: MessageSentCallback[] = [];
  private messageFailedCallbacks: MessageFailedCallback[] = [];
  private messageStatusUpdatedCallbacks: MessageStatusUpdatedCallback[] = [];
  private agentTypingCallbacks: AgentTypingCallback[] = [];

  // Joined conversation rooms
  private joinedConversations: Set<string> = new Set();

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('[ChatSignalR] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[ChatSignalR] Connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!accessToken) {
        console.warn('[ChatSignalR] No access token, skipping connection');
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/signalr/chat`, {
          accessTokenFactory: () => accessToken || '',
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Register event handlers
      this.registerEventHandlers();

      // Connection lifecycle handlers
      this.connection.onreconnecting((error) => {
        console.warn('[ChatSignalR] Reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('[ChatSignalR] Reconnected:', connectionId);
        // Rejoin conversation rooms
        this.rejoinConversations();
      });

      this.connection.onclose((error) => {
        console.log('[ChatSignalR] Connection closed', error);
      });

      await this.connection.start();
      console.log('[ChatSignalR] Connected successfully');
    } catch (error) {
      console.error('[ChatSignalR] Connection failed:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  private registerEventHandlers(): void {
    if (!this.connection) return;

    // New conversation
    this.connection.on('NewConversation', (conversation: ChatConversationDto) => {
      console.log('[ChatSignalR] NewConversation:', conversation.id);
      this.newConversationCallbacks.forEach((cb) => cb(conversation));
    });

    // Conversation updated
    this.connection.on(
      'ConversationUpdated',
      (conversation: ChatConversationDto) => {
        console.log('[ChatSignalR] ConversationUpdated:', conversation.id);
        this.conversationUpdatedCallbacks.forEach((cb) => cb(conversation));
      }
    );

    // Conversation assigned to current agent
    this.connection.on(
      'ConversationAssigned',
      (conversation: ChatConversationDto) => {
        console.log('[ChatSignalR] ConversationAssigned:', conversation.id);
        this.conversationAssignedCallbacks.forEach((cb) => cb(conversation));
      }
    );

    // New message from customer
    this.connection.on('NewMessage', (message: ChatMessageDto) => {
      console.log('[ChatSignalR] NewMessage:', message.id);
      this.newMessageCallbacks.forEach((cb) => cb(message));
    });

    // Message sent by agent
    this.connection.on('MessageSent', (message: ChatMessageDto) => {
      console.log('[ChatSignalR] MessageSent:', message.id);
      this.messageSentCallbacks.forEach((cb) => cb(message));
    });

    // Message failed
    this.connection.on('MessageFailed', (message: ChatMessageDto) => {
      console.log('[ChatSignalR] MessageFailed:', message.id);
      this.messageFailedCallbacks.forEach((cb) => cb(message));
    });

    // Message status updated
    this.connection.on(
      'MessageStatusUpdated',
      (data: { messageId: string; status: MessageStatus }) => {
        console.log('[ChatSignalR] MessageStatusUpdated:', data);
        this.messageStatusUpdatedCallbacks.forEach((cb) => cb(data));
      }
    );

    // Agent typing
    this.connection.on(
      'AgentTyping',
      (data: { conversationId: string; agentId: string; agentName: string }) => {
        this.agentTypingCallbacks.forEach((cb) => cb(data));
      }
    );
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('[ChatSignalR] Disconnected');
      } catch (error) {
        console.error('[ChatSignalR] Error disconnecting:', error);
      }
      this.connection = null;
      this.joinedConversations.clear();
    }
  }

  // ============ JOIN/LEAVE CONVERSATIONS ============

  async joinConversation(conversationId: string): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.warn('[ChatSignalR] Not connected, cannot join conversation');
      return;
    }

    try {
      await this.connection.invoke('JoinConversation', conversationId);
      this.joinedConversations.add(conversationId);
      console.log('[ChatSignalR] Joined conversation:', conversationId);
    } catch (error) {
      console.error('[ChatSignalR] Error joining conversation:', error);
    }
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await this.connection.invoke('LeaveConversation', conversationId);
      this.joinedConversations.delete(conversationId);
      console.log('[ChatSignalR] Left conversation:', conversationId);
    } catch (error) {
      console.error('[ChatSignalR] Error leaving conversation:', error);
    }
  }

  private async rejoinConversations(): Promise<void> {
    for (const conversationId of this.joinedConversations) {
      try {
        await this.connection?.invoke('JoinConversation', conversationId);
        console.log('[ChatSignalR] Rejoined conversation:', conversationId);
      } catch (error) {
        console.error('[ChatSignalR] Error rejoining conversation:', error);
      }
    }
  }

  // ============ SEND TYPING INDICATOR ============

  async sendTyping(conversationId: string): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await this.connection.invoke('SendTyping', conversationId);
    } catch (error) {
      console.error('[ChatSignalR] Error sending typing:', error);
    }
  }

  // ============ SUBSCRIBE TO EVENTS ============

  onNewConversation(callback: NewConversationCallback): () => void {
    this.newConversationCallbacks.push(callback);
    return () => {
      this.newConversationCallbacks = this.newConversationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onConversationUpdated(callback: ConversationUpdatedCallback): () => void {
    this.conversationUpdatedCallbacks.push(callback);
    return () => {
      this.conversationUpdatedCallbacks =
        this.conversationUpdatedCallbacks.filter((cb) => cb !== callback);
    };
  }

  onConversationAssigned(callback: ConversationAssignedCallback): () => void {
    this.conversationAssignedCallbacks.push(callback);
    return () => {
      this.conversationAssignedCallbacks =
        this.conversationAssignedCallbacks.filter((cb) => cb !== callback);
    };
  }

  onNewMessage(callback: NewMessageCallback): () => void {
    this.newMessageCallbacks.push(callback);
    return () => {
      this.newMessageCallbacks = this.newMessageCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageSent(callback: MessageSentCallback): () => void {
    this.messageSentCallbacks.push(callback);
    return () => {
      this.messageSentCallbacks = this.messageSentCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageFailed(callback: MessageFailedCallback): () => void {
    this.messageFailedCallbacks.push(callback);
    return () => {
      this.messageFailedCallbacks = this.messageFailedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageStatusUpdated(callback: MessageStatusUpdatedCallback): () => void {
    this.messageStatusUpdatedCallbacks.push(callback);
    return () => {
      this.messageStatusUpdatedCallbacks =
        this.messageStatusUpdatedCallbacks.filter((cb) => cb !== callback);
    };
  }

  onAgentTyping(callback: AgentTypingCallback): () => void {
    this.agentTypingCallbacks.push(callback);
    return () => {
      this.agentTypingCallbacks = this.agentTypingCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // ============ UTILS ============

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const chatSignalRService = new ChatSignalRService();
