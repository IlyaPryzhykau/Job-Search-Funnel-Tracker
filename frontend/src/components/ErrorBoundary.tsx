import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            maxWidth: 720,
            margin: "48px auto",
            background: "#ffffff",
            borderRadius: 16,
            padding: 24,
            fontFamily: "Space Grotesk, sans-serif",
            color: "#3e434b",
            boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginBottom: 12 }}>UI error</h2>
          <p style={{ marginBottom: 8 }}>
            The app crashed during render. Open DevTools ? Console for details.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#6b717c" }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
