import React, { useState } from "react";
import { Button, Checkbox, Input, Modal } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined } from "../../../../components/common/Icon";
import { buildServiceDeclareUrl } from "../../ServiceDeclare/ServiceDeclare/utils";
import type { AddMethodOption, AddMethodTab, AddMethodTarget } from "./utils";

export interface AddMethodModalProps {
  target: AddMethodTarget | null;
  /** Đã lọc theo từ khóa + tab */
  options: AddMethodOption[];
  /** Số PP theo từ khóa cho từng tab */
  tabCounts: Readonly<Record<AddMethodTab, number>>;
  /** Số PP đang có của chỉ tiêu trên nền mẫu */
  existingCount: number;
  /** PP chưa thêm hiện trong danh sách (cho "Chọn tất cả") */
  visibleFreeIds: string[];
  selected: ReadonlySet<string>;
  keyword: string;
  tab: AddMethodTab;
  /** Đã bấm lưu mà chưa chọn → báo lỗi */
  tried: boolean;
  onKeywordChange: (value: string) => void;
  onTabChange: (tab: AddMethodTab) => void;
  onToggleSelect: (testMethodIndicatorId: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

const TABS: { key: AddMethodTab; label: string }[] = [
  { key: "free", label: "Chưa thêm" },
  { key: "has", label: "Đã có" },
  { key: "all", label: "Tất cả" },
];

/** Nút lưu tự quản loading (handler cha tự bắt lỗi, không ném lại) */
const SaveMethodsButton = React.memo<{ count: number; onSubmit: () => Promise<void> }>(function SaveMethodsButton({
  count,
  onSubmit,
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      loading={loading}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onSubmit();
        } finally {
          setLoading(false);
        }
      }}
    >
      {count > 0 ? `Thêm ${count} phương pháp` : "Thêm phương pháp"}
    </Button>
  );
});

const emptyText = (keyword: string, tab: AddMethodTab) => {
  if (keyword.trim()) return `Không có phương pháp khớp “${keyword.trim()}”.`;
  if (tab === "free") return "Mọi phương pháp đã khai báo cho chỉ tiêu này đều đã có trong danh sách.";
  if (tab === "has") return "Chỉ tiêu này chưa có phương pháp nào trong danh sách.";
  return "Chưa có phương pháp nào được khai báo cho chỉ tiêu này.";
};

/** Popup thêm phương pháp cho 1 chỉ tiêu trên 1 nền mẫu (PP lấy từ dịch vụ đã khai báo) */
const AddMethodModal: React.FC<AddMethodModalProps> = ({
  target,
  options,
  tabCounts,
  existingCount,
  visibleFreeIds,
  selected,
  keyword,
  tab,
  tried,
  onKeywordChange,
  onTabChange,
  onToggleSelect,
  onSelectAll,
  onSubmit,
  onCancel,
}) => {
  const allVisibleSelected = visibleFreeIds.length > 0 && visibleFreeIds.every((id) => selected.has(id));
  const declareUrl = target
    ? buildServiceDeclareUrl({ indicatorId: target.indicatorId, specimenTypeId: target.specimenTypeId })
    : buildServiceDeclareUrl();
  return (
    <Modal
      open={target != null}
      title="Thêm phương pháp"
      width={600}
      destroyOnHidden
      maskClosable={false}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <SaveMethodsButton key="save" count={selected.size} onSubmit={onSubmit} />,
      ]}
    >
      {target && (
        <>
          <div className="bn-add-targets">
            <div className="bn-add-target">
              <span className="bn-add-target-label">Nền mẫu · {target.categoryName}</span>
              <span className="bn-add-target-value" title={target.specimenName}>
                {target.specimenName}
              </span>
            </div>
            <div className="bn-add-target">
              <span className="bn-add-target-label">Chỉ tiêu · đang có {existingCount} phương pháp</span>
              <span className="bn-add-target-value" title={target.indicatorName}>
                {target.indicatorName}
              </span>
            </div>
          </div>
          <Input
            prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
            placeholder="Tìm phương pháp hoặc tên dịch vụ…"
            aria-label="Tìm phương pháp hoặc tên dịch vụ"
            allowClear
            autoFocus
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
          <div className="bn-add-bar">
            <div className="svc-seg" role="group" aria-label="Lọc phương pháp">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`svc-seg-btn${tab === t.key ? " is-on" : ""}`}
                  aria-pressed={tab === t.key}
                  onClick={() => onTabChange(t.key)}
                >
                  {t.label}
                  <span className="bn-seg-badge">{tabCounts[t.key]}</span>
                </button>
              ))}
            </div>
            <span className="bn-add-selected">
              Đã chọn <strong>{selected.size}</strong>
            </span>
            {visibleFreeIds.length > 1 && (
              <button type="button" className="svc-link-btn" onClick={() => onSelectAll(visibleFreeIds, !allVisibleSelected)}>
                {allVisibleSelected ? "Bỏ chọn tất cả" : `Chọn tất cả (${visibleFreeIds.length})`}
              </button>
            )}
          </div>
          <div className="bn-add-list" role="listbox" aria-multiselectable="true" aria-label="Phương pháp">
            <div className="bn-add-grid bn-add-head">
              <span />
              <span>Phương pháp</span>
              <span>Dịch vụ đang dùng</span>
              <span />
            </div>
            {options.length === 0 && <p className="bn-add-empty">{emptyText(keyword, tab)}</p>}
            {options.map((o) => {
              const checked = o.has || selected.has(o.testMethodIndicatorId);
              const rowClass = `bn-add-grid bn-add-row${o.has ? " is-has" : checked ? " is-checked" : ""}`;
              return (
                <div
                  key={o.testMethodIndicatorId}
                  className={rowClass}
                  role="option"
                  aria-selected={checked}
                  aria-disabled={o.has}
                  onClick={() => !o.has && onToggleSelect(o.testMethodIndicatorId)}
                >
                  <Checkbox checked={checked} disabled={o.has} aria-label={o.methodName} />
                  <span className="bn-add-method" title={o.methodName}>
                    {o.methodName}
                  </span>
                  <span className="bn-add-service" title={o.serviceGroupName}>
                    {o.serviceGroupName}
                  </span>
                  <span>{o.has && <span className="bn-tag-has">Đã có</span>}</span>
                </div>
              );
            })}
          </div>
          {tried && selected.size === 0 && <span className="bn-add-error">Chọn ít nhất một phương pháp</span>}
          <p className="bn-add-note">
            Không tìm thấy phương pháp cần thêm? Khai báo ở <Link to={declareUrl}>Phiếu khai báo dịch vụ</Link>
          </p>
        </>
      )}
    </Modal>
  );
};

export default AddMethodModal;
