import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './components/AdminApp';
import AuthCallback from './components/AuthCallback';
import './App.css';

const path = window.location.pathname;

let Root;
if (path.startsWith('/admin')) {
  Root = <AdminApp />;
} else if (path === '/auth/callback') {
  Root = <AuthCallback />;
} else {
  Root = <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{Root}</React.StrictMode>
);
