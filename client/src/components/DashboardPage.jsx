import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { getToken, clearToken, fetchMe, getCachedUser, setCachedUser } from '../auth';

export default function DashboardPage() {
  const [user, setUser] = useState(getCachedUser);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchMe().then(me => {
      if (me) {
        setUser(me);
      } else {
        clearToken();
        window.location.href = '/';
      }
    });
  }, []);

  function handlePlayNow() {
    window.location.href = '/?play=1';
  }

  function handleLogout() {
    clearToken();
    window.location.href = '/';
  }

  function handleUserUpdate(updatedUser) {
    setUser(updatedUser);
    setCachedUser(updatedUser);
  }

  if (!user) {
    return (
      <div className="screen entry-screen">
        <div className="spinner" style={{ width: 52, height: 52 }} />
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      onPlayNow={handlePlayNow}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  );
}
