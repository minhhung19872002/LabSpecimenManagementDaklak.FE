import { Modal, Descriptions, Typography, Table, Tag } from "antd";
import dayjs from "dayjs";
import { AuditLogDto } from "../../../services/auditLogService";
import { getHttpMethodTag, getStatusCodeTag } from "../columns";

const { Text } = Typography;

interface AuditLogDetailModalProps {
  open: boolean;
  onClose: () => void;
  log: AuditLogDto | null;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  open,
  onClose,
  log,
}) => {
  if (!log) return null;

  return (
    <Modal
      title="Chi tiết Audit Log"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Thời gian">
          {dayjs(log.executionTime).format("DD/MM/YYYY HH:mm:ss")}
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian xử lý">
          {log.executionDuration} ms
        </Descriptions.Item>
        <Descriptions.Item label="Người thực hiện">
          {log.userName || "Anonymous"}
        </Descriptions.Item>
        <Descriptions.Item label="HTTP Method">
          {log.httpMethod ? getHttpMethodTag(log.httpMethod) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="URL" span={2}>
          {log.url}
        </Descriptions.Item>
        <Descriptions.Item label="HTTP Status">
          {getStatusCodeTag(log.httpStatusCode)}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ IP">
          {log.clientIpAddress === "::1" || log.clientIpAddress === "127.0.0.1"
            ? "localhost"
            : log.clientIpAddress}
        </Descriptions.Item>
        <Descriptions.Item label="Trình duyệt" span={2}>
          <Text style={{ fontSize: 12 }}>{log.browserInfo}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Application">
          {log.applicationName}
        </Descriptions.Item>
        <Descriptions.Item label="Correlation ID">
          <Text copyable style={{ fontSize: 12 }}>
            {log.correlationId}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {log.entityChanges && log.entityChanges.length > 0 && (
        <>
          <Text strong>Entity Changes:</Text>
          {log.entityChanges.map((change, idx) => (
            <div key={idx} style={{ marginTop: 8 }}>
              <Tag color="blue">{change.changeType}</Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {change.entityTypeFullName}
              </Text>
              {change.propertyChanges && change.propertyChanges.length > 0 && (
                <Table
                  style={{ marginTop: 8 }}
                  dataSource={change.propertyChanges}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Property",
                      dataIndex: "propertyName",
                      key: "propertyName",
                    },
                    {
                      title: "Giá trị cũ",
                      dataIndex: "originalValue",
                      key: "originalValue",
                      render: (val) =>
                        val ? (
                          <Text delete type="danger">
                            {val}
                          </Text>
                        ) : (
                          "-"
                        ),
                    },
                    {
                      title: "Giá trị mới",
                      dataIndex: "newValue",
                      key: "newValue",
                      render: (val) =>
                        val ? <Text type="success">{val}</Text> : "-",
                    },
                  ]}
                />
              )}
            </div>
          ))}
        </>
      )}
    </Modal>
  );
};

export default AuditLogDetailModal;
