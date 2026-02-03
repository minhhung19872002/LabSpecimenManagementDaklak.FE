/**
 * Chat Page - CSKH Agent Dashboard
 * 3-column layout: Conversations | Messages | Metadata
 */

import { useCallback, useEffect, useState } from 'react';
import { Layout, message, Spin } from 'antd';
import { chatService } from '../../services/chatService';
import { chatSignalRService } from '../../services/chatSignalRService';
import {
  ChatConversationDto,
  ChatConversationDetailDto,
  ChatMessageDto,
  ConversationStatus,
  GetConversationsInput,
} from '../../types/chat';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';
import MetadataPanel from './components/MetadataPanel';
import './styles.css';

const { Sider, Content } = Layout;

const ChatPage = () => {
  // Conversation list state
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsTotalCount, setConversationsTotalCount] = useState(0);
  const [filters, setFilters] = useState<GetConversationsInput>({
    maxResultCount: 50,
    sorting: 'lastMessageAt',
  });

  // Selected conversation
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversationDetailDto | null>(null);
  const [selectedConversationLoading, setSelectedConversationLoading] =
    useState(false);

  // Messages state
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Counts
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [myActiveCount, setMyActiveCount] = useState(0);

  // ============ LOAD DATA ============

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const result = await chatService.getConversations(filters);
      setConversations(result.items);
      setConversationsTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      message.error('Không thể tải danh sách hội thoại');
    } finally {
      setConversationsLoading(false);
    }
  }, [filters]);

  const loadCounts = useCallback(async () => {
    try {
      const [unassigned, myActive] = await Promise.all([
        chatService.getUnassignedCount(),
        chatService.getMyActiveCount(),
      ]);
      setUnassignedCount(unassigned);
      setMyActiveCount(myActive);
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  }, []);

  const loadConversationDetail = useCallback(async (id: string) => {
    setSelectedConversationLoading(true);
    try {
      const detail = await chatService.getConversation(id);
      setSelectedConversation(detail);
    } catch (error) {
      console.error('Failed to load conversation detail:', error);
      message.error('Không thể tải chi tiết hội thoại');
    } finally {
      setSelectedConversationLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, loadMore = false) => {
      setMessagesLoading(true);
      try {
        const params = {
          conversationId,
          maxResultCount: 30,
          before: loadMore && messages.length > 0 ? messages[0].creationTime : undefined,
        };
        const result = await chatService.getMessages(params);

        if (loadMore) {
          setMessages((prev) => [...result.items, ...prev]);
        } else {
          setMessages(result.items);
        }

        setHasMoreMessages(result.items.length === 30);
      } catch (error) {
        console.error('Failed to load messages:', error);
        message.error('Không thể tải tin nhắn');
      } finally {
        setMessagesLoading(false);
      }
    },
    [messages]
  );

  // ============ EFFECTS ============

  // Initial load
  useEffect(() => {
    loadConversations();
    loadCounts();
  }, [loadConversations, loadCounts]);

  // Connect SignalR
  useEffect(() => {
    chatSignalRService.connect();

    return () => {
      chatSignalRService.disconnect();
    };
  }, []);

  // SignalR event handlers
  useEffect(() => {
    const unsubNewConv = chatSignalRService.onNewConversation((conv) => {
      setConversations((prev) => [conv, ...prev]);
      setUnassignedCount((prev) => prev + 1);
    });

    const unsubConvUpdated = chatSignalRService.onConversationUpdated((conv) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? conv : c))
      );
      if (selectedConversation?.id === conv.id) {
        setSelectedConversation((prev) => (prev ? { ...prev, ...conv } : null));
      }
    });

    const unsubConvAssigned = chatSignalRService.onConversationAssigned(
      (conv) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? conv : c))
        );
        loadCounts();
      }
    );

    const unsubNewMsg = chatSignalRService.onNewMessage((msg) => {
      if (selectedConversation?.id === msg.conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessageAt: msg.creationTime,
                lastMessagePreview: msg.content || '[Tin nhắn]',
                unreadCount: c.unreadCount + 1,
              }
            : c
        )
      );
    });

    const unsubMsgSent = chatSignalRService.onMessageSent((msg) => {
      if (selectedConversation?.id === msg.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? msg : m))
        );
      }
    });

    const unsubMsgFailed = chatSignalRService.onMessageFailed((msg) => {
      if (selectedConversation?.id === msg.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? msg : m))
        );
      }
    });

    return () => {
      unsubNewConv();
      unsubConvUpdated();
      unsubConvAssigned();
      unsubNewMsg();
      unsubMsgSent();
      unsubMsgFailed();
    };
  }, [selectedConversation, loadCounts]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      chatSignalRService.joinConversation(selectedConversation.id);

      // Mark as read
      if (selectedConversation.unreadCount > 0) {
        chatService.markConversationAsRead(selectedConversation.id);
      }
    }

    return () => {
      if (selectedConversation) {
        chatSignalRService.leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id]);

  // ============ HANDLERS ============

  const handleSelectConversation = (conversation: ChatConversationDto) => {
    if (conversation.id !== selectedConversation?.id) {
      setMessages([]);
      loadConversationDetail(conversation.id);
    }
  };

  const handleFilterChange = (newFilters: Partial<GetConversationsInput>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePickup = async () => {
    if (!selectedConversation) return;
    try {
      const updated = await chatService.pickupConversation(
        selectedConversation.id
      );
      setSelectedConversation((prev) => (prev ? { ...prev, ...updated } : null));
      loadCounts();
      message.success('Đã nhận hội thoại');
    } catch (error) {
      message.error('Không thể nhận hội thoại');
    }
  };

  const handleClose = async () => {
    if (!selectedConversation) return;
    try {
      const updated = await chatService.closeConversation(
        selectedConversation.id
      );
      setSelectedConversation((prev) => (prev ? { ...prev, ...updated } : null));
      loadCounts();
      message.success('Đã đóng hội thoại');
    } catch (error) {
      message.error('Không thể đóng hội thoại');
    }
  };

  const handleResolve = async () => {
    if (!selectedConversation) return;
    try {
      const updated = await chatService.resolveConversation(
        selectedConversation.id
      );
      setSelectedConversation((prev) => (prev ? { ...prev, ...updated } : null));
      message.success('Đã đánh dấu giải quyết');
    } catch (error) {
      message.error('Không thể đánh dấu giải quyết');
    }
  };

  const handleReopen = async () => {
    if (!selectedConversation) return;
    try {
      const updated = await chatService.reopenConversation(
        selectedConversation.id
      );
      setSelectedConversation((prev) => (prev ? { ...prev, ...updated } : null));
      loadCounts();
      message.success('Đã mở lại hội thoại');
    } catch (error) {
      message.error('Không thể mở lại hội thoại');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessageDto = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderType: 1, // Agent
      messageType: 0, // Text
      content,
      status: 0, // Sending
      creationTime: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const result = await chatService.sendMessage({
        conversationId: selectedConversation.id,
        content,
      });

      if (result.success && result.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result.message! : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, status: 4, errorMessage: result.errorMessage }
              : m
          )
        );
        message.error(result.errorMessage || 'Gửi tin nhắn thất bại');
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: 4, errorMessage: 'Lỗi gửi tin nhắn' } : m
        )
      );
      message.error('Gửi tin nhắn thất bại');
    }
  };

  const handleLoadMoreMessages = () => {
    if (selectedConversation && !messagesLoading && hasMoreMessages) {
      loadMessages(selectedConversation.id, true);
    }
  };

  // ============ RENDER ============

  return (
    <Layout className="chat-page">
      {/* Left: Conversation List */}
      <Sider width={320} className="chat-sider conversation-list-sider">
        <ConversationList
          conversations={conversations}
          loading={conversationsLoading}
          totalCount={conversationsTotalCount}
          selectedId={selectedConversation?.id}
          unassignedCount={unassignedCount}
          myActiveCount={myActiveCount}
          filters={filters}
          onSelect={handleSelectConversation}
          onFilterChange={handleFilterChange}
          onRefresh={loadConversations}
        />
      </Sider>

      {/* Center: Chat Window */}
      <Content className="chat-content">
        {selectedConversationLoading ? (
          <div className="chat-loading">
            <Spin size="large" />
          </div>
        ) : selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            hasMore={hasMoreMessages}
            onSendMessage={handleSendMessage}
            onLoadMore={handleLoadMoreMessages}
            onPickup={handlePickup}
            onClose={handleClose}
            onResolve={handleResolve}
            onReopen={handleReopen}
          />
        ) : (
          <div className="chat-empty">
            <p>Chọn một hội thoại để bắt đầu</p>
          </div>
        )}
      </Content>

      {/* Right: Metadata Panel */}
      <Sider width={300} className="chat-sider metadata-panel-sider">
        {selectedConversation && (
          <MetadataPanel
            conversation={selectedConversation}
            loading={selectedConversationLoading}
          />
        )}
      </Sider>
    </Layout>
  );
};

export default ChatPage;
