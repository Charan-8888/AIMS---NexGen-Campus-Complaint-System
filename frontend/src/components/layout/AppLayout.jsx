import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { notificationsApi } from '../../api/complaints';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnread = async () => {
      try {
        const { data } = await notificationsApi.getUnreadCount();
        setUnreadCount(data.data.count);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none' }}
            id="sidebar-toggle"
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Notifications badge */}
          <a
            href="/notifications"
            style={{ position: 'relative', padding: '0.5rem', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', color: 'white',
                fontSize: '0.625rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surface-0)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </a>

          {/* User avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', color: 'white',
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          <div className="page-container animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
