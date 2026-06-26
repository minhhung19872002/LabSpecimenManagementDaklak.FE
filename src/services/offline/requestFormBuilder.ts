/**
 * Build the sample-table rows for the offline BM05 test-request form.
 * One row per sample; indicators are rendered as a nested OOXML table
 * (Stt | Chỉ tiêu | Đơn giá) matching the canonical template's sub-table.
 * Pairs with prepareRequestTemplate (which removes the original sub-table and
 * replaces it with {{@IndicatorsXml}}).
 */

import { htmlToParagraphXml } from './htmlToOoxml';
import { TestRequestSampleDto } from '../../types/testRequest';

export interface RequestSampleRow {
  No: string;
  NameOfSample: string;
  Quantity: string;
  SampleInfo: string;
  /** Raw OOXML nested table for the indicators cell (use as {{@IndicatorsXml}}). */
  IndicatorsXml: string;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatPrice(v: number | undefined | null): string {
  if (typeof v !== 'number' || !isFinite(v) || v === 0) return '';
  return `${v.toLocaleString('en-US')} đ`;
}

// Matches the canonical template's nested indicator sub-table dimensions.
const COL_STT = 701;    // dxa
const COL_NAME = 2675;  // dxa
const COL_PRICE = 1354; // dxa
const FONT_SZ = 18;     // half-points (9pt), matches template
const SPACING = `<w:spacing w:before="60" w:after="120"/>`;

function plainP(text: string, align: string, bold = false): string {
  const rPr = bold
    ? `<w:rPr><w:b/><w:sz w:val="${FONT_SZ}"/><w:szCs w:val="${FONT_SZ}"/></w:rPr>`
    : `<w:rPr><w:sz w:val="${FONT_SZ}"/><w:szCs w:val="${FONT_SZ}"/></w:rPr>`;
  return (
    `<w:p><w:pPr>${SPACING}<w:jc w:val="${align}"/></w:pPr>` +
    `<w:r>${rPr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`
  );
}

function tcWrap(widthDxa: number, content: string): string {
  return (
    `<w:tc>` +
    `<w:tcPr><w:tcW w:w="${widthDxa}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>` +
    content +
    `</w:tc>`
  );
}

function buildIndicatorsTableXml(
  indicators: TestRequestSampleDto['indicators']
): string {
  const tblPr =
    `<w:tblPr>` +
    `<w:tblStyle w:val="TableGrid"/>` +
    `<w:tblW w:w="5000" w:type="pct"/>` +
    `<w:jc w:val="center"/>` +
    `<w:tblBorders>` +
    `<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/>` +
    `</w:tblPr>`;

  const tblGrid =
    `<w:tblGrid>` +
    `<w:gridCol w:w="${COL_STT}"/>` +
    `<w:gridCol w:w="${COL_NAME}"/>` +
    `<w:gridCol w:w="${COL_PRICE}"/>` +
    `</w:tblGrid>`;

  const headerRow =
    `<w:tr>` +
    tcWrap(COL_STT, plainP('Stt', 'center', true)) +
    tcWrap(COL_NAME, plainP('Chỉ tiêu', 'center', true)) +
    tcWrap(COL_PRICE, plainP('Đơn giá', 'center', true)) +
    `</w:tr>`;

  const dataRows = (indicators ?? [])
    .map((ind, idx) => {
      const rawName = ind.indicatorFormattedName || ind.indicatorName || '';
      // htmlToParagraphXml returns <w:p>[runs]</w:p> (no <w:pPr> when align unset).
      // Inject spacing into pPr to match the template's cell styling.
      const namePRaw = htmlToParagraphXml(rawName, { sizePt: FONT_SZ / 2 });
      const nameP = namePRaw.replace('<w:p>', `<w:p><w:pPr>${SPACING}</w:pPr>`);

      return (
        `<w:tr>` +
        tcWrap(COL_STT, plainP(String(idx + 1), 'center')) +
        `<w:tc><w:tcPr><w:tcW w:w="${COL_NAME}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${nameP}</w:tc>` +
        tcWrap(COL_PRICE, plainP(formatPrice(ind.unitPrice), 'right')) +
        `</w:tr>`
      );
    })
    .join('');

  // A <w:tc> must end with <w:p>; the raw-xml replacement removes the marker
  // paragraph, so append one here to keep the cell valid.
  const trailingP = `<w:p><w:pPr>${SPACING}</w:pPr></w:p>`;

  return `<w:tbl>${tblPr}${tblGrid}${headerRow}${dataRows}</w:tbl>${trailingP}`;
}

export function buildRequestSampleRows(
  samples: TestRequestSampleDto[] | undefined
): RequestSampleRow[] {
  return (samples ?? []).map((s, idx) => ({
    No: String(idx + 1),
    NameOfSample: s.sampleName || '',
    Quantity: s.sampleQuantity || '',
    SampleInfo: s.statusText || '',
    IndicatorsXml: buildIndicatorsTableXml(s.indicators),
  }));
}
