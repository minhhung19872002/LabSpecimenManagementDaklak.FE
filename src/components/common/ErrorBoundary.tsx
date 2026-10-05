import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { syncManager } from '../../services/offline/syncManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
  reloading: boolean;
}

// Mốc lần tự reload gần nhất do lỗi tải chunk -> chặn reload lặp vô hạn khi chunk lỗi thật (không phải do mạng)
const CHUNK_RELOAD_KEY = 'chunk-error-reload-at';
const CHUNK_RELOAD_GUARD_MS = 10000;
// Chờ sync tối đa bấy nhiêu rồi vẫn reload (item sync dở sẽ được gửi lại, BE tự bỏ qua bản trùng)
const SYNC_WAIT_TIMEOUT_MS = 15000;

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;

  // Check for common chunk loading error patterns
  const errorMessage = error.message || '';
  return (
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Loading CSS chunk') ||
    error.name === 'ChunkLoadError'
  );
}

/**
 * Error boundary component that catches errors from lazy-loaded components
 * and displays a friendly error message with retry option.
 * Handles chunk loading failures when offline.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOffline: !navigator.onLine,
      reloading: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isOffline: !navigator.onLine,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Đang online mà chunk lỗi (vd: deploy bản mới đổi tên chunk) -> tải lại trang luôn
    if (navigator.onLine && isChunkLoadError(error)) {
      this.reloadForChunkError();
    }
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    if (!this.state.hasError) return;
    // Auto-retry when coming back online if there was an error
    if (isChunkLoadError(this.state.error)) {
      this.reloadForChunkError();
    } else {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  handleRetry = () => {
    // React.lazy nhớ luôn import đã lỗi -> render lại vẫn ném lỗi cũ, chỉ tải lại trang mới tải lại được chunk
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  /** Tải lại trang để tải lại chunk. Trả về false nếu vừa reload mà vẫn lỗi (để hiện UI lỗi thay vì reload lặp) */
  reloadForChunkError(): boolean {
    try {
      const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
      if (Date.now() - last < CHUNK_RELOAD_GUARD_MS) return false;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    } catch {
      return false;
    }
    this.setState({ reloading: true });
    // Có mạng lại thì syncManager gửi ngay các phiếu tạo offline -> chờ xong mới reload để không cắt ngang request
    Promise.race([
      syncManager.waitForIdle(),
      new Promise(resolve => setTimeout(resolve, SYNC_WAIT_TIMEOUT_MS)),
    ]).finally(() => window.location.reload());
    return true;
  }

  render() {
    const { hasError, error, isOffline, reloading } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const isChunkError = isChunkLoadError(error);

      // When offline and chunk loading fails, show a loading spinner
      // that will auto-reload when online
      if (isOffline && isChunkError) {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              padding: '40px',
              gap: '16px',
            }}
          >
            <Spin size="large" />
            <div style={{ color: '#666', textAlign: 'center' }}>
              Đang chờ kết nối mạng...
              <br />
              <small style={{ color: '#999' }}>
                Trang sẽ tự động tải khi có kết nối
              </small>
            </div>
          </div>
        );
      }

      if (isChunkError && reloading) {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              padding: '40px',
              gap: '16px',
            }}
          >
            <Spin size="large" />
            <div style={{ color: '#666' }}>Đang tải trang...</div>
          </div>
        );
      }

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px',
          }}
        >
          <Result
            status="error"
            title="Đã xảy ra lỗi"
            subTitle="Không thể tải trang. Vui lòng thử lại."
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                Thử lại
              </Button>,
              <Button key="reload" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>,
            ]}
          />
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
