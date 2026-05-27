import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ADMIN_EMAIL = 'admin@eventx.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = await login({ email: ADMIN_EMAIL, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid admin credentials.');
    }
    // success → AuthContext updates → App re-renders → redirects to admin dashboard
  };

  return (
    <div className="auth-page">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="auth-container">
        {/* Left panel — Admin branding */}
        <div className="auth-brand-panel" style={{
          background: 'linear-gradient(160deg, rgba(239,68,68,0.1) 0%, rgba(124,58,237,0.12) 60%, rgba(239,68,68,0.08) 100%), var(--bg-secondary)',
        }}>
          <div className="auth-brand-content">
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#f87171',
              marginBottom: '24px',
            }}>
              <span style={{ width: '7px', height: '7px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Restricted Access
            </div>

            <h1 className="auth-brand-title" style={{ fontSize: '2.1rem' }}>
              Admin
              <span style={{ display: 'block', background: 'linear-gradient(135deg, #ef4444, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Control Panel
              </span>
            </h1>
            <p className="auth-brand-subtitle">
              Authorised personnel only. Full control over events, bookings, and the EventX platform.
            </p>

            {/* Admin capabilities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Admin Capabilities
              </div>
              {[
                { icon: '🎪', title: 'Manage Events', desc: 'Create, edit and delete university events' },
                { icon: '🎟️', title: 'View All Bookings', desc: 'Monitor and cancel ticket bookings' },
                { icon: '📊', title: 'Analytics & Reports', desc: 'Track attendance and event performance' },
                { icon: '👥', title: 'User Management', desc: 'Oversee student and faculty accounts' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(124,58,237,0.15))',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}>{icon}</div>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700, display: 'block' }}>{title}</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — Admin login form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper animate-fade-in-up">
            {/* Veltech Logo */}
            <div className="veltech-logo-container">
              <img
                src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png"
                alt="Veltech University"
                className="veltech-logo-img auth-header-logo"
              />
            </div>

            <div className="section-label" style={{ color: '#ef4444' }}>
              <span>🛡️</span>
              <span>Admin Sign In</span>
            </div>

            <h2 className="form-title" style={{ marginBottom: '4px' }}>Admin Access</h2>
            <p className="form-subtitle">Enter your admin password to access the control panel.</p>

            {/* Auto-filled email display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}>🛡️</div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#f87171', marginBottom: '2px' }}>Admin Account</div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>{ADMIN_EMAIL}</div>
              </div>
              <div style={{
                marginLeft: 'auto',
                padding: '3px 10px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '20px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#f87171',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>AUTO-FILLED</div>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>❌</span> {error}
              </div>
            )}

            <form id="admin-login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="admin-password" className="form-label">
                  Admin Password <span className="required">*</span>
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className={`form-input${touched && error ? ' input-error' : ''}`}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onBlur={() => setTouched(true)}
                  autoComplete="current-password"
                  autoFocus
                />
                {touched && error && (
                  <span className="error-msg" role="alert">⚠️ {error}</span>
                )}
              </div>

              <button
                id="btn-admin-login"
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
                style={{ background: 'linear-gradient(135deg, #ef4444, #7c3aed)' }}
              >
                {isSubmitting ? (
                  <><span className="spinner" /> Authenticating…</>
                ) : (
                  <>🛡️ Access Admin Panel</>
                )}
              </button>
            </form>

            <div className="auth-switch">
              Not an admin?{' '}
              <Link to="/login" className="auth-switch-link">Back to Sign In →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
