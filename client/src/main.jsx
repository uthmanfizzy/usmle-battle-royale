import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme';
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/admin/*"        element={<AdminApp />} />
            <Route path="/auth/callback"  element={<AuthCallback />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/stats"          element={<StatsPage />} />
            <Route path="/username-setup" element={<UsernameSetupPage />} />
            <Route path="/*"              element={<App />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
