import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, FileWarning,
  Users, Loader2, ArrowRight, Activity,
} from 'lucide-react';
import { analyticsApi } from '../../api/complaints';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const CATEGORY_COLORS = [
  '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#a855f7',
  '#f97316', '#14b8a6', '#64748b',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// KPI Card component
const KpiCard = ({ label, value, subValue, icon: Icon, color, to }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value ?? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 32 }} />}
        </p>
        {subValue && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            {subValue}
          </p>
        )}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    {to && (
      <Link to={to} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        marginTop: '1rem', fontSize: '0.8125rem', color, textDecoration: 'none', fontWeight: 500,
      }}>
        View all <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const AdminDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [trend, setTrend] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [staffWorkload, setStaffWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [kpiRes, catRes, bldRes, trendRes, priRes, staffRes] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getCategories(),
          analyticsApi.getBuildings(),
          analyticsApi.getMonthlyTrend(new Date().getFullYear()),
          analyticsApi.getPriorityDistribution(),
          analyticsApi.getStaffWorkload(),
        ]);

        setKpis(kpiRes.data.data);
        setCategories(catRes.data.data);
        setBuildings(bldRes.data.data);

        // Fill in months with 0 for missing months
        const trendData = Array.from({ length: 12 }, (_, i) => {
          const found = trendRes.data.data.find((d) => d.month === i + 1);
          return found || { month: i + 1, total: 0, resolved: 0, critical: 0 };
        });
        setTrend(trendData);

        setPriorities(priRes.data.data);
        setStaffWorkload(staffRes.data.data.slice(0, 8));
      } catch (err) {
        toast.error('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">NexGen University — Campus Maintenance Overview</p>
        </div>
        <Link to="/admin/complaints" className="btn btn-primary">
          <Activity size={16} />
          View All Complaints
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KpiCard label="Total Complaints" value={kpis?.total} icon={FileWarning} color="#6366f1" to="/admin/complaints" />
        <KpiCard label="Open" value={kpis?.open} subValue="Pending or Assigned" icon={Clock} color="#f59e0b" />
        <KpiCard label="In Progress" value={kpis?.inProgress} icon={Activity} color="#3b82f6" />
        <KpiCard label="Resolved" value={kpis?.resolved} icon={CheckCircle2} color="#10b981" />
        <KpiCard label="Critical" value={kpis?.critical} subValue="Needs immediate attention" icon={AlertTriangle} color="#ef4444" />
        <KpiCard
          label="Avg Resolution"
          value={kpis?.avgResolutionHours != null ? `${kpis.avgResolutionHours}h` : 'N/A'}
          icon={TrendingUp}
          color="#8b5cf6"
        />
        <KpiCard
          label="SLA Compliance"
          value={kpis?.slaCompliance != null ? `${kpis.slaCompliance}%` : 'N/A'}
          icon={CheckCircle2}
          color="#06b6d4"
        />
        <KpiCard label="SLA Breached" value={kpis?.slaBreached} icon={AlertTriangle} color="#dc2626" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Monthly Trend */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Monthly Complaint Trend — {new Date().getFullYear()}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend.map((d) => ({ ...d, month: MONTHS[d.month - 1] }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Total" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Critical" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints by Category */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Complaints by Category
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={100} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Complaints">
                {categories.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={priorities}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={3}
                label={({ priority, count }) => `${priority}: ${count}`}
                labelLine={false}
              >
                {priorities.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Complaints by Building */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Complaints by Building
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buildings}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="building" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Workload */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Staff Workload
          </h3>
          {staffWorkload.length === 0 ? (
            <div className="empty-state">No staff data available</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {staffWorkload.map((s) => (
                <div key={s.staffId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#6366f122',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', color: '#6366f1', flexShrink: 0,
                  }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                        {s.activeTaskCount} active
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: '0.25rem' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 2,
                        background: s.activeTaskCount > 5 ? '#ef4444' : s.activeTaskCount > 3 ? '#f59e0b' : '#10b981',
                        width: `${Math.min(100, (s.activeTaskCount / 10) * 100)}%`,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
