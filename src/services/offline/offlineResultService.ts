/**
 * Offline result-form orchestration.
 *
 * Flow (matches PrintIndicatorModal, the modal actually used for "In KQ"):
 *   online : getApprovedIndicators(testRequestId) -> cacheApprovedIndicators
 *   offline: getCachedApprovedIndicators -> pick selected -> build .docx draft
 *            -> open /document-editor?offlineDraft=<id> for layout edit + print
 *
 * Only assembles the document from data it is given/cached; the official report
 * is still produced by the backend from DB data when online.
 */

import dayjs from 'dayjs';
import { generateResultFormOffline } from './offlinePrintService';
import { saveResultDraft, cacheEntity, getCachedEntity } from './db';
import { ResultFormHeader, ResultIndicatorInput } from './resultFormBuilder';
import { TestRequestDto } from '../../types/testRequest';

/**
 * Indicator shape (subset) shared by QualityManagementIndicatorDto /
 * TestingIndicatorDto / LaboratoryTaskIndicatorDto — enough to build a row.
 */
export interface ResultIndicatorLike {
  id?: string;
  indicatorId: string;
  indicatorName?: string;
  indicatorFormattedName?: string;
  parentIndicatorId?: string | null;
  sortOrder?: number;
  unit?: string;
  result?: string;
  methodName?: string;
  methodFormattedName?: string;
  sampleCode?: string;
  sampleName?: string;
  comparisonOperator?: string;
  allowedLimit?: string;
  lowerOperator?: string;
  lowerLimit?: string;
  upperOperator?: string;
  upperLimit?: string;
}

/** Map a result-bearing indicator DTO to the table builder's input shape. */
export function mapIndicators(indicators: ResultIndicatorLike[]): ResultIndicatorInput[] {
  return indicators.map((i) => ({
    indicatorId: i.indicatorId,
    indicatorName: i.indicatorName,
    indicatorFormattedName: i.indicatorFormattedName,
    parentIndicatorId: i.parentIndicatorId ?? null,
    sortOrder: i.sortOrder,
    unit: i.unit,
    result: i.result,
    methodName: i.methodName,
    methodFormattedName: i.methodFormattedName,
    sampleCode: i.sampleCode,
    sampleName: i.sampleName,
    comparisonOperator: i.comparisonOperator,
    allowedLimit: i.allowedLimit,
    lowerOperator: i.lowerOperator,
    lowerLimit: i.lowerLimit,
    upperOperator: i.upperOperator,
    upperLimit: i.upperLimit,
  }));
}

// ===== Cache the TestRequest so offline result forms can fill header dates =====

/** Cache a TestRequest (with samples) while online, for offline result forms. */
export async function cacheTestRequestForOffline(
  testRequestId: string,
  data: unknown
): Promise<void> {
  if (!testRequestId) return;
  await cacheEntity('TestRequest', testRequestId, data, false);
}

/** Header fields that the result forms need but aren't in the quality task. */
export interface MixedHeaderExtras {
  DateOfReceiving?: string;
  DateOfIssue?: string;
  TimeOfTesting?: string;
  OfficerInCharge?: string;
  // BM05-QLNN extras.
  DateOfSending?: string;
  PlaceToSendSample?: string;
  DescriptionOfSample?: string;
  Standard?: string;
}

/** Minimal indicator shape for computing the result-form header extras. */
interface HeaderLeaf {
  testRequestSampleIndicatorId?: string;
  resultSentDate?: string;
  technicalManagerName?: string;
  sampleCode?: string;
  standardName?: string;
}

const fmtDate = (d?: string): string => (d ? dayjs(d).format('DD/MM/YYYY') : '');

/**
 * Build the header fields that the backend derives from the TestRequest and lab
 * tasks (Ngày nhận mẫu / Ngày hẹn trả KQ / Thời gian thử nghiệm / Phụ trách
 * phòng thử nghiệm). Reads the cached TestRequest; returns blanks if it isn't
 * cached. Mirrors the backend: TimeOfTesting = Min(testDate) - Max(resultSentDate).
 */
export async function buildMixedHeaderExtras(
  testRequestId: string | undefined,
  selectedLeaves: HeaderLeaf[]
): Promise<MixedHeaderExtras> {
  // OfficerInCharge comes from the selected indicators' lab technical manager.
  const officers = Array.from(
    new Set(
      selectedLeaves
        .map((l) => l.technicalManagerName?.trim())
        .filter((n): n is string => !!n)
    )
  );
  const extras: MixedHeaderExtras = { OfficerInCharge: officers.join(', ') };

  // BM05: standard text = distinct standard name(s) of the selected indicators.
  const standards = Array.from(
    new Set(
      selectedLeaves
        .map((l) => l.standardName?.trim())
        .filter((s): s is string => !!s)
    )
  );
  extras.Standard = standards.join('; ');

  if (!testRequestId) return extras;
  const cached = await getCachedEntity('TestRequest', testRequestId);
  const tr = cached?.data as TestRequestDto | undefined;
  if (!tr) return extras;

  extras.DateOfReceiving = fmtDate(tr.contractDate);
  extras.DateOfIssue = fmtDate(tr.resultDeliveryDate);
  // BM05-QLNN header fields.
  extras.DateOfSending = fmtDate(tr.requestDate);
  extras.PlaceToSendSample = tr.customerName ?? '';
  const sampleCode = selectedLeaves.find((l) => l.sampleCode)?.sampleCode;
  if (sampleCode) {
    const sample = (tr.samples ?? []).find((s) => s.sampleCode === sampleCode);
    extras.DescriptionOfSample = sample?.statusText ?? '';
  }

  // Map TestRequestSampleIndicator.id -> testDate (ngày thử nghiệm).
  const testDateById = new Map<string, string>();
  for (const sample of tr.samples ?? []) {
    for (const ind of sample.indicators ?? []) {
      if (ind.testDate) testDateById.set(ind.id, ind.testDate);
    }
  }

  const testDates: string[] = [];
  const submitDates: string[] = [];
  for (const leaf of selectedLeaves) {
    const td = leaf.testRequestSampleIndicatorId
      ? testDateById.get(leaf.testRequestSampleIndicatorId)
      : undefined;
    if (td) testDates.push(td);
    if (leaf.resultSentDate) submitDates.push(leaf.resultSentDate);
  }

  // ISO date strings compare lexicographically in chronological order.
  const minTest = testDates.length ? testDates.reduce((a, b) => (a < b ? a : b)) : undefined;
  const maxSubmit = submitDates.length ? submitDates.reduce((a, b) => (a > b ? a : b)) : undefined;
  const start = fmtDate(minTest);
  const end = fmtDate(maxSubmit);
  if (start && end) extras.TimeOfTesting = `${start} - ${end}`;
  else if (start) extras.TimeOfTesting = `${start} - ${start}`;
  else if (end) extras.TimeOfTesting = `${end} - ${end}`;

  return extras;
}

// ===== Cache-on-view: approved indicators keyed by testRequestId =====
const approvedCacheId = (testRequestId: string) => `approved-indicators:${testRequestId}`;

/** Cache approved indicators (with results) for a test request, while online. */
export async function cacheApprovedIndicators(
  testRequestId: string,
  indicators: ResultIndicatorLike[]
): Promise<void> {
  if (!testRequestId) return;
  await cacheEntity('TestResult', approvedCacheId(testRequestId), indicators, false);
}

/** Read cached approved indicators for a test request (null if not cached). */
export async function getCachedApprovedIndicators(
  testRequestId: string
): Promise<ResultIndicatorLike[] | null> {
  const entity = await getCachedEntity('TestResult', approvedCacheId(testRequestId));
  return entity ? (entity.data as ResultIndicatorLike[]) : null;
}

export interface GenerateResultDraftResult {
  success: boolean;
  draftId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Build a result-form .docx from the given indicators and persist it as an
 * editable offline draft. Returns the draft id to open in the editor.
 */
export async function generateResultDraft(
  indicators: ResultIndicatorLike[],
  header: ResultFormHeader = {},
  meta?: { testRequestId?: string; sampleCode?: string }
): Promise<GenerateResultDraftResult> {
  if (!indicators || indicators.length === 0) {
    return { success: false, error: 'Không có chỉ tiêu nào để tạo phiếu.' };
  }
  const gen = await generateResultFormOffline(header, mapIndicators(indicators));
  if (!gen.success || !gen.blob || !gen.fileName) {
    return { success: false, error: gen.error };
  }
  const draftId = await saveResultDraft({
    testRequestId: meta?.testRequestId,
    sampleCode: meta?.sampleCode ?? header.SampleCode,
    fileName: gen.fileName,
    blob: gen.blob,
    status: 'draft',
  });
  return { success: true, draftId, fileName: gen.fileName };
}

/** Build the editor URL for an offline draft. */
export function offlineDraftEditorUrl(draftId: string): string {
  return `/document-editor?offlineDraft=${encodeURIComponent(draftId)}`;
}

// ===== Cache-on-view: quality management task keyed by taskId =====

/** Cache a quality management task (with indicators) while online. */
export async function cacheQualityTask(taskId: string, task: unknown): Promise<void> {
  if (!taskId) return;
  await cacheEntity('QualityManagement', taskId, task, false);
}

/** Read a cached quality management task (null if not cached). */
export async function getCachedQualityTask(taskId: string): Promise<unknown | null> {
  const entity = await getCachedEntity('QualityManagement', taskId);
  return entity ? entity.data : null;
}
