import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { complaintsApi } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Fetch tasks assigned to this staff member
        const { data } = await complaintsApi.getAll({ assignedTo: user._id, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
        setTasks(data.data || []);
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user._id]);

  const stats = {
    total: tasks.length,
    new: tasks.filter(t => t.status === 'ASSIGNED').length,
    inProgress: tasks.filter(t => ['ACCEPTED', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status)).length,
    completed: tasks.filter(t => ['RESOLVED', 'VERIFIED'].includes(t.status)).length,
    urgent: tasks.filter(t => ['HIGH', 'CRITICAL'].includes(t.priority?.level) && !['RESOLVED', 'VERIFIED', 'CANCELLED'].includes(t.status)).length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}. Here is your task overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'New Tasks', value: stats.new, icon: ClipboardCheck, color: '#3b82f6' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: '#f59e0b' },
          { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--accent': s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{s.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Current Tasks</h3>
          <Link to="/staff/tasks" style={{ fontSize: '0.8125rem', color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardCheck size={40} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No tasks assigned</p>
            <p style={{ fontSize: '0.875rem' }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Task #</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link to={`/complaints/${t._id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                        {t.complaintNumber}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {t.location?.building ? `${t.location.building}, ${t.location.room || ''}` : '—'}
                    </td>
                    <td><StatusBadge type="priority" value={t.priority?.level} /></td>
                    <td><StatusBadge type="status" value={t.status} /></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {t.assignedTo?.assignedAt ? format(new Date(t.assignedTo.assignedAt), 'dd MMM yyyy, HH:mm') : format(new Date(t.createdAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
