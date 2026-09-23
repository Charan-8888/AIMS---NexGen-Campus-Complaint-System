import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Filter, X, ClipboardList, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { complaintsApi } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'VERIFIED'];

const StaffTasksPage = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({ status: '', priority: '', sortBy: 'priority.score', sortOrder: 'desc' });
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { assignedTo: user._id, page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const { data } = await complaintsApi.getAll(params);
      setTasks(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, filters, user._id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', sortBy: 'priority.score', sortOrder: 'desc' });
    setPage(1);
  };

  const hasActiveFilters = filters.status || filters.priority;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">You have {pagination.total} assigned task{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchTasks}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
            {hasActiveFilters && <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input" value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
                <option value="">All priorities</option>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select className="input" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                setFilters((f) => ({ ...f, sortBy, sortOrder }));
              }}>
                <option value="priority.score:desc">Highest priority</option>
                <option value="sla.deadline:asc">SLA deadline</option>
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
                <X size={14} /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={44} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No tasks found</p>
            {hasActiveFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <>
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
                    <th>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const slaBreached = t.sla?.breached;
                    const slaNear = !slaBreached && t.sla?.deadline && new Date(t.sla.deadline) < new Date(Date.now() + 2 * 60 * 60 * 1000);
                    return (
                      <tr key={t._id} style={{ cursor: 'pointer' }}>
                        <td>
                          <Link to={`/complaints/${t._id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700, fontSize: '0.8125rem' }}>
                            {t.complaintNumber}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <Link to={`/complaints/${t._id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {t.location?.building ? `${t.location.building}, ${t.location.room || ''}` : '—'}
                        </td>
                        <td><StatusBadge type="priority" value={t.priority?.level} /></td>
                        <td><StatusBadge type="status" value={t.status} /></td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {t.assignedTo?.assignedAt ? format(new Date(t.assignedTo.assignedAt), 'dd MMM yyyy, HH:mm') : format(new Date(t.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td>
                          {t.sla?.deadline ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: slaBreached ? '#ef4444' : slaNear ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {slaBreached ? '⚠ Breached' : slaNear ? '⏰ Near' : '✓ OK'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeft size={14} /></button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: 80, textAlign: 'center' }}>Page {page} of {pagination.totalPages}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffTasksPage;
