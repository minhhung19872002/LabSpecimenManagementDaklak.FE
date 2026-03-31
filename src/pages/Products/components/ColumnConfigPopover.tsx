import React from "react";
import { Popover, Checkbox, Row, Col, Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { ALL_COLUMNS } from "../constants";

interface ColumnConfigPopoverProps {
  visibleKeys: Set<string>;
  onChange: (keys: Set<string>) => void;
}

const ColumnConfigPopover: React.FC<ColumnConfigPopoverProps> = ({
  visibleKeys,
  onChange,
}) => {
  const allKeys = ALL_COLUMNS.map((c) => c.key);
  const allChecked = allKeys.every((k) => visibleKeys.has(k));
  const someChecked = allKeys.some((k) => visibleKeys.has(k)) && !allChecked;

  const handleToggle = (key: string) => {
    const next = new Set(visibleKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onChange(new Set(allKeys));
    } else {
      onChange(new Set());
    }
  };

  const content = (
    <div style={{ width: 320 }}>
      <div style={{ marginBottom: 8, borderBottom: "1px solid #f0f0f0", paddingBottom: 8 }}>
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={(e) => handleToggleAll(e.target.checked)}
        >
          Tất cả
        </Checkbox>
      </div>
      <Row gutter={[8, 8]}>
        {ALL_COLUMNS.map((col) => (
          <Col span={12} key={col.key}>
            <Checkbox
              checked={visibleKeys.has(col.key)}
              onChange={() => handleToggle(col.key)}
            >
              {col.title}
            </Checkbox>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
    >
      <Button icon={<SettingOutlined />} />
    </Popover>
  );
};

export default ColumnConfigPopover;
