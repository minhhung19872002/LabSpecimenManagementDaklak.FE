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

import { generateResultFormOffline } from './offlinePrintService';
import { saveResultDraft, cacheEntity, getCachedEntity } from './db';
import { ResultFormHeader, ResultIndicatorInput } from './resultFormBuilder';

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
  }));
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
