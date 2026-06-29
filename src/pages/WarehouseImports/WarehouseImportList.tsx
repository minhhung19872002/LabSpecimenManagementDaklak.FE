import React from "react";
import { Card, Empty } from "antd";
import "../../styles/ListCard.css";

const WarehouseImportList: React.FC = () => {
  return (
    <div>
      <Card className="list-card" title="Quản lý nhập kho">
        <Empty description="Chức năng đang được phát triển" />
      </Card>
    </div>
  );
};

export default WarehouseImportList;
