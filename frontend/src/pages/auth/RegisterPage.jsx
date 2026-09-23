import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    department: '', studentId: '',
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome to AIMS-Campus.');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    color: 'white',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '2rem',
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: 520,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '2.5rem',
      }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <ChevronLeft size={16} /> Back to login
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>Create Account</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>AIMS-Campus Portal</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Full Name *</label>
              <input
                name="name" type="text" className="input"
                placeholder="Your full name"
                value={form.name} onChange={handleChange} style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Phone</label>
              <input
                name="phone" type="tel" className="input"
                placeholder="10-digit number"
                value={form.phone} onChange={handleChange} style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Email Address *</label>
            <input
              name="email" type="email" className="input"
              placeholder="you@nexgen.edu"
              value={form.email} onChange={handleChange} style={inputStyle}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password" type={showPassword ? 'text' : 'password'} className="input"
                placeholder="Minimum 8 characters"
                value={form.password} onChange={handleChange}
                style={{ ...inputStyle, paddingRight: '2.75rem' }}
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Department</label>
              <input
                name="department" type="text" className="input"
                placeholder="e.g. CSE, ECE"
                value={form.department} onChange={handleChange} style={inputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Student / Staff ID</label>
              <input
                name="studentId" type="text" className="input"
                placeholder="e.g. NGU22CS001"
                value={form.studentId} onChange={handleChange} style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary btn-lg"
            disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Creating account...</>
            ) : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
