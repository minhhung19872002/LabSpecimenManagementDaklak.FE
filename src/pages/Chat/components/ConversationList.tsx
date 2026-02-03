/**
 * ConversationList - Left sidebar with conversation list
 */

import { Badge, Button, Input, List, Select, Space, Tabs, Tag, Typography } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import {
  ChatConversationDto,
  ConversationStatus,
  ConversationStatusColors,
  ConversationStatusLabels,
  ChannelTypeColors,
  ChannelTypeLabels,
  GetConversationsInput,
} from '../../../types/chat';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

interface ConversationListProps {
  conversations: ChatConversationDto[];
  loading: boolean;
  totalCount: number;
  selectedId?: string;
  unassignedCount: number;
  myActiveCount: number;
  filters: GetConversationsInput;
  onSelect: (conversation: ChatConversationDto) => void;
  onFilterChange: (filters: Partial<GetConversationsInput>) => void;
  onRefresh: () => void;
}

const ConversationList = ({
  conversations,
  loading,
  selectedId,
  unassignedCount,
  myActiveCount,
  filters,
  onSelect,
  onFilterChange,
  onRefresh,
}: ConversationListProps) => {
  const handleTabChange = (key: string) => {
    switch (key) {
      case 'unassigned':
        onFilterChange({ unassignedOnly: true, myConversationsOnly: false, status: undefined });
        break;
      case 'mine':
        onFilterChange({ unassignedOnly: false, myConversationsOnly: true, status: undefined });
        break;
      case 'all':
      default:
        onFilterChange({ unassignedOnly: false, myConversationsOnly: false, status: undefined });
        break;
    }
  };

  const getActiveTab = () => {
    if (filters.unassignedOnly) return 'unassigned';
    if (filters.myConversationsOnly) return 'mine';
    return 'all';
  };

  return (
    <div className="conversation-list">
      {/* Header */}
      <div className="conversation-list-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 16 }}>Hội thoại</Text>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          />
        </Space>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={getActiveTab()}
        onChange={handleTabChange}
        size="small"
        items={[
          {
            key: 'all',
            label: 'Tất cả',
          },
          {
            key: 'unassigned',
            label: (
              <Badge count={unassignedCount} size="small" offset={[8, 0]}>
                <span>Chưa nhận</span>
              </Badge>
            ),
          },
          {
            key: 'mine',
            label: (
              <Badge count={myActiveCount} size="small" offset={[8, 0]}>
                <span>Của tôi</span>
              </Badge>
            ),
          },
        ]}
      />

      {/* Search & Filter */}
      <div className="conversation-list-filters">
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined />}
          allowClear
          value={filters.searchText}
          onChange={(e) => onFilterChange({ searchText: e.target.value })}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: '100%', marginTop: 8 }}
          value={filters.status}
          onChange={(value) => onFilterChange({ status: value })}
          options={[
            { value: ConversationStatus.Pending, label: ConversationStatusLabels[ConversationStatus.Pending] },
            { value: ConversationStatus.Active, label: ConversationStatusLabels[ConversationStatus.Active] },
            { value: ConversationStatus.Resolved, label: ConversationStatusLabels[ConversationStatus.Resolved] },
            { value: ConversationStatus.Closed, label: ConversationStatusLabels[ConversationStatus.Closed] },
          ]}
        />
      </div>

      {/* Conversation List */}
      <List
        className="conversation-list-items"
        loading={loading}
        dataSource={conversations}
        locale={{ emptyText: 'Không có hội thoại nào' }}
        renderItem={(item) => (
          <List.Item
            className={`conversation-item ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            <div className="conversation-item-content">
              {/* Avatar */}
              <div className="conversation-avatar">
                {item.contact?.avatar ? (
                  <img src={item.contact.avatar} alt="" />
                ) : (
                  <div className="avatar-placeholder">
                    <UserOutlined />
                  </div>
                )}
                {item.unreadCount > 0 && (
                  <Badge count={item.unreadCount} className="unread-badge" />
                )}
              </div>

              {/* Info */}
              <div className="conversation-info">
                <div className="conversation-header">
                  <Text strong ellipsis className="contact-name">
                    {item.contact?.displayName || 'Khách hàng'}
                  </Text>
                  <Text type="secondary" className="message-time">
                    {item.lastMessageAt
                      ? dayjs(item.lastMessageAt).fromNow()
                      : dayjs(item.creationTime).fromNow()}
                  </Text>
                </div>
                <div className="conversation-preview">
                  <Text type="secondary" ellipsis>
                    {item.lastMessagePreview || 'Hội thoại mới'}
                  </Text>
                </div>
                <div className="conversation-meta">
                  <Tag
                    color={ChannelTypeColors[item.channelType]}
                    style={{ marginRight: 4 }}
                  >
                    {ChannelTypeLabels[item.channelType]}
                  </Tag>
                  <Tag color={ConversationStatusColors[item.status]}>
                    {ConversationStatusLabels[item.status]}
                  </Tag>
                  {item.assignedAgentName && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <UserOutlined /> {item.assignedAgentName}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ConversationList;
