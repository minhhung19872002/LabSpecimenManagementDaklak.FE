import React, { useMemo } from "react";
import { Popover, Checkbox, Divider, Button } from "antd";
import { SettingOutlined } from "./Icon";
import "./ColumnVisibilitySelector.css";

export interface ColumnOption {
  key: string;
  label: string;
  disabled?: boolean;
}

interface ColumnVisibilitySelectorProps {
  options: ColumnOption[];
  visibleKeys: string[];
  onChange: (keys: string[]) => void;
}

const ColumnVisibilitySelector: React.FC<ColumnVisibilitySelectorProps> = ({
  options,
  visibleKeys,
  onChange,
}) => {
  const allKeys = useMemo(() => options.map((o) => o.key), [options]);
  const allChecked = visibleKeys.length === options.length;
  const indeterminate =
    visibleKeys.length > 0 && visibleKeys.length < options.length;

  const disabledKeys = useMemo(
    () => new Set(options.filter((o) => o.disabled).map((o) => o.key)),
    [options]
  );

  const handleToggleAll = () => {
    if (allChecked) {
      onChange(allKeys.filter((k) => disabledKeys.has(k)));
    } else {
      onChange(allKeys);
    }
  };

  const handleToggle = (key: string, checked: boolean) => {
    if (disabledKeys.has(key)) return;
    if (checked) {
      const ordered = allKeys.filter(
        (k) => k === key || visibleKeys.includes(k)
      );
      onChange(ordered);
    } else {
      onChange(visibleKeys.filter((k) => k !== key));
    }
  };

  const content = (
    <div className="column-visibility-content">
      <Checkbox
        checked={allChecked}
        indeterminate={indeterminate}
        onChange={handleToggleAll}
      >
        <strong>Tất cả</strong>
      </Checkbox>
      <Divider style={{ margin: "8px 0" }} />
      <div className="column-visibility-list">
        {options.map((opt) => (
          <div key={opt.key} className="column-visibility-item">
            <Checkbox
              checked={visibleKeys.includes(opt.key)}
              disabled={opt.disabled}
              onChange={(e) => handleToggle(opt.key, e.target.checked)}
            >
              {opt.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      overlayClassName="column-visibility-popover"
    >
      <Button
        type="text"
        size="small"
        icon={<SettingOutlined />}
        title="Chọn cột hiển thị"
      />
    </Popover>
  );
};

export default ColumnVisibilitySelector;
