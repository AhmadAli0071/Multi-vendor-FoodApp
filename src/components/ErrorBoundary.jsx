import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh flex flex-col items-center justify-center bg-white px-6">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Something went wrong</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Please refresh the page to try again</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
