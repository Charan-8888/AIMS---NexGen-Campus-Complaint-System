import { useState, useEffect } from 'react';
import { adminApi } from '../../api/complaints';
import { Users, Search, Mail, Phone, Loader2, ShieldCheck, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await adminApi.getUsers();
        setUsers(data.data || []);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.studentId && u.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage all system users, roles, and access</p>
        </div>
        <button className="btn btn-primary btn-sm">+ Add User</button>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Search users by name, email, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select className="input" style={{ width: 200 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="USER">User (Student/Faculty)</option>
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={44} strokeWidth={1} />
            <p style={{ fontWeight: 500 }}>No users found</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Department / ID</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' }}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u._id.substring(u._id.length - 6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {u.email}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {u.phone || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.5rem', borderRadius: 99,
                        fontSize: '0.75rem', fontWeight: 600,
                        background: u.role === 'ADMIN' ? '#ef444422' : u.role === 'MANAGER' ? '#8b5cf622' : u.role === 'STAFF' ? '#f59e0b22' : '#10b98122',
                        color: u.role === 'ADMIN' ? '#ef4444' : u.role === 'MANAGER' ? '#8b5cf6' : u.role === 'STAFF' ? '#f59e0b' : '#10b981'
                      }}>
                        {u.role === 'ADMIN' && <ShieldCheck size={12} />} 
                        {u.role === 'USER' && <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {u.department || '—'}
                        {u.studentId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.studentId}</div>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {format(new Date(u.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" disabled={u.role === 'ADMIN'}>Edit</button>
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

export default AdminUsersPage;
