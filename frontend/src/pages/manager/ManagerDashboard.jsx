import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileWarning, CheckCircle2, Clock, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { analyticsApi, adminApi } from '../../api/complaints';
import toast from 'react-hot-toast';

const KpiCard = ({ label, value, icon: Icon, color, to }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value ?? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 32 }} />}
        </p>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    {to && (
      <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '1rem', fontSize: '0.8125rem', color, textDecoration: 'none', fontWeight: 500 }}>
        Manage <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const ManagerDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kpiRes, staffRes] = await Promise.all([
          analyticsApi.getDashboard(),
          adminApi.getStaff(), // The backend restricts this to the manager's department staff
        ]);
        setKpis(kpiRes.data.data);
        setStaffList(staffRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Department Overview & Staff Management</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Total Complaints" value={kpis?.total} icon={FileWarning} color="#6366f1" to="/manager/complaints" />
        <KpiCard label="Pending Assignment" value={kpis?.statusBreakdown?.PENDING || 0} icon={Clock} color="#f59e0b" to="/manager/complaints" />
        <KpiCard label="In Progress" value={kpis?.inProgress} icon={Activity} color="#3b82f6" />
        <KpiCard label="Resolved" value={kpis?.resolved} icon={CheckCircle2} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Staff Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Staff Workload</h3>
            <Link to="/manager/staff" className="btn btn-secondary btn-sm"><Users size={14} /> Manage Staff</Link>
          </div>
          {staffList.length === 0 ? (
            <div className="empty-state">No staff members found in your department.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {staffList.map((s) => (
                <div key={s.staffId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Rating: {s.averageRating > 0 ? `${s.averageRating} ★` : 'No ratings yet'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.activeTaskCount > 5 ? '#ef4444' : 'var(--text-primary)' }}>
                      {s.activeTaskCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Tasks</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Priority Breakdown */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>SLA & Priority Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Avg Resolution Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{kpis?.avgResolutionHours || 'N/A'} hrs</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SLA Compliance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: kpis?.slaCompliance < 90 ? '#ef4444' : '#10b981' }}>{kpis?.slaCompliance || 100}%</div>
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Critical Issues</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4 }}>
                  <div style={{ height: '100%', background: '#ef4444', borderRadius: 4, width: `${(kpis?.critical / (kpis?.total || 1)) * 100}%` }} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444' }}>{kpis?.critical || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
