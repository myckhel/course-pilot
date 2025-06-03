import React, { Component, ErrorInfo, ReactNode } from "react";
import { Result, Button } from "antd";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full px-4">
            <Result
              status="error"
              title="Something went wrong"
              subTitle={
                this.state.error?.message || "An unexpected error occurred"
              }
              extra={[
                <Button type="primary" onClick={this.handleReset} key="retry">
                  Try Again
                </Button>,
                <Button onClick={() => (window.location.href = "/")} key="home">
                  Go Home
                </Button>,
              ]}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
