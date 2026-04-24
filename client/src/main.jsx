import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './components/AdminApp';
import './App.css';

const path = window.location.pathname;
const isAdmin = path.startsWith('/admin');

// /auth/callback is served as a SPA route — App.jsx handles the ?token= param
// Normalise the path to / so the browser URL is clean after login
if (path === '/auth/callback') {
  const params = new URLSearchParams(window.location.search);
  if (params.has('token') || params.has('error')) {
    // keep the params — App.jsx reads them — but fix the path to /
    const newSearch = window.location.search;
    window.history.replaceState({}, '', '/' + newSearch);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>
);
