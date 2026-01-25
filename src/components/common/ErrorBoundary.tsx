import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
  retryCount: number;
}

/**
 * Error boundary component that catches errors from lazy-loaded components
 * and displays a friendly error message with retry option.
 * Handles chunk loading failures when offline.
 */
class ErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOffline: !navigator.onLine,
      retryCount: 0,
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
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleOnline = () => {
    this.setState({ isOffline: false, retryCount: 0 });
    // Auto-retry when coming back online if there was an error
    if (this.state.hasError) {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  isChunkLoadError(): boolean {
    const { error } = this.state;
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

  render() {
    const { hasError, isOffline, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const isChunkError = this.isChunkLoadError();

      // When offline and chunk loading fails, show a loading spinner
      // that will auto-retry when online
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

      // For online errors or non-chunk errors, show retry UI
      // But limit retries to prevent infinite loops
      if (isChunkError && retryCount < 3) {
        // Auto-retry for chunk errors when online
        if (!this.retryTimer) {
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.handleRetry();
          }, 1000);
        }
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
