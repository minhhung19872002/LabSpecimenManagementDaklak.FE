/**
 * MetadataPanel - Right sidebar with conversation/contact details
 */

import { Button, Card, Descriptions, Divider, Space, Tag, Typography } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  TagOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  ChatConversationDetailDto,
  ChannelTypeColors,
  ChannelTypeLabels,
  ConversationPriority,
  ConversationPriorityColors,
  ConversationPriorityLabels,
  ConversationStatusColors,
  ConversationStatusLabels,
} from '../../../types/chat';

const { Text, Title } = Typography;

interface MetadataPanelProps {
  conversation: ChatConversationDetailDto;
  loading: boolean;
}

const MetadataPanel = ({ conversation, loading }: MetadataPanelProps) => {
  const contact = conversation.contactDetail || conversation.contact;

  return (
    <div className="metadata-panel">
      {/* Contact Info */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Thông tin khách hàng</span>
          </Space>
        }
        size="small"
        loading={loading}
      >
        <div className="contact-header">
          <div className="contact-avatar-large">
            {contact?.avatar ? (
              <img src={contact.avatar} alt="" />
            ) : (
              <div className="avatar-placeholder large">
                <UserOutlined />
              </div>
            )}
          </div>
          <Title level={5} style={{ marginTop: 8, marginBottom: 4 }}>
            {contact?.displayName || 'Khách hàng'}
          </Title>
          <Tag color={ChannelTypeColors[conversation.channelType]}>
            {ChannelTypeLabels[conversation.channelType]}
          </Tag>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Descriptions column={1} size="small">
          {conversation.contactDetail?.phoneNumber && (
            <Descriptions.Item
              label={
                <Space>
                  <PhoneOutlined />
                  <span>SĐT</span>
                </Space>
              }
            >
              {conversation.contactDetail.phoneNumber}
            </Descriptions.Item>
          )}
          {conversation.contactDetail?.email && (
            <Descriptions.Item
              label={
                <Space>
                  <MailOutlined />
                  <span>Email</span>
                </Space>
              }
            >
              {conversation.contactDetail.email}
            </Descriptions.Item>
          )}
          <Descriptions.Item
            label={
              <Space>
                <ClockCircleOutlined />
                <span>Liên hệ từ</span>
              </Space>
            }
          >
            {dayjs(conversation.contactDetail?.creationTime || conversation.creationTime).format(
              'DD/MM/YYYY HH:mm'
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Link to Customer */}
        {conversation.contactDetail?.customerId ? (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">Đã liên kết khách hàng:</Text>
            <div>
              <Button type="link" icon={<LinkOutlined />} style={{ padding: 0 }}>
                {conversation.contactDetail.customerName || 'Xem khách hàng'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="dashed"
            icon={<LinkOutlined />}
            style={{ marginTop: 12, width: '100%' }}
          >
            Liên kết khách hàng
          </Button>
        )}
      </Card>

      {/* Conversation Info */}
      <Card
        title={
          <Space>
            <TagOutlined />
            <span>Thông tin hội thoại</span>
          </Space>
        }
        size="small"
        style={{ marginTop: 12 }}
        loading={loading}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Trạng thái">
            <Tag color={ConversationStatusColors[conversation.status]}>
              {ConversationStatusLabels[conversation.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Độ ưu tiên">
            <Tag color={ConversationPriorityColors[conversation.priority]}>
              {ConversationPriorityLabels[conversation.priority]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Agent xử lý">
            {conversation.assignedAgentName || (
              <Text type="secondary">Chưa phân công</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Bắt đầu">
            {dayjs(conversation.creationTime).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          {conversation.lastMessageAt && (
            <Descriptions.Item label="Tin nhắn cuối">
              {dayjs(conversation.lastMessageAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Priority selector */}
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Thay đổi độ ưu tiên:
        </Text>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {Object.values(ConversationPriority)
              .filter((v) => typeof v === 'number')
              .map((priority) => (
                <Tag
                  key={priority}
                  color={
                    conversation.priority === priority
                      ? ConversationPriorityColors[priority as ConversationPriority]
                      : 'default'
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {ConversationPriorityLabels[priority as ConversationPriority]}
                </Tag>
              ))}
          </Space>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card
        title="Hành động nhanh"
        size="small"
        style={{ marginTop: 12 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block>Xem lịch sử</Button>
          <Button block>Ghi chú nội bộ</Button>
          <Button block>Chuyển agent</Button>
        </Space>
      </Card>
    </div>
  );
};

export default MetadataPanel;
