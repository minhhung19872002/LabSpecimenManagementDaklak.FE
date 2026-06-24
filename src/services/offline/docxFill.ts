/**
 * Generic client-side DOCX template filler (offline).
 *
 * Wraps docxtemplater + pizzip with the conventions this project uses:
 *  - delimiters `{{ }}` (matching the backend templates),
 *  - dynamic table rows via loop sections `{{#rows}} ... {{/rows}}`,
 *  - rich text in a cell via raw-xml tags `{{@field}}` whose value is OOXML
 *    produced by `htmlToParagraphXml` (bold/sub/sup/… — see htmlToOoxml.ts).
 *
 * This is the engine proven in the offline-fill POC; the result-form data
 * builder (parent/child indicators, units, superscript) feeds it.
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export interface DocxFillResult {
  blob: Blob;
}

export class DocxFillError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'DocxFillError';
    this.details = details;
  }
}

/**
 * Render a DOCX template (as ArrayBuffer/Blob) with `data` and return a .docx Blob.
 * `data` may contain scalars ({{Field}}), raw-xml strings keyed for {{@Field}}
 * tags, and arrays for {{#loop}} sections.
 */
export async function fillDocxTemplate(
  template: Blob | ArrayBuffer,
  data: Record<string, unknown>
): Promise<DocxFillResult> {
  const buffer = template instanceof Blob ? await template.arrayBuffer() : template;
  const zip = new PizZip(buffer);

  let doc: Docxtemplater;
  try {
    doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
      // Missing tags render blank rather than throwing — safer offline where
      // a template may carry placeholders for fields not present in cache.
      nullGetter: () => '',
    });
  } catch (err) {
    throw toFillError('Không khởi tạo được template (.docx hỏng?)', err);
  }

  try {
    doc.render(data);
  } catch (err) {
    throw toFillError('Lỗi điền dữ liệu vào template', err);
  }

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return { blob };
}

/** Normalize docxtemplater's multi-error shape into a single DocxFillError. */
function toFillError(message: string, err: unknown): DocxFillError {
  const e = err as { message?: string; properties?: { errors?: Array<{ message?: string }> } };
  const details =
    e?.properties?.errors?.map((x) => x.message || '').filter(Boolean) ?? [];
  return new DocxFillError(`${message}: ${e?.message ?? String(err)}`, details);
}
