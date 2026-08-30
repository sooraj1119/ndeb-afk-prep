import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', textAlign: 'center', height: '100vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-main)', color: 'var(--text-primary)'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: '24px', maxWidth: '500px' }}>
            <AlertTriangle size={64} color="var(--error-color)" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
              The application encountered an unexpected error. We've been notified and are working on it.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'var(--surface-color)', padding: '1rem', borderRadius: '12px',
                fontSize: '0.8rem', overflowX: 'auto', textAlign: 'left', marginBottom: '2rem',
                border: '1px solid var(--border-color)', color: 'var(--error-color)'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="primary-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={18} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
