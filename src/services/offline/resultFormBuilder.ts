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
  /** Used by BM02 mixed-result grouping. */
  sampleCode?: string;
  sampleName?: string;
  // Standard limit fields (BM04 "Giới hạn" column = CompareWithStandard).
  comparisonOperator?: string;
  allowedLimit?: string;
  lowerOperator?: string;
  lowerLimit?: string;
  upperOperator?: string;
  upperLimit?: string;
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
  /** "Giới hạn" cell (BM04 {{CompareWithStandard}}); blank for templates without it. */
  CompareWithStandard: string;
}

/** Normalize a comparison operator to its display symbol (<=, >= -> ≤, ≥). */
function opSymbol(o?: string): string {
  const t = (o ?? '').trim();
  if (t === '<=') return '≤';
  if (t === '>=') return '≥';
  return t;
}

/**
 * Build the "Giới hạn" / CompareWithStandard text from a single indicator's
 * limit fields, mirroring the backend BuildCompareWithStandard:
 *   range  -> "{lowerOp|>} {lowerLimit} và {upperOp|<} {upperLimit}"
 *   single -> "{op} {allowedLimit}" (or just the limit when no operator).
 */
function buildCompareWithStandard(i: ResultIndicatorInput): string {
  const lower = i.lowerLimit?.trim();
  const upper = i.upperLimit?.trim();
  if (lower && upper) {
    const lo = i.lowerOperator?.trim() ? opSymbol(i.lowerOperator) : '>';
    const up = i.upperOperator?.trim() ? opSymbol(i.upperOperator) : '<';
    return `${lo} ${lower} và ${up} ${upper}`;
  }
  const limit = i.allowedLimit?.trim();
  if (!limit) return '';
  const op = opSymbol(i.comparisonOperator);
  return op ? `${op} ${limit}` : limit;
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
        // Stack each child's limit, like the backend combined-limit cell.
        CompareWithStandard: sortedChildren
          .map((c) => buildCompareWithStandard(c))
          .join('\n'),
      });
    } else {
      rows.push({
        No: String(no++),
        ParametersXml: htmlToParagraphXml(nameHtml(parent), base),
        Unit: parent.unit ?? '',
        Result: parent.result ?? '',
        TestMethod: parent.methodName ?? '',
        TestMethodXml: htmlToParagraphXml(methodHtml(parent), base),
        CompareWithStandard: buildCompareWithStandard(parent),
      });
    }
  }

  return rows;
}

/** A single rendered BM02 mixed-result row (one indicator per row, grouped by sample). */
export interface MixedResultTableRow {
  No: string;
  NameOfSample: string;
  CodeOfNumber: string;
  /** Raw OOXML paragraph for the indicator name cell ({{@ParameterXml}}). */
  ParameterXml: string;
  Unit: string;
  TestMethod: string;
  Result: string;
  Quantity: string;
  SampleDescription: string;
}

/**
 * Build BM02 mixed-result rows, mirroring the backend (online) layout:
 *  - rows are grouped by sample (sampleCode), in first-seen order;
 *  - within a sample, a parent + its children collapse into ONE row whose
 *    Parameters cell lists the parent then each child ("- child") and whose
 *    Result cell stacks the children's results — standalone indicators become
 *    one row each;
 *  - rows inside a sample are ordered by TestMethod (matches the backend
 *    `OrderBy(TestMethod)`).
 *
 * Parent indicators are NOT selectable/approved, so they arrive via
 * `parentLookup` (indicatorId -> parent) purely to supply the group header
 * name, exactly like the backend's `indicatorDict`.
 *
 * No vertical merge is applied (offline limitation); sample info repeats per
 * row instead of spanning.
 */
export function buildMixedResultTableRows(
  indicators: ResultIndicatorInput[],
  parentLookup?: Map<string, ResultIndicatorInput>,
  base: OoxmlBaseStyle = { font: TIMES, sizePt: 11 }
): MixedResultTableRow[] {
  const sampleOrder: string[] = [];
  const sampleMap = new Map<string, { name: string; inds: ResultIndicatorInput[] }>();

  for (const ind of indicators) {
    const key = ind.sampleCode ?? '';
    if (!sampleMap.has(key)) {
      sampleOrder.push(key);
      sampleMap.set(key, { name: ind.sampleName ?? '', inds: [] });
    }
    sampleMap.get(key)!.inds.push(ind);
  }

  // Intermediate row (pre-render) so we can sort by method before building XML.
  interface BuiltRow {
    paramHtml: string;
    unit: string;
    method: string;
    result: string;
  }

  const rows: MixedResultTableRow[] = [];
  let sampleNo = 1;

  for (const key of sampleOrder) {
    const sample = sampleMap.get(key)!;

    // Split this sample's selected indicators into children (have a parent) and
    // standalone. Parents themselves are not in the selected list.
    const childrenByParent = new Map<string, ResultIndicatorInput[]>();
    const standalone: ResultIndicatorInput[] = [];
    for (const ind of sample.inds) {
      const pid = ind.parentIndicatorId;
      if (pid) {
        const arr = childrenByParent.get(pid) ?? [];
        arr.push(ind);
        childrenByParent.set(pid, arr);
      } else {
        standalone.push(ind);
      }
    }

    const built: BuiltRow[] = [];

    // Standalone indicators -> one row each.
    for (const ind of [...standalone].sort(bySortOrder)) {
      built.push({
        paramHtml: nameHtml(ind),
        unit: ind.unit ?? '',
        method: ind.methodName ?? '',
        result: ind.result ?? '',
      });
    }

    // Parent groups -> parent header + children stacked into one row.
    for (const [parentId, children] of childrenByParent) {
      const sortedChildren = [...children].sort(bySortOrder);
      const parent = parentLookup?.get(parentId);
      const parentName = parent ? nameHtml(parent) : '';
      const paramParts = parentName ? [parentName] : [];
      paramParts.push(...sortedChildren.map((c) => `- ${nameHtml(c)}`));
      const first = sortedChildren[0];
      built.push({
        paramHtml: paramParts.join('<br/>'),
        unit: first.unit ?? '',
        method: first.methodName ?? '',
        result: sortedChildren.map((c) => c.result ?? '').join('\n'),
      });
    }

    // Order rows within the sample by TestMethod (matches backend behaviour).
    built.sort((a, b) =>
      a.method.localeCompare(b.method, undefined, { sensitivity: 'base' })
    );

    for (const b of built) {
      rows.push({
        No: String(sampleNo),
        NameOfSample: sample.name,
        CodeOfNumber: key,
        ParameterXml: htmlToParagraphXml(b.paramHtml, base),
        Unit: b.unit || '-',
        TestMethod: b.method,
        Result: b.result,
        Quantity: '',
        SampleDescription: '',
      });
    }
    sampleNo++;
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
  /** Phó Giám đốc ký (tên đã chọn). */
  VicePresident?: string;
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
