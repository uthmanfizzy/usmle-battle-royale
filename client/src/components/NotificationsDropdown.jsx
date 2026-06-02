import { useState, useEffect } from 'react';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function NotificationsDropdown({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/notifications/${user?.id}`);
      const data = await res.json();
      setNotifications(data || []);
    } catch(e) {
      // Show placeholder notifications if endpoint doesn't exist yet
      setNotifications([]);
    }
    setLoading(false);
  };

  const markAllRead = async () => {
    try {
      await fetch(`${SERVER_URL}/api/notifications/${user?.id}/read-all`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch(e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="dropdown-panel">
      <div className="dropdown-panel-header">
        <h3 className="dropdown-panel-title">
          🔔 Notifications
          {unreadCount > 0 && <span className="dropdown-badge">{unreadCount}</span>}
        </h3>
        <div className="dropdown-header-actions">
          {unreadCount > 0 && (
            <button className="dropdown-text-btn" onClick={markAllRead}>Mark all read</button>
          )}
          <button className="dropdown-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="dropdown-panel-content">
        {loading ? (
          <div className="dropdown-loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="dropdown-empty">
            <span>🔕</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div className={`notif-item ${!notif.read ? 'notif-item--unread' : ''}`} key={notif.id}>
              <span className="notif-icon">{notif.icon || '📢'}</span>
              <div className="notif-content">
                <p className="notif-text">{notif.message}</p>
                <span className="notif-time">{notif.time || 'Just now'}</span>
              </div>
              {!notif.read && <div className="notif-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
