import { useState, useEffect } from 'react';
import { adminApi } from '../../api/complaints';
import { Users, Search, Mail, Phone, Loader2, Star, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await adminApi.getStaff();
        setStaff(data.data || []);
      } catch (err) {
        toast.error('Failed to load staff list');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Department Staff</h1>
          <p className="page-subtitle">Manage workload and view staff performance</p>
        </div>
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Search staff..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="empty-state">
            <Users size={44} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No staff members found</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Contact</th>
                  <th>Availability</th>
                  <th>Active Tasks</th>
                  <th>Completed</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.staffId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' }}>
                          {s.name?.charAt(0)}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {s.email || '—'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {s.phone || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.5rem', borderRadius: 99,
                        fontSize: '0.75rem', fontWeight: 600,
                        background: s.availability === 'AVAILABLE' ? '#10b98122' : '#f59e0b22',
                        color: s.availability === 'AVAILABLE' ? '#10b981' : '#f59e0b'
                      }}>
                        {s.availability === 'AVAILABLE' && <CheckCircle2 size={12} />} {s.availability || 'AVAILABLE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: s.activeTaskCount > 5 ? '#ef4444' : 'var(--text-primary)' }}>
                        {s.activeTaskCount}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.totalTasksCompleted || 0}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        {s.averageRating > 0 ? s.averageRating : 'N/A'}
                      </div>
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

export default ManagerStaffPage;
