import React, { useState } from "react";
import { Button, Drawer, Tooltip, message } from "antd";
import { HistoryOutlined } from "../Icon";
import { masterDataHistoryService } from "../../../services/masterDataHistoryService";
import type {
  MasterDataChangeDto,
  MasterDataHistoryEntityType,
} from "../../../types/masterDataHistory";
import MasterDataHistoryTimeline from "./MasterDataHistoryTimeline";

export interface MasterDataHistoryButtonProps {
  entityType: MasterDataHistoryEntityType;
  entityId: string;
  /** Tên bản ghi hiển thị trên tiêu đề drawer */
  title?: string;
}

/**
 * Nút "Lịch sử" tự quản state (mở drawer + tải dữ liệu khi mở) — không drill state từ bảng cha.
 */
const MasterDataHistoryButton = React.memo<MasterDataHistoryButtonProps>(
  function MasterDataHistoryButton({ entityType, entityId, title }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<MasterDataChangeDto[]>([]);

    const handleOpen = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(true);
      setLoading(true);
      try {
        setItems(await masterDataHistoryService.getList(entityType, entityId));
      } catch {
        message.error("Không tải được lịch sử thay đổi");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <Tooltip title="Lịch sử thay đổi">
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={handleOpen}
          />
        </Tooltip>
        {open && (
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            title={title ? `Lịch sử thay đổi: ${title}` : "Lịch sử thay đổi"}
            width={560}
            destroyOnHidden
          >
            <div onClick={(e) => e.stopPropagation()}>
              <MasterDataHistoryTimeline loading={loading} items={items} />
            </div>
          </Drawer>
        )}
      </>
    );
  },
);

export default MasterDataHistoryButton;
