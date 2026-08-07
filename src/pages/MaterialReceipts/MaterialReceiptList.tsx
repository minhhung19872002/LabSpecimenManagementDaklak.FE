import React from "react";
import { Card, Empty, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const MaterialReceiptList: React.FC = () => {
  return (
    <Card title="Mẫu nhận vật tư">
      <Empty
        image={<InboxOutlined style={{ fontSize: 64, color: "#bfbfbf" }} />}
        description={
          <Typography.Text type="secondary">
            Chức năng đang được phát triển
          </Typography.Text>
        }
      />
    </Card>
  );
};

export default MaterialReceiptList;
