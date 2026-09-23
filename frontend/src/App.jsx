import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Layout
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Complaints pages
import ComplaintsListPage from './pages/user/ComplaintsListPage';
import CreateComplaintPage from './pages/user/CreateComplaintPage';
import ComplaintDetailPage from './pages/user/ComplaintDetailPage';

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffTasksPage from './pages/staff/StaffTasksPage';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerStaffPage from './pages/manager/ManagerStaffPage';

// User pages
import NotificationsPage from './pages/user/NotificationsPage';
import ProfilePage from './pages/user/ProfilePage';

// Placeholders (fully implemented pages follow in subsequent phases)
import {
  ManagerAnalyticsPage,
  AdminDepartmentsPage, AdminCategoriesPage,
  AdminLocationsPage, AdminAuditLogsPage, AdminSettingsPage, AdminAnalyticsPage,
} from './pages/placeholders';
import AdminUsersPage from './pages/admin/AdminUsersPage';

// Auth store for smart redirect
import useAuthStore from './store/authStore';

const ROLE_HOME = {
  USER: '/dashboard',
  STAFF: '/staff/dashboard',
  MANAGER: '/manager/dashboard',
  ADMIN: '/admin/dashboard',
};

function SmartRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/dashboard'} replace />;
}

function App() {
  // Apply saved theme on load
  useEffect(() => {
    const saved = localStorage.getItem('aims_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Router>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-0)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Smart root redirect */}
        <Route path="/" element={<SmartRedirect />} />

        {/* Protected routes — all under AppLayout */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* User routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/complaints" element={<ProtectedRoute roles={['USER']}><ComplaintsListPage /></ProtectedRoute>} />
          <Route path="/complaints/create" element={<ProtectedRoute roles={['USER', 'STAFF', 'MANAGER', 'ADMIN']}><CreateComplaintPage /></ProtectedRoute>} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Staff routes */}
          <Route path="/staff/dashboard" element={<ProtectedRoute roles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/tasks" element={<ProtectedRoute roles={['STAFF']}><StaffTasksPage /></ProtectedRoute>} />
          <Route path="/staff/tasks/:id" element={<ProtectedRoute roles={['STAFF']}><ComplaintDetailPage /></ProtectedRoute>} />

          {/* Manager routes */}
          <Route path="/manager/dashboard" element={<ProtectedRoute roles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/complaints" element={<ProtectedRoute roles={['MANAGER', 'ADMIN']}><ComplaintsListPage /></ProtectedRoute>} />
          <Route path="/manager/staff" element={<ProtectedRoute roles={['MANAGER', 'ADMIN']}><ManagerStaffPage /></ProtectedRoute>} />
          <Route path="/manager/analytics" element={<ProtectedRoute roles={['MANAGER', 'ADMIN']}><ManagerAnalyticsPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ComplaintsListPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><AdminAnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute roles={['ADMIN']}><AdminDepartmentsPage /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/locations" element={<ProtectedRoute roles={['ADMIN']}><AdminLocationsPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditLogsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['ADMIN']}><AdminSettingsPage /></ProtectedRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
