import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, X, Download, RefreshCw,
  ChevronLeft, ChevronRight, ClipboardList,
} from 'lucide-react';
import { complaintsApi } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'VERIFIED', 'REOPENED', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ComplaintsListPage = () => {
  const { user } = useAuthStore();
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', priority: '', building: '',
    startDate: '', endDate: '', sortBy: 'createdAt', sortOrder: 'desc',
  });
  const [page, setPage] = useState(1);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit, ...filters };
      // Remove empty params
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

      const { data } = await complaintsApi.getAll(params);
      setComplaints(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', building: '', startDate: '', endDate: '', sortBy: 'createdAt', sortOrder: 'desc' });
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.building || filters.startDate;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdminOrManager ? 'All Complaints' : 'My Complaints'}
          </h1>
          <p className="page-subtitle">
            {pagination.total} complaint{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchComplaints}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span style={{
                width: 18, height: 18, borderRadius: '50%', background: '#ef4444',
                color: 'white', fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>!</span>
            )}
          </button>
          {(user?.role === 'USER' || isAdminOrManager) && (
            <Link to="/complaints/create" className="btn btn-primary btn-sm">
              + New Complaint
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input"
          placeholder="Search complaints by title or description..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
        {filters.search && (
          <button
            onClick={() => handleFilterChange('search', '')}
            style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter panel */}
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
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Building</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Block A"
                value={filters.building}
                onChange={(e) => handleFilterChange('building', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input type="date" className="input" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input type="date" className="input" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select className="input" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                setFilters((f) => ({ ...f, sortBy, sortOrder }));
              }}>
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="priority.score:desc">Highest priority</option>
                <option value="sla.deadline:asc">SLA deadline</option>
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

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={44} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>
              {hasActiveFilters ? 'No complaints match your filters' : 'No complaints found'}
            </p>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
            )}
            {!hasActiveFilters && user?.role === 'USER' && (
              <Link to="/complaints/create" className="btn btn-primary btn-sm">Submit your first complaint</Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    {isAdminOrManager && <th>Reporter</th>}
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    {isAdminOrManager && <th>Assigned To</th>}
                    <th>Submitted</th>
                    {isAdminOrManager && <th>SLA</th>}
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => {
                    const slaBreached = c.sla?.breached;
                    const slaNear = !slaBreached && c.sla?.deadline && new Date(c.sla.deadline) < new Date(Date.now() + 2 * 60 * 60 * 1000);
                    return (
                      <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => {}}>
                        <td>
                          <Link
                            to={`/complaints/${c._id}`}
                            style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700, fontSize: '0.8125rem' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.complaintNumber}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <Link
                            to={`/complaints/${c._id}`}
                            style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title}
                            </div>
                          </Link>
                        </td>
                        {isAdminOrManager && (
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {c.createdBy?.name}
                          </td>
                        )}
                        <td style={{ fontSize: '0.8125rem' }}>{c.category?.name || '—'}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {c.location?.building ? `${c.location.building}${c.location.room ? ', ' + c.location.room : ''}` : '—'}
                        </td>
                        <td><StatusBadge type="priority" value={c.priority?.level} /></td>
                        <td><StatusBadge type="status" value={c.status} /></td>
                        {isAdminOrManager && (
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {c.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                          </td>
                        )}
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {format(new Date(c.createdAt), 'dd MMM yyyy')}
                        </td>
                        {isAdminOrManager && (
                          <td>
                            {c.sla?.deadline ? (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: slaBreached ? '#ef4444' : slaNear ? '#f59e0b' : '#10b981',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                {slaBreached ? '⚠ Breached' : slaNear ? '⏰ Near' : '✓ OK'}
                              </span>
                            ) : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: 80, textAlign: 'center' }}>
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComplaintsListPage;
