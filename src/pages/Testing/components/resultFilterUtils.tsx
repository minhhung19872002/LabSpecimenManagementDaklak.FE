import React from 'react';
import DOMPurify from 'dompurify';
import { extractPlainTextFromLimit } from '../../../components/common';
import { convertHtmlToMathExpression, stripPTags } from '../../../utils/formatters';

const sanitizeInlineHtml = (value: string) =>
  DOMPurify.sanitize(stripPTags(value), {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'sub', 'sup', 'br'],
    ALLOWED_ATTR: [],
  });

const normalizeResultSearchToken = (value?: string | null): string => {
  if (!value) return '';

  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getResultSearchCandidates = (value?: string | null): string[] => {
  if (!value) return [];

  const candidates = [
    stripPTags(value).trim(),
    extractPlainTextFromLimit(value),
    convertHtmlToMathExpression(value),
  ]
    .map((item) => normalizeResultSearchToken(item))
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

export const ResultRichText: React.FC<{ value?: string | null; fallback?: React.ReactNode }> = ({
  value,
  fallback = '-',
}) => {
  const content = value?.trim();
  if (!content) {
    return <>{fallback}</>;
  }

  const sanitizedHtml = sanitizeInlineHtml(content);
  const hasHtml = /<[^>]+>/.test(content);

  if (!hasHtml) {
    return <>{stripPTags(content)}</>;
  }

  return <span dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
