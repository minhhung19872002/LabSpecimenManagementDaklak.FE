import { useCallback, useState } from "react";
import { authService } from "../../../../services/authService";

// Mặc định ghim: Nhóm chỉ tiêu, Phương pháp thử, Danh mục vật tư thiết bị (theo mockup Cấp 1)
const DEFAULT_PINNED = ["indicators", "testMethods", "products"];
const STATS_OPEN_KEY = "masterData.statsOpen";

const pinnedStorageKey = () =>
  `masterData.pinnedCategories.${authService.getUserInfo()?.id ?? "anonymous"}`;

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua: trình duyệt chặn storage thì chỉ mất ghi nhớ, không ảnh hưởng chức năng
  }
};

/** State UI của thanh danh mục bên trái + khối thống kê (ghi nhớ theo trình duyệt). */
export const useMasterDataSidebar = () => {
  const [filterText, setFilterText] = useState("");
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() =>
    readJson<string[]>(pinnedStorageKey(), DEFAULT_PINNED),
  );
  const [statsOpen, setStatsOpen] = useState<boolean>(() =>
    readJson<boolean>(STATS_OPEN_KEY, false),
  );

  const togglePin = useCallback((key: string) => {
    setPinnedKeys((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      writeJson(pinnedStorageKey(), next);
      return next;
    });
  }, []);

  const toggleStats = useCallback(() => {
    setStatsOpen((prev) => {
      writeJson(STATS_OPEN_KEY, !prev);
      return !prev;
    });
  }, []);

  return {
    filterText,
    setFilterText,
    pinnedKeys,
    togglePin,
    statsOpen,
    toggleStats,
  };
};
