/**
 * Prepare a downloaded BM01 result-form template for docxtemplater.
 *
 * The canonical backend template fills a single data row and clones it server
 * side. For client-side filling we transform that single row into a
 * docxtemplater loop and switch the Parameters cell to a raw-xml tag so we can
 * inject rich text (sub/sup). Done at runtime from the canonical template so it
 * never drifts from what the backend ships.
 *
 * The {{TestMethod}} cell is split-run in the template (Word spell-checker).
 * Docxtemplater merges split runs automatically, so providing TestMethod: string
 * in each row populates the column without template surgery.
 */

import PizZip from 'pizzip';

const DOC_XML = 'word/document.xml';

// Row-level placeholders (each sits in its own <w:t>). {{Quantity}} is a header
// field (not a table column) and {{TestMethod}} lives outside the data row.
const ROW_FIRST = '{{No}}';
const ROW_TAIL_CANDIDATES = ['{{Result}}', '{{Unit}}'];

export interface PreparedTemplate {
  blob: Blob;
}

/**
 * Transform the template blob into a loop+raw-xml template.
 * Returns a new Blob; the input is not mutated.
 */
export async function prepareResultTemplate(
  template: Blob | ArrayBuffer
): Promise<PreparedTemplate> {
  const buffer = template instanceof Blob ? await template.arrayBuffer() : template;
  const zip = new PizZip(buffer);
  const file = zip.file(DOC_XML);
  if (!file) {
    throw new Error('Template không hợp lệ: thiếu word/document.xml');
  }
  let xml = file.asText();

  if (!xml.includes(ROW_FIRST)) {
    throw new Error('Template không chứa {{No}} — không nhận diện được dòng bảng kết quả');
  }

  // Find the row's last placeholder by XML position so the loop close lands at
  // the end of the data row.
  let tailTag: string | null = null;
  let tailIdx = -1;
  for (const t of ROW_TAIL_CANDIDATES) {
    const i = xml.indexOf(t);
    if (i > tailIdx) {
      tailIdx = i;
      tailTag = t;
    }
  }
  if (!tailTag) {
    throw new Error('Template không chứa {{Result}}/{{Unit}} — không xác định được cuối dòng bảng');
  }

  // Wrap the data row in a loop and switch Parameters to raw-xml.
  xml = xml.replace(ROW_FIRST, `{{#rows}}${ROW_FIRST}`);
  xml = xml.replace(tailTag, `${tailTag}{{/rows}}`);
  xml = xml.replace('{{Parameters}}', '{{@ParametersXml}}');

  zip.file(DOC_XML, xml);
  const blob = zip.generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
  return { blob };
}

/**
 * Transform the BM02 mixed-result template for docxtemplater.
 *
 * In BM02, {{TestTable}} and {{No}} share one <w:t>, and {{SubTable}} and
 * {{Parameter}} share another. We strip the marker tokens and wrap the row
 * in a docxtemplater loop, switching the Parameter cell to raw-xml so
 * chemical formulas render with sub/superscript.
 */
export async function prepareMixedResultTemplate(
  template: Blob | ArrayBuffer
): Promise<PreparedTemplate> {
  const buffer = template instanceof Blob ? await template.arrayBuffer() : template;
  const zip = new PizZip(buffer);
  const file = zip.file(DOC_XML);
  if (!file) {
    throw new Error('Template BM02 không hợp lệ: thiếu word/document.xml');
  }
  let xml = file.asText();

  if (!xml.includes('{{TestTable}}')) {
    throw new Error('Template BM02 không hợp lệ: thiếu marker {{TestTable}}');
  }

  // Loop open: drop {{TestTable}} marker, open before {{No}}.
  xml = xml.replace('{{TestTable}} {{No}}', '{{#rows}}{{No}}');
  // Parameter cell: drop {{SubTable}} marker, switch to raw-xml.
  xml = xml.replace('{{SubTable}} {{Parameter}}', '{{@ParameterXml}}');
  // Loop close: after {{Result}} (last column).
  xml = xml.replace('{{Result}}', '{{Result}}{{/rows}}');

  zip.file(DOC_XML, xml);
  const blob = zip.generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
  return { blob };
}
