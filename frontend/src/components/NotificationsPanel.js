import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPanel = () => {
  const navigate = useNavigate();
  const {
    getAllNotifications,
    getUnreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useAuth();

  const [showPanel, setShowPanel] = useState(false);

  const unreadNotifications = getUnreadNotifications();
  const allNotifications = getAllNotifications();

  const handleNotificationClick = async notification => {
    await markNotificationRead(notification.id);
    if (
      notification.related_type === 'submission' ||
      notification.related_type === 'document'
    ) {
      navigate('/admin/submissions');
    }
    setShowPanel(false);
  };

  const getNotificationIcon = type => {
    const configs = {
      success: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', path: 'M5 13l4 4L19 7' },
      error: {
        bg: 'rgba(239,68,68,0.15)',
        color: '#ef4444',
        path: 'M6 18L18 6M6 6l12 12',
      },
      warning: {
        bg: 'rgba(234,179,8,0.15)',
        color: '#eab308',
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      },
      submission: {
        bg: 'rgba(59,130,246,0.15)',
        color: '#3b82f6',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
    };
    const cfg = configs[type] || {
      bg: 'rgba(148,163,184,0.15)',
      color: '#94a3b8',
      path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return (
      <div
        style={{
          background: cfg.bg,
          borderRadius: '50%',
          padding: '8px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke={cfg.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d={cfg.path} />
        </svg>
      </div>
    );
  };

  const formatTimeAgo = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const m = Math.floor(diffInSeconds / 60);
      return `${m} minute${m > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const h = Math.floor(diffInSeconds / 3600);
      return `${h} hour${h > 1 ? 's' : ''} ago`;
    }
    const d = Math.floor(diffInSeconds / 86400);
    return `${d} day${d > 1 ? 's' : ''} ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .np-bell-btn {
          position: relative;
          padding: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          color: var(--theme-text, #e8edf4);
          transition: background 0.15s;
        }
        .np-bell-btn:hover {
          background: var(--theme-bg-secondary, rgba(255,255,255,0.08));
        }
        .np-panel {
          position: fixed;
          right: 16px;
          top: 64px;
          width: 384px;
          background: var(--theme-bg, #1a202c);
          border: 1px solid var(--theme-border, rgba(255,255,255,0.1));
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          z-index: 9999;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .np-header {
          padding: 16px;
          border-bottom: 1px solid var(--theme-border, rgba(255,255,255,0.1));
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--theme-bg-secondary, rgba(255,255,255,0.04));
        }
        .np-header-title {
          font-weight: 600;
          font-size: 15px;
          color: var(--theme-text, #e8edf4);
          margin: 0;
        }
        .np-header-count {
          font-size: 12px;
          color: var(--theme-text-muted, rgba(168,204,232,0.55));
          margin: 2px 0 0;
        }
        .np-mark-all {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--theme-accent, #63b3ed);
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .np-mark-all:hover {
          background: var(--theme-bg-secondary, rgba(255,255,255,0.08));
        }
        .np-list {
          flex: 1;
          overflow-y: auto;
        }
        .np-list::-webkit-scrollbar { width: 4px; }
        .np-list::-webkit-scrollbar-track { background: transparent; }
        .np-list::-webkit-scrollbar-thumb { background: var(--theme-border, rgba(255,255,255,0.1)); border-radius: 2px; }
        .np-empty {
          padding: 40px 16px;
          text-align: center;
          color: var(--theme-text-muted, rgba(168,204,232,0.4));
        }
        .np-item {
          padding: 14px 16px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--theme-border, rgba(255,255,255,0.06));
          transition: background 0.15s;
          align-items: flex-start;
        }
        .np-item:hover {
          background: var(--theme-bg-secondary, rgba(255,255,255,0.04));
        }
        .np-item.unread {
          background: rgba(59,130,246,0.06);
        }
        .np-item.unread:hover {
          background: rgba(59,130,246,0.1);
        }
        .np-item-body { flex: 1; min-width: 0; }
        .np-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .np-item-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--theme-text, #e8edf4);
          margin: 0;
          line-height: 1.4;
        }
        .np-item-title.read {
          color: var(--theme-text-muted, rgba(168,204,232,0.7));
          font-weight: 400;
        }
        .np-item-time {
          font-size: 11px;
          color: var(--theme-text-muted, rgba(168,204,232,0.4));
          white-space: nowrap;
          flex-shrink: 0;
        }
        .np-item-msg {
          font-size: 12px;
          color: var(--theme-text-muted, rgba(168,204,232,0.6));
          margin: 4px 0 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .np-delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          color: var(--theme-text-muted, rgba(168,204,232,0.3));
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .np-delete-btn:hover {
          color: var(--theme-text, #e8edf4);
        }
        .np-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--theme-border, rgba(255,255,255,0.1));
          background: var(--theme-bg-secondary, rgba(255,255,255,0.04));
        }
        .np-view-all {
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--theme-accent, #63b3ed);
          text-align: center;
          padding: 4px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .np-view-all:hover {
          background: var(--theme-bg-secondary, rgba(255,255,255,0.08));
        }
      `}</style>

      {/* Bell Button */}
      <button className="np-bell-btn" onClick={() => setShowPanel(!showPanel)}>
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadNotifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            minWidth: '18px',
            height: '18px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
          }}>
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setShowPanel(false)} />
          <div className="np-panel">
            {/* Header */}
            <div className="np-header">
              <div>
                <p className="np-header-title">Notifications</p>
                <p className="np-header-count">{unreadNotifications.length} unread</p>
              </div>
              {unreadNotifications.length > 0 && (
                <button className="np-mark-all" onClick={markAllNotificationsRead}>
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="np-list">
              {allNotifications.length === 0 ? (
                <div className="np-empty">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
                </div>
              ) : (
                allNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`np-item${!notification.is_read ? ' unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="np-item-body">
                      <div className="np-item-header">
                        <p className={`np-item-title${notification.is_read ? ' read' : ''}`}>
                          {notification.title}
                        </p>
                        <span className="np-item-time">{formatTimeAgo(notification.created_at)}</span>
                      </div>
                      <p className="np-item-msg">{notification.message}</p>
                    </div>
                    <button
                      className="np-delete-btn"
                      onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 0 && (
              <div className="np-footer">
                <button
                  className="np-view-all"
                  onClick={() => { navigate('/admin/notifications'); setShowPanel(false); }}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPanel;
