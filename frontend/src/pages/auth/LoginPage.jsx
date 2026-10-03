import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || null;

  const ROLE_DEFAULTS = {
    USER: '/dashboard',
    STAFF: '/staff/dashboard',
    MANAGER: '/manager/dashboard',
    ADMIN: '/admin/dashboard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter email and password');
      return;
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      const redirect = from || ROLE_DEFAULTS[result.user.role] || '/dashboard';
      navigate(redirect, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  // Quick demo login buttons
  const demoLogins = [
    { label: 'Admin', email: 'admin@nexgen.edu', password: 'Admin@12345', color: '#10b981' },
    { label: 'Manager', email: 'manager.elec@nexgen.edu', password: 'Manager@12345', color: '#3b82f6' },
    { label: 'Staff', email: 'staff.ramesh@nexgen.edu', password: 'Staff@12345', color: '#f59e0b' },
    { label: 'Student', email: 'aditya@student.nexgen.edu', password: 'User@12345', color: '#6366f1' },
  ];

  const quickLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: 'white',
      }} className="hidden lg:flex flex-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>AIMS-Campus</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>NexGen University</div>
          </div>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem' }}>
          AI-Powered Campus<br />
          <span style={{ color: '#818cf8' }}>Maintenance System</span>
        </h1>

        <p style={{ fontSize: '1.1rem', opacity: 0.7, lineHeight: 1.7, maxWidth: 400 }}>
          Report, track, and resolve campus maintenance issues with AI-assisted classification,
          automatic assignment, and real-time status updates.
        </p>

        {/* Feature highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
          {[
            { icon: '🤖', text: 'AI auto-classifies complaints by category & priority' },
            { icon: '⚡', text: 'Smart auto-assignment to least-loaded staff' },
            { icon: '📊', text: 'Real-time analytics & SLA tracking' },
            { icon: '🔔', text: 'Instant notifications for all status updates' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
              <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        margin: 'auto',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div className="card animate-fade-in" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '2.5rem',
        }}>
          {/* Logo (mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={24} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>AIMS-Campus</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Smart Maintenance Portal</div>
            </div>
          </div>

          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@nexgen.edu"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  color: 'white',
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    paddingRight: '2.75rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" style={{ color: '#818cf8', fontSize: '0.8125rem', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                Register
              </Link>
            </p>
          </form>

          {/* Demo Quick Login */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              DEMO — Quick Login
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {demoLogins.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => quickLogin(d.email, d.password)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 8,
                    border: `1.5px solid ${d.color}44`,
                    background: `${d.color}11`,
                    color: d.color,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
