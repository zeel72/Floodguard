import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FloodGuard System Fault]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#070d18',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-sans, sans-serif)'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '520px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', marginBottom: '16px' }}>
              <AlertOctagon size={40} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 10px 0' }}>FloodGuard Resiliency Shield</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              An isolated subsystem encounter was caught by the operational boundary. Telemetry failover is active.
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '10px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#f87171',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '20px'
            }}>
              {this.state.error?.message || 'Unknown runtime fault'}
            </div>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#38bdf8',
                color: '#070d18',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RotateCw size={16} />
              Re-initialize Command Center
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
