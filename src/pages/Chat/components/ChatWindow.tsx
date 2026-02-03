/**
 * ChatWindow - Center panel with messages and input
 */

import { useEffect, useRef } from 'react';
import { Button, Dropdown, Space, Spin, Tag, Typography } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  MoreOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  ChatConversationDetailDto,
  ChatMessageDto,
  ConversationStatus,
  ConversationStatusColors,
  ConversationStatusLabels,
  ChannelTypeColors,
  ChannelTypeLabels,
  MessageSenderType,
  MessageStatus,
} from '../../../types/chat';
import MessageInput from './MessageInput';

const { Text, Title } = Typography;

interface ChatWindowProps {
  conversation: ChatConversationDetailDto;
  messages: ChatMessageDto[];
  loading: boolean;
  hasMore: boolean;
  onSendMessage: (content: string) => void;
  onLoadMore: () => void;
  onPickup: () => void;
  onClose: () => void;
  onResolve: () => void;
  onReopen: () => void;
}

const ChatWindow = ({
  conversation,
  messages,
  loading,
  hasMore,
  onSendMessage,
  onLoadMore,
  onPickup,
  onClose,
  onResolve,
  onReopen,
}: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle scroll for load more
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      onLoadMore();
    }
  };

  const canReply =
    conversation.status !== ConversationStatus.Closed &&
    conversation.assignedAgentId;

  const isAssignedToMe = !!conversation.assignedAgentId; // TODO: check against current user

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'resolve',
      label: 'Đánh dấu đã giải quyết',
      icon: <CheckOutlined />,
      disabled: conversation.status === ConversationStatus.Resolved,
      onClick: onResolve,
    },
    {
      key: 'reopen',
      label: 'Mở lại hội thoại',
      icon: <ReloadOutlined />,
      disabled:
        conversation.status !== ConversationStatus.Closed &&
        conversation.status !== ConversationStatus.Resolved,
      onClick: onReopen,
    },
    {
      type: 'divider',
    },
    {
      key: 'close',
      label: 'Đóng hội thoại',
      icon: <CloseOutlined />,
      danger: true,
      disabled: conversation.status === ConversationStatus.Closed,
      onClick: onClose,
    },
  ];

  const renderMessage = (msg: ChatMessageDto, index: number) => {
    const isAgent = msg.senderType === MessageSenderType.Agent;
    const isSystem = msg.senderType === MessageSenderType.System;
    const showDate =
      index === 0 ||
      dayjs(msg.creationTime).format('YYYY-MM-DD') !==
        dayjs(messages[index - 1].creationTime).format('YYYY-MM-DD');

    return (
      <div key={msg.id}>
        {showDate && (
          <div className="message-date-divider">
            <span>{dayjs(msg.creationTime).format('DD/MM/YYYY')}</span>
          </div>
        )}
        <div
          className={`message-item ${isAgent ? 'agent' : ''} ${isSystem ? 'system' : ''}`}
        >
          {!isAgent && !isSystem && (
            <div className="message-avatar">
              {msg.senderAvatar ? (
                <img src={msg.senderAvatar} alt="" />
              ) : (
                <div className="avatar-placeholder">{msg.senderName?.[0] || 'K'}</div>
              )}
            </div>
          )}
          <div className="message-content">
            {!isAgent && !isSystem && (
              <div className="message-sender">{msg.senderName || 'Khách hàng'}</div>
            )}
            <div className="message-bubble">
              {msg.content}
              {msg.attachments?.map((att, i) => (
                <div key={i} className="message-attachment">
                  {att.type?.startsWith('image') ? (
                    <img src={att.url} alt={att.name} />
                  ) : (
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      {att.name || 'File đính kèm'}
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="message-meta">
              <span className="message-time">
                {dayjs(msg.creationTime).format('HH:mm')}
              </span>
              {isAgent && (
                <span className="message-status">
                  {msg.status === MessageStatus.Sending && '⏳'}
                  {msg.status === MessageStatus.Sent && '✓'}
                  {msg.status === MessageStatus.Delivered && '✓✓'}
                  {msg.status === MessageStatus.Read && (
                    <span style={{ color: '#1890ff' }}>✓✓</span>
                  )}
                  {msg.status === MessageStatus.Failed && (
                    <span style={{ color: '#ff4d4f' }}>✗ {msg.errorMessage}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div className="header-info">
          <div className="header-avatar">
            {conversation.contact?.avatar ? (
              <img src={conversation.contact.avatar} alt="" />
            ) : (
              <div className="avatar-placeholder">
                {conversation.contact?.displayName?.[0] || 'K'}
              </div>
            )}
          </div>
          <div className="header-details">
            <Title level={5} style={{ margin: 0 }}>
              {conversation.contact?.displayName || 'Khách hàng'}
            </Title>
            <Space size={4}>
              <Tag color={ChannelTypeColors[conversation.channelType]}>
                {ChannelTypeLabels[conversation.channelType]}
              </Tag>
              <Tag color={ConversationStatusColors[conversation.status]}>
                {ConversationStatusLabels[conversation.status]}
              </Tag>
            </Space>
          </div>
        </div>
        <div className="header-actions">
          {!isAssignedToMe && conversation.status === ConversationStatus.Pending && (
            <Button type="primary" icon={<UserAddOutlined />} onClick={onPickup}>
              Nhận xử lý
            </Button>
          )}
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-window-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && messages.length === 0 && (
          <div className="messages-loading">
            <Spin />
          </div>
        )}
        {hasMore && (
          <div className="load-more">
            <Button
              type="link"
              size="small"
              loading={loading}
              onClick={onLoadMore}
            >
              Tải thêm tin nhắn cũ
            </Button>
          </div>
        )}
        {messages.map((msg, index) => renderMessage(msg, index))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-window-input">
        {canReply ? (
          <MessageInput onSend={onSendMessage} />
        ) : (
          <div className="input-disabled">
            {conversation.status === ConversationStatus.Closed ? (
              <Text type="secondary">
                Hội thoại đã đóng.{' '}
                <Button type="link" onClick={onReopen}>
                  Mở lại
                </Button>
              </Text>
            ) : !conversation.assignedAgentId ? (
              <Text type="secondary">
                Nhận hội thoại để trả lời.{' '}
                <Button type="link" onClick={onPickup}>
                  Nhận xử lý
                </Button>
              </Text>
            ) : (
              <Text type="secondary">Không thể gửi tin nhắn</Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
