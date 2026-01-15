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
    // Sanitize HTML to only allow safe tags
    const sanitizedHtml = DOMPurify.sanitize(displayContent, {
      ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "sub", "sup", "br"],
      ALLOWED_ATTR: [], // No attributes allowed
    });

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

export default IndicatorName;
