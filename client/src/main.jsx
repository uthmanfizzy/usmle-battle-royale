import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme';
import { GameSettingsProvider } from './contexts/GameSettingsContext';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import './App.css';
import './themes.css';

const AdminApp          = lazy(() => import('./components/AdminApp'));
const AuthCallback      = lazy(() => import('./components/AuthCallback'));
const DashboardPage     = lazy(() => import('./components/DashboardPage'));
const StatsPage         = lazy(() => import('./components/StatsPage'));
const UsernameSetupPage = lazy(() => import('./components/UsernameSetupPage'));

function PageSpinner() {
  return (
    <div className="screen entry-screen">
      <div className="spinner" style={{ width: 52, height: 52 }} />
    </div>
  );
}

// Global Error Boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('🔴 GLOBAL ERROR BOUNDARY:', {
      error: error,
      errorInfo: info,
      stack: error?.stack,
      componentStack: info?.componentStack
    });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f08',
          color: 'white',
          padding: '20px'
        }}>
          <h1 style={{color:'#dcbe50', marginBottom: '20px'}}>App Error</h1>
          <pre style={{
            color: '#dc6464',
            fontSize: '14px',
            maxWidth: '800px',
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#dcbe50',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0f08',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <GameSettingsProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/admin/*"        element={<AdminApp />} />
                <Route path="/auth/callback"  element={<AuthCallback />} />
                <Route path="/dashboard"      element={<DashboardPage />} />
                <Route path="/stats"          element={<RouteErrorBoundary name="StatsPage"><StatsPage /></RouteErrorBoundary>} />
                <Route path="/username-setup" element={<UsernameSetupPage />} />
                <Route path="/*"              element={<App />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </GameSettingsProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
