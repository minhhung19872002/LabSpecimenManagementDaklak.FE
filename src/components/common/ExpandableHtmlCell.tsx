import React, { useEffect, useRef, useState } from "react";
import "./ExpandableHtmlCell.css";

export interface ExpandableHtmlCellProps {
  /** HTML content (already sanitized server-side) */
  html: string;
  /** Number of lines to show when collapsed */
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
  expandLabel?: string;
  collapseLabel?: string;
}

/**
 * Renders HTML content clamped to `rows` lines with a "Xem thêm / Thu gọn" toggle.
 * The toggle only appears when the content actually overflows the clamp.
 */
const ExpandableHtmlCell = React.memo<ExpandableHtmlCellProps>(function ExpandableHtmlCell({
  html,
  rows = 3,
  className,
  style,
  expandLabel = "Xem thêm",
  collapseLabel = "Thu gọn",
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (expanded) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html, rows, expanded]);

  const clampStyle: React.CSSProperties = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: rows,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div style={style}>
      <div
        ref={ref}
        className={className}
        style={clampStyle}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(overflowing || expanded) && (
        <a
          className="expandable-html-cell__toggle"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{ fontSize: 12, userSelect: "none" }}
        >
          {expanded ? collapseLabel : expandLabel}
        </a>
      )}
    </div>
  );
});

export default ExpandableHtmlCell;
