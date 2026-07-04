import React from "react";
import DOMPurify from "dompurify";

interface IndicatorNameProps {
  /** Plain text name (fallback) */
  name: string;
  /** Formatted HTML name (preferred if available) */
  formattedName?: string | null;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// Sanitize là hàm thuần (cùng input -> cùng output) nên cache được;
// tránh chạy DOMPurify hàng trăm lần khi cây chỉ tiêu re-render trên máy yếu
const sanitizeCache = new Map<string, string>();
const SANITIZE_CACHE_MAX = 2000;

function sanitizeCached(html: string): string {
  const hit = sanitizeCache.get(html);
  if (hit !== undefined) {
    return hit;
  }
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "sub", "sup", "br"],
    ALLOWED_ATTR: [], // No attributes allowed
  });
  if (sanitizeCache.size >= SANITIZE_CACHE_MAX) {
    sanitizeCache.clear();
  }
  sanitizeCache.set(html, sanitized);
  return sanitized;
}

/**
 * Component to display indicator name with rich text formatting.
 * Uses formattedName (HTML) if available, otherwise falls back to plain name.
 * HTML is sanitized to prevent XSS attacks.
 */
const IndicatorName: React.FC<IndicatorNameProps> = ({
  name,
  formattedName,
  className,
  style,
}) => {
  // Use formattedName if available and not empty, otherwise use plain name
  const displayContent = formattedName?.trim() || name;

  // Check if content has HTML tags
  const hasHtml = /<[^>]+>/.test(displayContent);

  if (hasHtml) {
    const sanitizedHtml = sanitizeCached(displayContent);

    return (
      <span
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Plain text - render as-is
  return (
    <span className={className} style={style}>
      {displayContent}
    </span>
  );
};

// memo: props là 4 giá trị primitive/shallow — cùng props thì cùng output
export default React.memo(IndicatorName);
