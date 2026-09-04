import React from "react";
import { Typography } from "antd";
import dayjs from "dayjs";
import { PreparedSolutionBatchDto } from "../../../services/preparedSolutionService";

const { Title, Text } = Typography;

export interface PreparedSolutionInfoSectionProps {
  item: PreparedSolutionBatchDto;
}

const PreparedSolutionInfoSection: React.FC<PreparedSolutionInfoSectionProps> = ({ item }) => (
  <div className="detail-sections-row">
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Thông tin phiếu
      </Title>
      <div className="detail-grid-2col">
        <div className="detail-item">
          <Text type="secondary">Ngày giờ pha:</Text>
          <Text strong>
            {item.preparationDate ? dayjs(item.preparationDate).format("DD/MM/YYYY HH:mm") : "-"}
          </Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Kho:</Text>
          <Text strong>{item.storageWarehouseName || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Người pha:</Text>
          <Text strong>{item.preparedByName || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Thời gian tạo phiếu:</Text>
          <Text>{item.creationTime ? dayjs(item.creationTime).format("DD/MM/YYYY HH:mm") : "-"}</Text>
        </div>
      </div>
    </div>
  </div>
);

export default PreparedSolutionInfoSection;
