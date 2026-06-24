/**
 * Reliable online/offline detection.
 *
 * `navigator.onLine` only reflects whether a network interface is "up" — it is
 * `true` even when there is no real Internet (Wi-Fi with no uplink, a Docker/VPN
 * virtual adapter, captive portals). For flows that must reach the backend
 * (generating/printing forms) we actually probe the server with a short timeout
 * and treat unreachable as offline, so the offline fallback kicks in correctly.
 */

let lastCheck = { at: 0, reachable: true };

/**
 * True if the app server is actually reachable right now.
 * Quick negative when `navigator.onLine` is false; otherwise probes
 * `/version.json` (same-origin, no CORS) with an abort timeout.
 */
export async function isServerReachable(timeoutMs = 3000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Stamp via Date.now() to bypass any cache; same-origin so no CORS.
    const res = await fetch(`/version.json?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const reachable = res.ok;
    lastCheck = { at: Date.now(), reachable };
    return reachable;
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
