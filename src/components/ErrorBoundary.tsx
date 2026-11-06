import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{ 
            minHeight: '100vh', 
            background: 'var(--white)', 
            color: 'var(--black)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem' 
          }}
          role="alert"
          aria-live="assertive"
        >
          <div 
            style={{ 
              maxWidth: '48rem', 
              width: '100%', 
              border: '2px solid var(--black)', 
              padding: '2.5rem',
              background: 'var(--white)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '18px', height: '18px', background: 'var(--red)' }} />
              <span className="eyebrow" style={{ margin: 0 }}>
                SYSTEM FAULT EXCEPTION // STATUS 500
              </span>
            </div>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              Execution Interrupted.
            </h1>

            <p className="lead" style={{ marginBottom: '2rem' }}>
              An unhandled rendering condition violated platform stability standards. The system execution state has been safely isolated.
            </p>

            {this.state.error && (
              <div 
                style={{ 
                  background: 'var(--gray)', 
                  border: '1px solid var(--rule)', 
                  borderLeft: '4px solid var(--red)',
                  padding: '1rem', 
                  marginBottom: '2rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: '0.5rem' }}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <details style={{ marginTop: '0.5rem', cursor: 'pointer' }}>
                    <summary style={{ color: 'var(--text-muted)' }}>Component Stack Trace</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--black)' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="button"
                onClick={this.handleReload}
              >
                RELOAD APPLICATION
              </button>
              <button
                type="button"
                className="button button--outline"
                onClick={this.handleReset}
              >
                DISMISS & ATTEMPT RECOVERY
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
