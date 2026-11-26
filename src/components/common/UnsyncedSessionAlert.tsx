import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { getUnsyncedCount } from '../../services/offline/db';
import { authRequiredMessage } from '../../services/offline/syncManager';

/**
 * OF-09: hết phiên mà máy còn phiếu tạo offline chưa đồng bộ → nhắc đăng nhập lại.
 * Đăng nhập lại xong, syncManager tự đồng bộ (người tạo = người tạo phiếu lúc offline).
 * Dùng ở trang 401 và trang đăng nhập.
 */
export const UnsyncedSessionAlert: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    getUnsyncedCount()
      .then((n) => {
        if (alive) setCount(n);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (count === 0) return null;

  return (
    <Alert
      data-testid="unsynced-session-alert"
      type="warning"
      showIcon
      message={authRequiredMessage(count)}
      style={style}
    />
  );
};

export default UnsyncedSessionAlert;
