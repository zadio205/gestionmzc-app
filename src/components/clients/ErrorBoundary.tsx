import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-medium">Une erreur s'est produite</h3>
          </div>
          <p className="text-sm text-red-600 mt-2">
            {this.state.error?.message || 'Erreur inconnue'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-3 text-sm bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;