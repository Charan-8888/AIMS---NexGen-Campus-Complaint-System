import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Tag, User, Clock, Building2,
  Sparkles, Star, AlertTriangle, CheckCircle2, MessageSquare,
  Loader2, Camera, Wrench, RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { complaintsApi, adminApi } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import useAuthStore from '../../store/authStore';

const PRIORITY_COLORS = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
};

// ── Status Update Modal ─────────────────────────────────────────────────────
const StatusModal = ({ complaint, onClose, onUpdated }) => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const ROLE_TRANSITIONS = {
    STAFF: ['ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED'],
    MANAGER: ['IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED'],
    ADMIN: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED'],
  };
  const allowed = ROLE_TRANSITIONS[user.role] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) { toast.error('Select a status'); return; }
    setLoading(true);
    try {
      await complaintsApi.updateStatus(complaint._id, status, note);
      toast.success(`Status updated to ${status}`);
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card animate-fade-in" style={{ width: 440, maxWidth: '90vw' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Update Status</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Select status</option>
              {allowed.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea className="input" rows={3} placeholder="Add a note about this status change..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null} Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Assign Modal ─────────────────────────────────────────────────────────────
const AssignModal = ({ complaint, onClose, onUpdated }) => {
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.getStaff().then(({ data }) => setStaffList(data.data || [])).catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!staffId) { toast.error('Select a staff member'); return; }
    setLoading(true);
    try {
      await complaintsApi.assign(complaint._id, staffId);
      toast.success('Complaint assigned');
      onUpdated(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card animate-fade-in" style={{ width: 480, maxWidth: '90vw' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Assign Complaint</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {staffList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading staff...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflow: 'auto' }}>
              {staffList.map((s) => (
                <label key={s.staffId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: 8, cursor: 'pointer',
                  background: staffId === s.staffId ? '#6366f122' : 'var(--surface-1)',
                  border: `1.5px solid ${staffId === s.staffId ? '#6366f1' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="staff" value={s.staffId} onChange={() => setStaffId(s.staffId)} style={{ display: 'none' }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#6366f133',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#6366f1', flexShrink: 0,
                  }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.department} · {s.activeTaskCount} active task{s.activeTaskCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: s.activeTaskCount > 5 ? '#ef4444' : s.activeTaskCount > 3 ? '#f59e0b' : '#10b981',
                  }}>
                    {s.availability || 'AVAILABLE'}
                  </div>
                </label>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null} Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Feedback Modal ───────────────────────────────────────────────────────────
const FeedbackModal = ({ complaint, onClose, onUpdated }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please give a star rating'); return; }
    setLoading(true);
    try {
      await complaintsApi.submitFeedback(complaint._id, { rating, comment, speedRating: rating, staffRating: rating });
      toast.success('Thank you for your feedback!');
      onUpdated(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card animate-fade-in" style={{ width: 440, maxWidth: '90vw' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Rate Your Experience</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          How satisfied are you with the resolution of your complaint?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: n <= (hover || rating) ? '#f59e0b' : 'var(--border)',
                transition: 'color 0.1s', fontSize: '2rem', padding: '0.25rem',
              }}
            >
              <Star size={36} fill={n <= (hover || rating) ? '#f59e0b' : 'none'} />
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Comment (optional)</label>
          <textarea className="input" rows={3} placeholder="Tell us about your experience..." value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !rating}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />} Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Complaint Detail Page ────────────────────────────────────────────────
const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [complaint, setComplaint] = useState(null);
  const [workRecord, setWorkRecord] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null); // 'status' | 'assign' | 'feedback' | 'verify'

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role);
  const isStaff = user?.role === 'STAFF';
  const isOwner = complaint?.createdBy?.userId?._id === user?._id || complaint?.createdBy?.userId === user?._id;

  const fetchComplaint = async () => {
    try {
      const { data } = await complaintsApi.getById(id);
      setComplaint(data.data.complaint);
      setWorkRecord(data.data.workRecord);
      setFeedback(data.data.feedback);
    } catch {
      toast.error('Complaint not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  const handleVerify = async (satisfied) => {
    try {
      const reason = satisfied ? undefined : prompt('Why are you reopening this complaint?');
      await complaintsApi.verify(id, satisfied, reason);
      toast.success(satisfied ? 'Complaint verified!' : 'Complaint reopened');
      fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="animate-spin" /> Loading complaint...
      </div>
    );
  }

  if (!complaint) return null;

  const c = complaint;
  const priorityColor = PRIORITY_COLORS[c.priority?.level] || '#6b7280';
  const slaBreached = c.sla?.breached;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Back nav */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#6366f1' }}>{c.complaintNumber}</span>
            <StatusBadge type="status" value={c.status} />
            <StatusBadge type="priority" value={c.priority?.level} />
            {slaBreached && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} /> SLA Breached
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{c.title}</h1>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Submitted by {c.createdBy?.name} on {format(new Date(c.createdAt), 'dd MMM yyyy, h:mm a')}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(isAdminOrManager || isStaff) && !['VERIFIED', 'CANCELLED'].includes(c.status) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('status')}>
              Update Status
            </button>
          )}
          {isAdminOrManager && c.status === 'PENDING' && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal('assign')}>
              <User size={14} /> Assign
            </button>
          )}
          {isOwner && c.status === 'RESOLVED' && !feedback && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => handleVerify(true)}>
                <CheckCircle2 size={14} /> Mark Resolved ✓
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleVerify(false)}>
                <RotateCcw size={14} /> Reopen
              </button>
            </>
          )}
          {isOwner && c.status === 'VERIFIED' && !feedback && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal('feedback')}>
              <Star size={14} /> Give Feedback
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.description}</p>
          </div>

          {/* Attachments */}
          {c.attachments?.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} color="#6366f1" /> Photos
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {c.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer">
                    <img src={att.url} alt={`Attachment ${i + 1}`} style={{
                      width: 120, height: 90, borderRadius: 8,
                      objectFit: 'cover', border: '1px solid var(--border)',
                      transition: 'transform 0.15s', cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.04)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {c.aiAnalysis && (
            <div className="ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Analysis</div>
                  {c.aiAnalysis.analyzedAt && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      by {c.aiAnalysis.model || 'Groq LLM'} · {format(new Date(c.aiAnalysis.analyzedAt), 'dd MMM, h:mm a')}
                    </div>
                  )}
                </div>
                {c.aiAnalysis.confidence && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
                    {Math.round(c.aiAnalysis.confidence * 100)}% confidence
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                {[
                  { label: 'Category', value: c.aiAnalysis.category },
                  { label: 'Priority', value: c.aiAnalysis.priority },
                  { label: 'Department', value: c.aiAnalysis.department },
                  { label: 'Priority Score', value: `${c.aiAnalysis.priorityScore}/10` },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {item.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {c.aiAnalysis.reason && (
                <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>Reason:</strong> {c.aiAnalysis.reason}
                </div>
              )}
              {c.aiAnalysis.recommendedAction && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>Recommended Action:</strong> {c.aiAnalysis.recommendedAction}
                </div>
              )}
              {c.aiAnalysis.overriddenAt && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> AI classification overridden on {format(new Date(c.aiAnalysis.overriddenAt), 'dd MMM')}
                </div>
              )}
            </div>
          )}

          {/* Work Record */}
          {workRecord && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={16} color="#6366f1" /> Work Record
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Technician</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{workRecord.technicianName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Resolution Type</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{workRecord.resolutionType || '—'}</div>
                </div>
                {workRecord.totalCost > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Total Cost</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>₹{workRecord.totalCost}</div>
                  </div>
                )}
              </div>
              {workRecord.workPerformed && (
                <div style={{ background: 'var(--surface-1)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {workRecord.workPerformed}
                </div>
              )}
              {workRecord.afterImages?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.875rem' }}>
                  {workRecord.afterImages.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noreferrer">
                      <img src={img.url} alt="" style={{ width: 90, height: 70, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={16} color="#f59e0b" /> User Feedback
              </h3>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={20} fill={n <= feedback.rating ? '#f59e0b' : 'none'} color={n <= feedback.rating ? '#f59e0b' : 'var(--border)'} />
                ))}
                <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{feedback.rating}/5</span>
              </div>
              {feedback.comment && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{feedback.comment}"</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#6366f1" /> Activity Timeline
            </h3>
            <div className="timeline">
              {(c.timeline || []).slice().reverse().map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" style={{ background: i === 0 ? '#6366f1' : 'var(--border)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <StatusBadge type="status" value={t.status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        by {t.performedBy?.name} ({t.performedBy?.role})
                      </span>
                    </div>
                    {t.note && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                        {t.note}
                      </p>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {t.timestamp ? format(new Date(t.timestamp), 'dd MMM yyyy, h:mm a') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar — details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 80 }}>
          {/* Info cards */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Details</h4>
            {[
              { icon: Tag, label: 'Category', value: c.category?.name },
              { icon: Building2, label: 'Department', value: c.department?.name },
              { icon: MapPin, label: 'Location', value: c.location ? `${c.location.building}${c.location.floor !== undefined ? `, Floor ${c.location.floor}` : ''}${c.location.room ? `, ${c.location.room}` : ''}` : null },
              { icon: User, label: 'Reporter', value: c.createdBy?.name },
              { icon: Wrench, label: 'Assigned To', value: c.assignedTo?.name },
            ].map((item) => item.value ? (
              <div key={item.label} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.875rem', alignItems: 'flex-start' }}>
                <item.icon size={14} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
                </div>
              </div>
            ) : null)}
          </div>

          {/* SLA Card */}
          {c.sla?.deadline && (
            <div className="card" style={{ padding: '1.25rem', border: `1.5px solid ${slaBreached ? '#ef444444' : '#10b98144'}` }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', color: slaBreached ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} /> SLA Status
              </h4>
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deadline: </span>
                  <span style={{ fontWeight: 600, color: slaBreached ? '#ef4444' : 'var(--text-primary)' }}>
                    {format(new Date(c.sla.deadline), 'dd MMM, h:mm a')}
                  </span>
                </div>
                {c.sla.resolutionTimeMinutes && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Resolved in: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {Math.round(c.sla.resolutionTimeMinutes / 60 * 10) / 10}h
                    </span>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: slaBreached ? '#ef4444' : '#10b981' }}>
                    {slaBreached ? '⚠ SLA BREACHED' : '✓ Within SLA'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="card" style={{ padding: '1.25rem', border: `1.5px solid ${priorityColor}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`priority-dot ${c.priority?.level?.toLowerCase()}`} style={{ width: 10, height: 10 }} />
              <span style={{ fontWeight: 700, color: priorityColor, fontSize: '1rem' }}>{c.priority?.level}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Priority</span>
            </div>
            {c.priority?.score && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: priorityColor,
                    width: `${(c.priority.score / 10) * 100}%`,
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Score: {c.priority.score}/10
                </div>
              </div>
            )}
            {c.priority?.reason && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                {c.priority.reason}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'status' && <StatusModal complaint={c} onClose={() => setModal(null)} onUpdated={fetchComplaint} />}
      {modal === 'assign' && <AssignModal complaint={c} onClose={() => setModal(null)} onUpdated={fetchComplaint} />}
      {modal === 'feedback' && <FeedbackModal complaint={c} onClose={() => setModal(null)} onUpdated={fetchComplaint} />}
    </div>
  );
};

export default ComplaintDetailPage;
