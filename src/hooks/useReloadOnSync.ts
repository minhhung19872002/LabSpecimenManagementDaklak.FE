import { useEffect } from "react";
import { syncManager } from "../services/offline/syncManager";

/**
 * Tải lại dữ liệu khi lượt đồng bộ offline xong (hoặc người dùng bỏ mục đồng bộ)
 * → dòng tạm được thay bằng bản ghi thật, tag "Chờ/Lỗi đồng bộ" cập nhật mà không cần F5
 */
export function useReloadOnSync(reload: () => void) {
  useEffect(() => {
    syncManager.on("syncComplete", reload);
    syncManager.on("itemsDiscarded", reload);
    return () => {
      syncManager.off("syncComplete", reload);
      syncManager.off("itemsDiscarded", reload);
    };
  }, [reload]);
}
