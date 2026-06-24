/**
 * Offline result-form orchestration.
 *
 * Ties together the cached template, the table builder and the draft store so
 * the UI can, while offline, turn cached/entered result data into an editable
 * .docx draft:
 *
 *   cached indicators+results --map--> ResultIndicatorInput[]
 *                                --build+fill--> .docx blob
 *                                --saveResultDraft--> draftId
 *   then open /document-editor?offlineDraft=<draftId>
 *
 * NOTE: the *source* of offline result data (cache-on-view of a Testing detail,
 * or an offline entry form) and the *upload* of finished drafts to the backend
 * are separate wiring steps — see syncManager + the Testing pages. This service
 * only assembles the document from data it is given.
 */

import {
  generateResultFormOffline,
} from './offlinePrintService';
import { saveResultDraft } from './db';
import { ResultFormHeader, ResultIndicatorInput } from './resultFormBuilder';

/** Shape produced by testingService.getDetail() indicators (subset we need). */
export interface TestingIndicatorLike {
  indicatorId: string;
  indicatorName?: string;
  indicatorFormattedName?: string;
  parentIndicatorId?: string | null;
  sortOrder?: number;
  unit?: string;
  result?: string;
  methodName?: string;
  methodFormattedName?: string;
}

/** Map Testing/LaboratoryTask indicators to the builder's input shape. */
export function mapTestingIndicators(
  indicators: TestingIndicatorLike[]
): ResultIndicatorInput[] {
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
  }));
}

export interface GenerateResultDraftResult {
  success: boolean;
  draftId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Generate a BM01 result form offline from already-available data and persist
 * it as an editable draft. Returns the draft id to open in the editor.
 */
export async function generateResultDraft(
  header: ResultFormHeader,
  indicators: ResultIndicatorInput[],
  meta?: { testRequestId?: string; sampleCode?: string }
): Promise<GenerateResultDraftResult> {
  const gen = await generateResultFormOffline(header, indicators);
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
