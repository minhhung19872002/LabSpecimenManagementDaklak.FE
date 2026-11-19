import { useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { Modal } from "antd";

export interface LeaveConfirmOptions {
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
}

type HistoryMethod = (...args: unknown[]) => void;
interface PatchableNavigator {
  push: HistoryMethod;
  replace: HistoryMethod;
}

/**
 * Hỏi xác nhận trước khi rời trang khi `when` = true:
 * - Điều hướng trong app (menu, Link, navigate) → Modal.confirm.
 * - Đóng tab / tải lại trang → hộp thoại mặc định của trình duyệt.
 * App dùng <BrowserRouter> (không phải data router) nên không có useBlocker →
 * chặn bằng cách bọc navigator.push/replace.
 * Gọi `allowLeave()` ngay trước navigate() không cần hỏi (vd: lưu thành công).
 */
export function useLeaveConfirm(when: boolean, options: LeaveConfirmOptions) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const whenRef = useRef(when);
  const optionsRef = useRef(options);
  const bypassRef = useRef(false);

  useLayoutEffect(() => {
    whenRef.current = when;
    optionsRef.current = options;
  });

  useEffect(() => {
    const nav = navigator as unknown as PatchableNavigator;
    const originalPush = nav.push;
    const originalReplace = nav.replace;
    let confirmOpen = false;

    const guard =
      (original: HistoryMethod): HistoryMethod =>
      (...args) => {
        if (!whenRef.current || bypassRef.current) {
          original.apply(nav, args);
          return;
        }
        if (confirmOpen) return;
        confirmOpen = true;
        const { title, content, okText = "Rời trang", cancelText = "Ở lại" } = optionsRef.current;
        Modal.confirm({
          title,
          content,
          okText,
          okButtonProps: { danger: true },
          cancelText,
          centered: true,
          onOk: () => {
            bypassRef.current = true;
            original.apply(nav, args);
          },
          afterClose: () => {
            confirmOpen = false;
          },
        });
      };

    nav.push = guard(originalPush);
    nav.replace = guard(originalReplace);
    return () => {
      nav.push = originalPush;
      nav.replace = originalReplace;
    };
  }, [navigator]);

  useEffect(() => {
    if (!when) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when]);

  return useCallback(() => {
    bypassRef.current = true;
  }, []);
}
