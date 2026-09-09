import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, Sparkles } from 'lucide-react';
import { cleanStorageBloat } from '../../utils/storage.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Zapate Service Manager Error Boundary]', error, errorInfo);
    this.setState({ errorInfo });

    // Automatically recover if error is caused by storage quota exhaustion
    if (error && String(error).toLowerCase().includes('quota')) {
      try {
        cleanStorageBloat();
      } catch (e) {
        console.warn('[ErrorBoundary] Storage bloat cleanup failed:', e);
      }
    }
  }

  handleReload = () => {
    try {
      cleanStorageBloat();
    } catch {}
    window.location.reload();
  };

  handleGoDashboard = () => {
    try {
      cleanStorageBloat();
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  handleRecoverStorage = () => {
    try {
      cleanStorageBloat();
      localStorage.removeItem('rf_auth_user');
      localStorage.removeItem('rf_current_shop');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.inLayout) {
        return (
          <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
            <div
              className="card"
              style={{
                maxWidth: '520px',
                width: '100%',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
                color: '#f8fafc',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
                Something went wrong
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
                The page could not be loaded. You can try reloading or return to your workshop dashboard.
              </p>

              {this.state.error && (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#f87171',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    marginBottom: '20px',
                    overflowX: 'auto',
                    maxHeight: '120px',
                  }}
                >
                  {this.state.error.toString()}
                </div>
              )}

              {this.state.error && String(this.state.error).toLowerCase().includes('quota') && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={this.handleRecoverStorage}
                    className="btn btn-sm"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={15} /> Recover Quota & Launch Dashboard
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#334155', color: '#ffffff', borderColor: '#475569' }}
                >
                  <RefreshCw size={15} /> Try Again
                </button>

                <button
                  type="button"
                  onClick={this.handleGoDashboard}
                  className="btn btn-primary btn-sm"
                >
                  <LayoutDashboard size={15} /> Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              width: '100%',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
              The page encountered an unexpected issue while rendering. You can reload the page or return to your workshop dashboard.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#f87171',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  maxHeight: '120px',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            {this.state.error && String(this.state.error).toLowerCase().includes('quota') && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={this.handleRecoverStorage}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Sparkles size={16} /> Recover Storage Quota & Launch Dashboard
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#334155',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: '1px solid #475569',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                <LayoutDashboard size={15} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
