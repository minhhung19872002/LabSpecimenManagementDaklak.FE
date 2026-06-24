/**
 * Build the (flat) sample-table rows for the offline BM05 test-request form.
 * One row per sample; the sample's indicators (+ unit price) are rendered as a
 * text list in the "Chỉ tiêu kiểm nghiệm" cell. Pairs with prepareRequestTemplate.
 */

import { htmlToParagraphXml } from './htmlToOoxml';
import { TestRequestSampleDto } from '../../types/testRequest';

export interface RequestSampleRow {
  No: string;
  NameOfSample: string;
  Quantity: string;
  SampleInfo: string;
  /** Raw OOXML paragraph for the indicators cell (use as {{@IndicatorsXml}}). */
  IndicatorsXml: string;
}

const TIMES = 'Times New Roman';

function formatPrice(v: number | undefined | null): string {
  if (typeof v !== 'number' || !isFinite(v)) return '';
  return `${v.toLocaleString('vi-VN')} đ`;
}

export function buildRequestSampleRows(
  samples: TestRequestSampleDto[] | undefined
): RequestSampleRow[] {
  return (samples ?? []).map((s, idx) => {
    const html = (s.indicators ?? [])
      .map((i) => {
        const name = i.indicatorFormattedName || i.indicatorName || '';
        const price = formatPrice(i.unitPrice);
        return `- ${name}${price ? ` (${price})` : ''}`;
      })
      .join('<br/>');
    return {
      No: String(idx + 1),
      NameOfSample: s.sampleName || '',
      Quantity: s.sampleQuantity || '',
      SampleInfo: s.statusText || '',
      IndicatorsXml: htmlToParagraphXml(html, { font: TIMES, sizePt: 11 }),
    };
  });
}
