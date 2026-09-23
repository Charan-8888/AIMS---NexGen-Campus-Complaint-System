import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, Activity, AlertTriangle, FileText } from 'lucide-react';
import { complaintsApi, analyticsApi } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await complaintsApi.getAll({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
        setComplaints(data.data);
      } catch {
        toast.error('Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats from complaints
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'PENDING').length,
    inProgress: complaints.filter((c) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(c.status)).length,
    resolved: complaints.filter((c) => ['RESOLVED', 'VERIFIED'].includes(c.status)).length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Track and manage your campus maintenance complaints</p>
        </div>
        <Link to="/complaints/create" className="btn btn-primary">
          <PlusCircle size={16} />
          New Complaint
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: '#6366f1' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
          { label: 'In Progress', value: stats.inProgress, icon: Activity, color: '#3b82f6' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--accent': s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</p>
              </div>
              <s.icon size={20} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Complaints */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Recent Complaints</h3>
          <Link to="/complaints" style={{ fontSize: '0.8125rem', color: '#6366f1', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No complaints yet</p>
            <Link to="/complaints/create" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
              Submit your first complaint
            </Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Complaint #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link to={`/complaints/${c._id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                        {c.complaintNumber}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </td>
                    <td>{c.category?.name || '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {c.location?.building ? `${c.location.building}, ${c.location.room || ''}` : '—'}
                    </td>
                    <td><StatusBadge type="priority" value={c.priority?.level} /></td>
                    <td><StatusBadge type="status" value={c.status} /></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {format(new Date(c.createdAt), 'dd MMM yyyy')}
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

export default UserDashboard;
