import { useCallback, useEffect, useState } from "react";

const STATS_OPEN_KEY = "masterData.statsOpen";
const SIDEBAR_PREF_KEY = "masterData.sidebarOpen";
/** Từ độ rộng này sidebar mới đứng cố định bên trái; hẹp hơn → dải 48px + bật ra (theo mockup BA) */
const WIDE_QUERY = "(min-width: 1360px)";

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

const matchWide = () => typeof window !== "undefined" && !!window.matchMedia?.(WIDE_QUERY).matches;

/** State UI của thanh danh mục bên trái + khối thống kê (ghi nhớ theo trình duyệt). */
export const useMasterDataSidebar = () => {
  const [filterText, setFilterText] = useState("");
  const [statsOpen, setStatsOpen] = useState<boolean>(() => readJson<boolean>(STATS_OPEN_KEY, false));
  // Người dùng muốn sidebar mở (chỉ có tác dụng khi màn rộng)
  const [preferOpen, setPreferOpen] = useState<boolean>(() => readJson<boolean>(SIDEBAR_PREF_KEY, true));
  const [isWide, setIsWide] = useState<boolean>(matchWide);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.(WIDE_QUERY);
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const savePreferOpen = useCallback((open: boolean) => {
    setPreferOpen(open);
    writeJson(SIDEBAR_PREF_KEY, open);
  }, []);

  const inline = isWide && preferOpen;

  const collapse = useCallback(() => {
    savePreferOpen(false);
    setFlyoutOpen(false);
  }, [savePreferOpen]);

  /** Bấm dải thu gọn: màn rộng → mở lại cố định; màn hẹp → bật/tắt danh mục nổi */
  const openFromRail = useCallback(() => {
    if (isWide) {
      savePreferOpen(true);
      setFlyoutOpen(false);
    } else {
      setFlyoutOpen((v) => !v);
    }
  }, [isWide, savePreferOpen]);

  const closeFlyout = useCallback(() => setFlyoutOpen(false), []);

  const pinOpen = useCallback(() => {
    savePreferOpen(true);
    setFlyoutOpen(false);
  }, [savePreferOpen]);

  const toggleStats = useCallback(() => {
    setStatsOpen((prev) => {
      writeJson(STATS_OPEN_KEY, !prev);
      return !prev;
    });
  }, []);

  return {
    filterText,
    setFilterText,
    statsOpen,
    toggleStats,
    isWide,
    inline,
    flyoutOpen: !inline && flyoutOpen,
    collapse,
    openFromRail,
    closeFlyout,
    pinOpen,
  };
};
