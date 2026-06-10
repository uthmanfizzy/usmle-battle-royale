import React from 'react';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`[${this.props.name || 'Route'}] crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
          padding: '40px', textAlign: 'center', fontFamily: 'Cinzel, serif'
        }}>
          <h2 style={{ color: 'rgba(220,190,80,0.9)', margin: 0 }}>Something went wrong</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
            This page hit an error. Your account and progress are safe.
          </p>
          <pre style={{ color: 'rgba(220,100,100,0.7)', fontSize: '11px', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '10px 24px', background: 'rgba(40,50,20,0.8)', border: '1px solid rgba(180,140,40,0.5)', borderRadius: '8px', color: 'rgba(220,190,80,0.9)', cursor: 'pointer', fontFamily: 'Cinzel, serif' }}
            >Try Again</button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'Cinzel, serif' }}
            >Go Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
