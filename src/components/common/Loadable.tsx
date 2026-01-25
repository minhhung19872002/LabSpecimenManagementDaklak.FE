import { Suspense, ComponentType } from "react";
import ErrorBoundary from "./ErrorBoundary";

// Loading fallback component using custom SVG spinner
const LoadingFallback = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(255,255,255,0.4)",
      zIndex: 1000,
    }}
  >
    <img
      src="/spinner.svg"
      alt="Loading..."
      style={{
        width: 120,
        height: 60,
      }}
    />
  </div>
);

// Loadable HOC for lazy loading pages with error boundary for offline support
const Loadable = <P extends object>(Component: ComponentType<P>) => {
  const LoadableComponent = (props: P) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  return LoadableComponent;
};

export default Loadable;
