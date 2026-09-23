import { useState, useEffect } from 'react';
import { Bell, Check, Loader2, FileWarning } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      api.patch(`/notifications/${notif._id}/read`).catch(() => {});
    }
    if (notif.entityType === 'Complaint' && notif.entityId) {
      navigate(`/complaints/${notif.entityId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={44} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No notifications yet</p>
            <p style={{ fontSize: '0.875rem' }}>We'll let you know when there are updates.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif, index) => (
              <div 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: 'flex', gap: '1rem', padding: '1.25rem 1.5rem',
                  borderBottom: index < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  background: notif.isRead ? 'transparent' : 'var(--surface-1)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="hover-highlight"
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: notif.isRead ? 'var(--surface-2)' : '#6366f122',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileWarning size={20} color={notif.isRead ? 'var(--text-muted)' : '#6366f1'} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                      {format(new Date(notif.createdAt), 'dd MMM, h:mm a')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: notif.isRead ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <div style={{ alignSelf: 'center' }}>
                    <button 
                      onClick={(e) => markAsRead(notif._id, e)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6366f1', padding: '0.5rem', borderRadius: '50%'
                      }}
                      title="Mark as read"
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
