// Placeholder pages — full implementation follows in later phases

import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

const ComingSoon = ({ title }) => (
  <div className="animate-fade-in">
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
    </div>
    <div className="card empty-state" style={{ minHeight: 300 }}>
      <Construction size={48} strokeWidth={1} color="var(--brand-500)" />
      <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Coming Soon</p>
      <p style={{ color: 'var(--text-muted)' }}>This page is being built as part of the next development phase.</p>
      <Link to="-1" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="btn btn-secondary btn-sm">
        ← Go Back
      </Link>
    </div>
  </div>
);

export const ComplaintsListPage = () => <ComingSoon title="My Complaints" />;
export const CreateComplaintPage = () => <ComingSoon title="Submit New Complaint" />;
export const ComplaintDetailPage = () => <ComingSoon title="Complaint Details" />;
export const NotificationsPage = () => <ComingSoon title="Notifications" />;
export const ProfilePage = () => <ComingSoon title="My Profile" />;
export const StaffDashboard = () => <ComingSoon title="Staff Dashboard" />;
export const StaffTasksPage = () => <ComingSoon title="My Tasks" />;
export const StaffTaskDetailPage = () => <ComingSoon title="Task Details" />;
export const ManagerDashboard = () => <ComingSoon title="Manager Dashboard" />;
export const ManagerComplaintsPage = () => <ComingSoon title="Department Complaints" />;
export const ManagerStaffPage = () => <ComingSoon title="Staff Management" />;
export const ManagerAnalyticsPage = () => <ComingSoon title="Department Analytics" />;
export const AdminComplaintsPage = () => <ComingSoon title="All Complaints" />;
export const AdminUsersPage = () => <ComingSoon title="User Management" />;
export const AdminDepartmentsPage = () => <ComingSoon title="Departments" />;
export const AdminCategoriesPage = () => <ComingSoon title="Categories" />;
export const AdminLocationsPage = () => <ComingSoon title="Campus Locations" />;
export const AdminAuditLogsPage = () => <ComingSoon title="Audit Logs" />;
export const AdminSettingsPage = () => <ComingSoon title="System Settings" />;
export const AdminAnalyticsPage = () => <ComingSoon title="Analytics" />;
