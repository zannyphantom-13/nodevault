import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications';
import WelcomeEmailModal from './WelcomeEmailModal';
import './NotificationCenter.css';

export default function NotificationCenter() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const dropdownRef = useRef(null);

  const refreshNotifs = () => {
    if (user?.id) {
      const list = notificationService.getUserNotifications(user.id);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    notificationService.markAsRead(n.id);
    refreshNotifs();

    if (n.emailData) {
      setSelectedEmail(n.emailData);
      setOpen(false);
      return;
    }

    if (n.actionUrl) {
      setOpen(false);
      navigate(n.actionUrl);
    }
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (user?.id) {
      notificationService.markAllAsRead(user.id);
      refreshNotifs();
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="notif-wrapper" ref={dropdownRef}>
        <button
          type="button"
          className="notif-bell-btn"
          onClick={() => setOpen(!open)}
          aria-label="Notifications"
          title="Protocol Notifications"
        >
          <span>🔔</span>
          {unreadCount > 0 && <span className="notif-badge-pill">{unreadCount}</span>}
        </button>

        {open && (
          <div className="notif-dropdown">
            <div className="notif-dropdown-header">
              <div className="notif-dropdown-title">
                <span>Alerts & Messages</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.72rem', background: '#ef444430', color: '#fca5a5', padding: '1px 6px', borderRadius: 8 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button type="button" className="notif-mark-read" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  No notifications yet. You're all caught up!
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="notif-item-title">
                      <span>{n.title}</span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff' }} />}
                    </div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-footer">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.emailData ? (
                        <span className="notif-item-action">✉️ Open Email →</span>
                      ) : n.actionUrl ? (
                        <span className="notif-item-action">View Details →</span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <WelcomeEmailModal
        isOpen={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        emailData={selectedEmail}
      />
    </>
  );
}
