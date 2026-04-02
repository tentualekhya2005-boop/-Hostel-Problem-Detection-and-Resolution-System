import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(data);
    } catch (err) { console.error('Failed to fetch notifications'); }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUnreadCount(data.count);
    } catch (err) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setShowPanel(!showPanel);
    if (!showPanel) {
      await fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${notifId}`, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch (error) {
      alert('Failed to delete notification');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'complaint_assigned': return '👷';
      case 'complaint_resolved': return '🎉';
      case 'complaint_closed': return '✅';
      case 'complaint_rejected': return '❌';
      default: return '🔔';
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={handleBellClick}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-light)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border: '2px solid white',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '360px',
          maxHeight: '420px',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#fafafa',
          }}>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>({unreadCount} new)</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: n.read ? 'transparent' : '#f0f4ff',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.read ? '#f9fafb' : '#e8eeff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.read ? 'transparent' : '#f0f4ff'}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{getTypeIcon(n.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', opacity: 0.7 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteNotification(e, n._id)}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Notification
                      </button>
                    </div>
                    {!n.read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        flexShrink: 0,
                        marginTop: '0.35rem',
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
