/**
 * Reliable online/offline detection.
 *
 * `navigator.onLine` only reflects whether a network interface is "up" — it is
 * `true` even when there is no real Internet (Wi-Fi with no uplink, a Docker/VPN
 * virtual adapter, captive portals). For flows that must reach the backend
 * (generating/printing forms) we actually probe the server.
 *
 * IMPORTANT: we probe the BACKEND API (cross-origin), NOT a same-origin file.
 * This is a PWA — the Service Worker serves same-origin assets (e.g.
 * /version.json) from cache, so they "succeed" even when offline. The API host
 * is a different origin the SW does not cache, so a failed request there is a
 * true signal of being offline. We use `mode: 'no-cors'` so the request resolves
 * on reachability without needing CORS (we only care that it resolves vs throws).
 */

import { API_BASE_URL } from '../api';

let lastCheck = { at: 0, reachable: true };

/**
 * True if the backend API is actually reachable right now.
 * Fast negative when `navigator.onLine` is false; otherwise probes the API host
 * with an abort timeout. A network failure (DNS/unreachable) => offline.
 */
export async function isServerReachable(timeoutMs = 3000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastCheck = { at: Date.now(), reachable: false };
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Cross-origin API host (not cached by the same-origin Service Worker).
    // `no-cors` => opaque response; we only need it to RESOLVE (reachable) vs
    // THROW (offline), so the status/body are irrelevant.
    await fetch(`${API_BASE_URL}/health?_=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    lastCheck = { at: Date.now(), reachable: true };
    return true;
  } catch {
    lastCheck = { at: Date.now(), reachable: false };
    return false;
  }
}

/** Convenience inverse of isServerReachable(). */
export async function isEffectivelyOffline(timeoutMs?: number): Promise<boolean> {
  return !(await isServerReachable(timeoutMs));
}

/** Last probe result (synchronous best-effort, e.g. for quick UI hints). */
export function getLastReachable(): boolean {
  return lastCheck.reachable;
}
