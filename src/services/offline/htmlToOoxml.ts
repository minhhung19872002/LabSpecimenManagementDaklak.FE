/**
 * HTML -> OOXML runs converter (offline, client-side)
 *
 * Mirrors the subset of HTML that the backend `HtmlToOpenXmlConverter` produces
 * for result-form cells (bold/italic/underline/strike, sub/sup for chemical
 * formulas like NO₃⁻, line breaks and simple lists). The output is injected into
 * a DOCX template via docxtemplater's raw-xml tag `{{@field}}`, which replaces a
 * whole `<w:p>` — so we emit a complete paragraph and replicate the base run
 * properties (font, size) to preserve the template's cell formatting.
 *
 * Scope deliberately matches the tags the app actually emits (see backend
 * HtmlToOpenXmlConverter.cs): b/strong, i/em, u, s/strike, sub, sup, br, p,
 * ul/ol/li. Anything else degrades to plain text.
 */

export interface OoxmlBaseStyle {
  /** Font family applied to every run (e.g. "Times New Roman"). */
  font?: string;
  /** Font size in points (OOXML half-points are derived automatically). */
  sizePt?: number;
  /** Paragraph justification: left | center | right | both. */
  align?: 'left' | 'center' | 'right' | 'both';
}

interface InlineState {
  b: boolean;
  i: boolean;
  u: boolean;
  strike: boolean;
  vert: 'superscript' | 'subscript' | null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRunProps(state: InlineState, base: OoxmlBaseStyle): string {
  let rPr = '';
  if (base.font) {
    rPr += `<w:rFonts w:ascii="${base.font}" w:hAnsi="${base.font}" w:cs="${base.font}"/>`;
  }
  if (state.b) rPr += '<w:b/>';
  if (state.i) rPr += '<w:i/>';
  if (state.u) rPr += '<w:u w:val="single"/>';
  if (state.strike) rPr += '<w:strike/>';
  if (state.vert) rPr += `<w:vertAlign w:val="${state.vert}"/>`;
  if (base.sizePt) {
    const halfPts = Math.round(base.sizePt * 2);
    rPr += `<w:sz w:val="${halfPts}"/><w:szCs w:val="${halfPts}"/>`;
  }
  return rPr ? `<w:rPr>${rPr}</w:rPr>` : '';
}

/**
 * Convert an HTML fragment to a single `<w:p>` paragraph string.
 * Returns OOXML safe to use as a docxtemplater raw-xml ({{@tag}}) value.
 */
export function htmlToParagraphXml(html: string, base: OoxmlBaseStyle = {}): string {
  const state: InlineState = { b: false, i: false, u: false, strike: false, vert: null };
  let runs = '';

  const open = (tag: string) => {
    switch (tag) {
      case 'b':
      case 'strong':
        state.b = true;
        break;
      case 'i':
      case 'em':
        state.i = true;
        break;
      case 'u':
        state.u = true;
        break;
      case 's':
      case 'strike':
        state.strike = true;
        break;
      case 'sup':
        state.vert = 'superscript';
        break;
      case 'sub':
        state.vert = 'subscript';
        break;
    }
  };
  const close = (tag: string) => {
    switch (tag) {
      case 'b':
      case 'strong':
        state.b = false;
        break;
      case 'i':
      case 'em':
        state.i = false;
        break;
      case 'u':
        state.u = false;
        break;
      case 's':
      case 'strike':
        state.strike = false;
        break;
      case 'sup':
      case 'sub':
        state.vert = null;
        break;
    }
  };

  const emitText = (text: string) => {
    // Collapse HTML whitespace the way a browser would, but keep single spaces.
    const decoded = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, ' ');
    if (!decoded) return;
    runs += `<w:r>${buildRunProps(state, base)}<w:t xml:space="preserve">${escapeXml(decoded)}</w:t></w:r>`;
  };
  const emitBreak = () => {
    runs += '<w:r><w:br/></w:r>';
  };

  // Tokenize into tags vs text. `li`/`p`/`br` produce line breaks; `ul`/`ol`
  // are structural and ignored (their `li` children carry the breaks).
  const re = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>|([^<]+)/g;
  let m: RegExpExecArray | null;
  let firstLine = true;
  while ((m = re.exec(html)) !== null) {
    if (m[3] != null) {
      emitText(m[3]);
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'br') {
      emitBreak();
    } else if (tag === 'li' && !closing) {
      if (!firstLine) emitBreak();
      firstLine = false;
      // Bullet marker for list items (visual only, matches simple BE output).
      runs += `<w:r>${buildRunProps(state, base)}<w:t xml:space="preserve">- </w:t></w:r>`;
    } else if (tag === 'p' && !closing) {
      if (!firstLine) emitBreak();
      firstLine = false;
    } else if (closing) {
      close(tag);
    } else {
      open(tag);
    }
  }

  const pPr = base.align ? `<w:pPr><w:jc w:val="${base.align}"/></w:pPr>` : '';
  return `<w:p>${pPr}${runs}</w:p>`;
}

/** True when the value contains any HTML tag we should convert. */
export function containsHtml(value: string | null | undefined): boolean {
  return !!value && /<\/?[a-zA-Z][^>]*>/.test(value);
}
