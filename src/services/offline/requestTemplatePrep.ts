/**
 * Prepare the BM05 (test-request / phiếu yêu cầu) template for offline filling.
 *
 * The canonical template uses a NESTED table (one indicator sub-table per sample
 * row) that the backend clones server-side, with split-run placeholders — too
 * fragile to transform into nested docxtemplater loops on the client. Offline we
 * use a simpler "flat" layout: keep the outer sample table, loop one row per
 * sample, and render that sample's indicators (+ unit price) as a text list in
 * the "Chỉ tiêu kiểm nghiệm" cell.
 *
 * Transform (runtime, from the canonical template so it never drifts):
 *  - `{{No}}` (contiguous) -> `{{#rows}}{{No}}` (open per-sample loop)
 *  - remove the nested indicator sub-table, replace with a raw-xml paragraph
 *    `{{@IndicatorsXml}}` + `{{/rows}}` (close loop at end of the sample row)
 * NameOfSample/Quantity/SampleInfo stay split-run; docxtemplater merges runs at
 * render time, so they fill correctly per row.
 */

import PizZip from 'pizzip';

const DOC = 'word/document.xml';

function balancedEnd(s: string, from: number, open: string, close: string): number {
  const re = new RegExp(`${open}|${close}`, 'g');
  re.lastIndex = from;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[0] === close.replace(/\\/g, '')) {
      depth--;
      if (depth === 0) return m.index + m[0].length;
    } else {
      depth++;
    }
  }
  return -1;
}

export interface PreparedTemplate {
  blob: Blob;
}

export async function prepareRequestTemplate(
  template: Blob | ArrayBuffer
): Promise<PreparedTemplate> {
  const buffer = template instanceof Blob ? await template.arrayBuffer() : template;
  const zip = new PizZip(buffer);
  const file = zip.file(DOC);
  if (!file) throw new Error('Template không hợp lệ: thiếu word/document.xml');
  let xml = file.asText();

  const iNo = xml.indexOf('{{No}}');
  if (iNo === -1) throw new Error('Template BM05 không chứa {{No}} — không nhận diện được dòng mẫu');

  // Plain lastIndexOf('<w:tr', ...) also matches inside "<w:trPr>" (row
  // properties, immediately follows the real <w:tr> tag) since "<w:tr" is a
  // prefix of "<w:trPr" — walk backward until the char after "<w:tr" is the
  // tag's own boundary (space or '>'), i.e. the actual row-open tag.
  let trOpen = iNo;
  do {
    trOpen = xml.lastIndexOf('<w:tr', trOpen - 1);
  } while (trOpen !== -1 && xml[trOpen + 5] !== ' ' && xml[trOpen + 5] !== '>');
  // Sample row contains a nested table (nested <w:tr>) -> balance to its close.
  let depth = 0;
  let trEnd = -1;
  const re = /<w:tr\b|<\/w:tr>/g;
  re.lastIndex = trOpen;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[0] === '</w:tr>') {
      depth--;
      if (depth === 0) {
        trEnd = m.index + m[0].length;
        break;
      }
    } else {
      depth++;
    }
  }
  if (trEnd === -1) throw new Error('Không xác định được cuối dòng mẫu BM05');

  let sampleTr = xml.slice(trOpen, trEnd);

  // Remove the nested indicator sub-table.
  const itOpen = sampleTr.indexOf('<w:tbl>');
  if (itOpen !== -1) {
    const itEnd = balancedEnd(sampleTr, itOpen, '<w:tbl>', '</w:tbl>');
    if (itEnd !== -1) {
      const marker =
        '<w:p><w:r><w:t xml:space="preserve">{{@IndicatorsXml}}{{/rows}}</w:t></w:r></w:p>';
      sampleTr = sampleTr.slice(0, itOpen) + marker + sampleTr.slice(itEnd);
    }
  }
  // Open the per-sample loop.
  sampleTr = sampleTr.replace('{{No}}', '{{#rows}}{{No}}');

  xml = xml.slice(0, trOpen) + sampleTr + xml.slice(trEnd);
  zip.file(DOC, xml);
  const blob = zip.generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
  return { blob };
}
