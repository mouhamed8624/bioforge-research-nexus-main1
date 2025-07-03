
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: String(error?.message || error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log error reports here
    // For debugging purposes
     
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
          <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
          <p className="mb-4 text-red-600 font-mono text-sm">
            {this.state.errorInfo || "An unexpected error has occurred. Please try refreshing the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded bg-primary text-white font-semibold shadow"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

