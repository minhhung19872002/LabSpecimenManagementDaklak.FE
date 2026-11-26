/**
 * Trạng thái "máy chủ không phản hồi" (OF-07).
 *
 * Mạng của máy vẫn có (navigator.onLine = true) nhưng proxy trả 502/503 vì backend
 * đang dừng/khởi động lại → coi như mất mạng: hiện biểu tượng offline, lưu phiếu tạm,
 * tự đồng bộ khi máy chủ hoạt động lại.
 *
 * Module này không import gì để api.ts (axios interceptor) và connectivity.ts dùng chung
 * mà không bị vòng import.
 */

type Listener = (down: boolean) => void;

let serverDown = false;
const listeners = new Set<Listener>();

/** Thông báo khi proxy trả 502/503 (không hiện "502 Bad Gateway" cho người dùng). */
export const SERVER_UNAVAILABLE_MESSAGE =
  'Máy chủ đang tạm thời không phản hồi, vui lòng thử lại sau.';

/** Thông báo khi proxy trả 504: request có thể đã được máy chủ xử lý → không lưu tạm (tránh trùng). */
export const SERVER_TIMEOUT_MESSAGE =
  'Máy chủ phản hồi chậm, vui lòng kiểm tra lại danh sách trước khi tạo lại';

/** HTTP status mà proxy trả khi backend không phản hồi → coi như mất mạng. */
export function isServerUnavailableStatus(status: number | undefined): boolean {
  return status === 502 || status === 503;
}

export function isServerMarkedDown(): boolean {
  return serverDown;
}

/** Gọi khi nhận 502/503 từ proxy. */
export function reportServerUnavailable(): void {
  if (serverDown) return;
  serverDown = true;
  listeners.forEach((l) => l(true));
}

/** Gọi khi máy chủ trả lời bình thường (bất kỳ response < 500 nào). */
export function reportServerAvailable(): void {
  if (!serverDown) return;
  serverDown = false;
  listeners.forEach((l) => l(false));
}

export function onServerAvailabilityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
