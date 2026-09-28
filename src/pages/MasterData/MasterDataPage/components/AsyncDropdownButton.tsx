import React, { useState } from "react";
import { Button, Dropdown } from "antd";
import { DownOutlined } from "../../../../components/common/Icon";

export interface AsyncDropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  /** Trả về Promise để button tự bật loading trong lúc chạy */
  onClick: () => Promise<void> | void;
}

export interface AsyncDropdownButtonProps {
  label: string;
  icon: React.ReactNode;
  items: AsyncDropdownItem[];
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * Dropdown button tự quản loading (self-loading pattern):
 * chọn 1 option → button hiện loading + khoá dropdown cho tới khi Promise resolve.
 * Handler của parent phải tự try/catch để Promise luôn resolve.
 */
const AsyncDropdownButton = React.memo<AsyncDropdownButtonProps>(
  function AsyncDropdownButton({ label, icon, items, style, disabled }) {
    const [loading, setLoading] = useState(false);

    const run = async (item: AsyncDropdownItem) => {
      setLoading(true);
      try {
        await item.onClick();
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dropdown
        trigger={["click"]}
        disabled={disabled || loading}
        menu={{
          items: items.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            onClick: () => run(item),
          })),
        }}
      >
        <Button
          icon={icon}
          loading={loading}
          disabled={disabled || loading}
          style={style}
        >
          {label} <DownOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Button>
      </Dropdown>
    );
  },
);

export default AsyncDropdownButton;
