import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, PlusCircle, Bell, User,
  LogOut, Settings, Users, Building2, Tag, MapPin,
  BarChart3, ClipboardCheck, FileText, ChevronLeft,
  Wrench, ShieldCheck, Sun, Moon, Menu, X,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useState, useEffect } from 'react';

// Role-specific nav items
const NAV_ITEMS = {
  USER: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/complaints', icon: ClipboardList, label: 'My Complaints' },
    { to: '/complaints/create', icon: PlusCircle, label: 'New Complaint' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  STAFF: [
    { to: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/staff/tasks', icon: ClipboardCheck, label: 'My Tasks' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  MANAGER: [
    { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manager/complaints', icon: ClipboardList, label: 'Complaints' },
    { to: '/manager/staff', icon: Users, label: 'Staff' },
    { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/complaints', icon: ClipboardList, label: 'All Complaints' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/admin/locations', icon: MapPin, label: 'Locations' },
    { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

const ROLE_ICONS = {
  USER: User,
  STAFF: Wrench,
  MANAGER: ClipboardList,
  ADMIN: ShieldCheck,
};

const ROLE_COLORS = {
  USER: '#6366f1',
  STAFF: '#f59e0b',
  MANAGER: '#3b82f6',
  ADMIN: '#10b981',
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.USER;
  const RoleIcon = ROLE_ICONS[user?.role] || User;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    setIsDark(html.classList.contains('dark'));
    localStorage.setItem('aims_theme', html.classList.contains('dark') ? 'dark' : 'light');
  };

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, color: 'var(--text-primary)' }}>
                AIMS-Campus
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                NexGen University
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm md:hidden" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* User Profile Summary */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: ROLE_COLORS[user?.role] || '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontWeight: 600, fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: '0.7rem', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <RoleIcon size={10} />
              {user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '0.75rem 0.75rem' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                marginBottom: '0.125rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.5rem',
        }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ flex: 1 }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ flex: 1, color: '#ef4444' }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
