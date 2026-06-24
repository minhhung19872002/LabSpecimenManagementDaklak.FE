/**
 * Sync offline result-form drafts to the backend.
 *
 * Strategy "sync-file" (chosen because technicians edit layout/formatting of the
 * .docx, which the backend cannot regenerate from data): the edited .docx is
 * uploaded as-is to the WOPI PutFile endpoint — the same endpoint Collabora uses
 * to persist edits — which writes it into the backend `temp/` folder.
 *
 *   POST {API}/wopi/files/{base64url(fileName)}/contents   body = .docx bytes
 *
 * TODO(finalize): WOPI PutFile only stores the file in temp/. Attaching the
 * uploaded result form to its test request / exporting the official PDF
 * (Gotenberg) is a separate business step in the online flow that still needs to
 * be mapped/triggered after upload. Until then, sync only persists the file.
 */

import {
  getResultDraftsByStatus,
  updateResultDraftStatus,
} from './db';
import { API_BASE_URL } from '../api';

/** Encode a file name to a WOPI fileId (base64url of UTF-8), matching the BE. */
function encodeFileId(fileName: string): string {
  const bytes = new TextEncoder().encode(fileName);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface DraftSyncResult {
  synced: number;
  failed: number;
}

/**
 * Upload all `pending-sync` result drafts via WOPI PutFile.
 * Marks each draft `synced` or `failed`. Safe to call repeatedly.
 */
export async function syncResultDrafts(): Promise<DraftSyncResult> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const drafts = await getResultDraftsByStatus('pending-sync');
  let synced = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const fileId = encodeFileId(draft.fileName);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/wopi/files/${fileId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: draft.blob,
      });
      if (!res.ok) throw new Error(`Upload thất bại (HTTP ${res.status})`);
      await updateResultDraftStatus(draft.id, 'synced');
      synced++;
    } catch (e) {
      await updateResultDraftStatus(
        draft.id,
        'failed',
        e instanceof Error ? e.message : String(e)
      );
      failed++;
    }
  }
  return { synced, failed };
}

// Auto-sync drafts when connection is restored.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncResultDrafts().catch((e) => console.error('[offlineDraftSync] failed:', e));
  });
}
