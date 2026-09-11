import React, { useMemo, useState } from "react";
import "./ExpandableHtmlCell.css";

function truncateHtml(html: string, maxChars: number): { truncated: string; isTruncated: boolean } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fullText = doc.body.textContent || "";
  if (fullText.length <= maxChars) return { truncated: html, isTruncated: false };

  let charCount = 0;

  function walk(node: Node): boolean {
    if (charCount >= maxChars) {
      node.parentNode?.removeChild(node);
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const remaining = maxChars - charCount;
      if (text.length > remaining) {
        node.textContent = text.slice(0, remaining) + "...";
        charCount = maxChars;
      } else {
        charCount += text.length;
      }
      return charCount >= maxChars;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (walk(child)) {
          let sibling = child.nextSibling;
          while (sibling) {
            const next = sibling.nextSibling;
            node.removeChild(sibling);
            sibling = next;
          }
          return true;
        }
      }
    }
    return false;
  }

  walk(doc.body);
  return { truncated: doc.body.innerHTML, isTruncated: true };
}

export interface TruncatedHtmlCellProps {
  html: string;
  maxChars?: number;
  className?: string;
  style?: React.CSSProperties;
  expandLabel?: string;
  collapseLabel?: string;
}

const TruncatedHtmlCell = React.memo<TruncatedHtmlCellProps>(function TruncatedHtmlCell({
  html,
  maxChars = 50,
  className,
  style,
  expandLabel = "Xem thêm",
  collapseLabel = "Thu gọn",
}) {
  const [expanded, setExpanded] = useState(false);
  const { truncated, isTruncated } = useMemo(() => truncateHtml(html, maxChars), [html, maxChars]);

  return (
    <div style={style} className={className}>
      <div dangerouslySetInnerHTML={{ __html: expanded ? html : truncated }} />
      {isTruncated && (
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

export default TruncatedHtmlCell;
