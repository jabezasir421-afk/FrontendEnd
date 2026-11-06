import React, { useEffect, useState } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNotificationRead }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    await fetchNotifs();
    onNotificationRead();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    await fetchNotifs();
    onNotificationRead();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className="modal-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="notification-drawer-title"
      onClick={onClose}
    >
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '30rem', maxHeight: '85vh', marginLeft: 'auto', marginRight: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>TELEMETRY DISPATCH // INBOX</span>
            <h3 id="notification-drawer-title" style={{ marginTop: '0.2rem' }}>
              Notifications ({unreadCount} Unread)
            </h3>
          </div>
          <button
            type="button"
            className="button button--sm button--outline"
            onClick={onClose}
          >
            DISMISS
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {unreadCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                type="button"
                className="button button--sm button--outline"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={handleMarkAllRead}
              >
                MARK ALL AS AUDITED
              </button>
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Retrieving system dispatch alerts...</p>
          ) : notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No dispatch notifications.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid var(--rule)',
                    borderLeft: n.read ? '1px solid var(--rule)' : '4px solid var(--red)',
                    background: n.read ? 'var(--white)' : 'var(--gray)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</span>
                    <span className="mono-num" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                    {n.message}
                  </p>
                  {!n.read && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={() => handleMarkRead(n.id)}
                    >
                      ✓ MARK AS READ
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
