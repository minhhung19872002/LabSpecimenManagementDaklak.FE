/**
 * Result-form table builder (offline, client-side)
 *
 * Ports the backend `ResultFormAppService` table-building logic (parent/child
 * indicators, units, methods, superscript) so a BM01 result form can be filled
 * entirely in the browser. Produces the `rows` array + scalar placeholders that
 * `docxFill.fillDocxTemplate` consumes against the prepared loop template.
 *
 * Input is a flat list of indicators (shape compatible with both
 * TestingIndicatorDto and LaboratoryTaskIndicatorDto). Output rows carry the
 * indicator name as raw OOXML (`@ParametersXml`) so chemical formulas
 * (NO₃⁻, CaCO₃) render with sub/superscript.
 */

import { htmlToParagraphXml, containsHtml, OoxmlBaseStyle } from './htmlToOoxml';

/** Minimal indicator shape needed to build a result row. */
export interface ResultIndicatorInput {
  indicatorId: string;
  /** Plain indicator name. */
  indicatorName?: string;
  /** HTML-formatted name (sub/sup/bold...). Falls back to indicatorName. */
  indicatorFormattedName?: string;
  /** null/undefined => top-level; otherwise child of that parent. */
  parentIndicatorId?: string | null;
  sortOrder?: number;
  unit?: string;
  result?: string;
  methodName?: string;
  methodFormattedName?: string;
}

/** A single rendered table row, ready for docxtemplater. */
export interface ResultTableRow {
  No: string;
  /** Raw OOXML paragraph for the Parameters cell (use as {{@ParametersXml}}). */
  ParametersXml: string;
  Unit: string;
  Result: string;
  /** Plain-text method name for {{TestMethod}} split-run cell (docxtemplater merges runs). */
  TestMethod: string;
  /** Raw OOXML paragraph for the Test method cell — reserved for future raw-xml use. */
  TestMethodXml: string;
}

const TIMES = 'Times New Roman';

function nameHtml(i: ResultIndicatorInput): string {
  const v = i.indicatorFormattedName || i.indicatorName || '';
  return v;
}

function methodHtml(i: ResultIndicatorInput): string {
  return i.methodFormattedName || i.methodName || '';
}

function bySortOrder(a: ResultIndicatorInput, b: ResultIndicatorInput): number {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

/**
 * Build the result table rows from a flat indicator list.
 *
 * Mirrors backend grouping: a parent indicator that has children is rendered as
 * one row whose Parameters cell lists the parent then each child on its own
 * line ("- child"), and whose Result cell stacks the children's results.
 * Standalone indicators become one row each. Orphan children (parent not in the
 * list) are rendered as standalone rows.
 */
export function buildResultTableRows(
  indicators: ResultIndicatorInput[],
  base: OoxmlBaseStyle = { font: TIMES, sizePt: 11 }
): ResultTableRow[] {
  const byId = new Map<string, ResultIndicatorInput>();
  indicators.forEach((i) => byId.set(i.indicatorId, i));

  const childrenByParent = new Map<string, ResultIndicatorInput[]>();
  const topLevel: ResultIndicatorInput[] = [];
  for (const ind of indicators) {
    const pid = ind.parentIndicatorId;
    if (pid && byId.has(pid)) {
      const arr = childrenByParent.get(pid) ?? [];
      arr.push(ind);
      childrenByParent.set(pid, arr);
    } else {
      // top-level, or orphan child whose parent isn't present
      topLevel.push(ind);
    }
  }

  const rows: ResultTableRow[] = [];
  let no = 1;

  for (const parent of [...topLevel].sort(bySortOrder)) {
    const children = childrenByParent.get(parent.indicatorId);
    if (children && children.length > 0) {
      // Combined parent + children in a single row.
      const sortedChildren = [...children].sort(bySortOrder);
      const paramParts = [nameHtml(parent), ...sortedChildren.map((c) => `- ${nameHtml(c)}`)];
      const resultParts = sortedChildren.map((c) => c.result ?? '');
      const first = sortedChildren[0];
      rows.push({
        No: String(no++),
        ParametersXml: htmlToParagraphXml(paramParts.join('<br/>'), base),
        Unit: first.unit ?? '',
        Result: resultParts.join('\n'),
        TestMethod: first.methodName ?? '',
        TestMethodXml: htmlToParagraphXml(methodHtml(first), base),
      });
    } else {
      rows.push({
        No: String(no++),
        ParametersXml: htmlToParagraphXml(nameHtml(parent), base),
        Unit: parent.unit ?? '',
        Result: parent.result ?? '',
        TestMethod: parent.methodName ?? '',
        TestMethodXml: htmlToParagraphXml(methodHtml(parent), base),
      });
    }
  }

  return rows;
}

/** Scalar (non-table) fields for the BM01 result form header/footer. */
export interface ResultFormHeader {
  NameOfSample?: string;
  SampleCode?: string;
  ContractNo?: string;
  Customer?: string;
  Address?: string;
  DateOfReceiving?: string;
  TimeOfTesting?: string;
  SampleDescription?: string;
  Quantity?: string;
  DateOfIssue?: string;
  CurrentDate?: string;
  OfficerInCharge?: string;
  Note?: string;
}

/**
 * Assemble the full data object for the prepared BM01 loop template:
 * scalars (blank-safe) + rows[].
 */
export function buildResultFormData(
  header: ResultFormHeader,
  indicators: ResultIndicatorInput[]
): Record<string, unknown> {
  const rows = buildResultTableRows(indicators);
  const scalars: Record<string, string> = {};
  for (const [k, v] of Object.entries(header)) {
    scalars[k] = v ?? '';
  }
  // Note may contain HTML -> expose as raw-xml too.
  const noteRaw = containsHtml(header.Note)
    ? { NoteXml: htmlToParagraphXml(header.Note as string, { font: TIMES, sizePt: 11 }) }
    : {};
  return { ...scalars, ...noteRaw, rows };
}
