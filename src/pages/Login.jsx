import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setSubmitError('');
    if (touched[name]) setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const allTouched = { email: true, password: true };
    setTouched(allTouched);

    const newErrors = {
      email: validate('email', formData.email),
      password: validate('password', formData.password),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = await login({ email: formData.email, password: formData.password });
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
    }
    // if success, AuthContext updates → App re-renders → redirects
  };

  return (
    <div className="auth-page">
      {/* BG effects */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="auth-container">
        {/* Left panel — branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="logo-icon auth-logo-icon" aria-hidden="true">⚡</div>
            <h1 className="auth-brand-title">
              EventX
              <span style={{ display: 'block', fontSize: '1rem', marginTop: '10px', color: 'var(--accent-purple)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
                @ VELTECH UNIVERSITY
              </span>
            </h1>
            <p className="auth-brand-subtitle">
              Your one-stop platform for Veltech University department event ticket booking.
            </p>

            <div className="auth-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🎟️</span>
                <div>
                  <strong>Instant Booking</strong>
                  <p>Reserve tickets in seconds</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📊</span>
                <div>
                  <strong>Live Availability</strong>
                  <p>Real-time ticket tracking</p>
                </div>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔒</span>
                <div>
                  <strong>Secure & Private</strong>
                  <p>Your data stays safe</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
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

            <div className="section-label">
              <span>🔐</span>
              <span>Sign In</span>
            </div>

            <h2 className="form-title" style={{ marginBottom: '4px' }}>Welcome Back</h2>
            <p className="form-subtitle">Sign in to your account to book event tickets.</p>

            {submitError && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>❌</span> {submitError}
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className={`form-input${errors.email && touched.email ? ' input-error' : ''}`}
                  placeholder="e.g. priya@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                />
                {errors.email && touched.email && (
                  <span className="error-msg" role="alert">⚠️ {errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Password <span className="required">*</span>
                </label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  className={`form-input${errors.password && touched.password ? ' input-error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="current-password"
                />
                {errors.password && touched.password && (
                  <span className="error-msg" role="alert">⚠️ {errors.password}</span>
                )}
              </div>

              <button
                id="btn-login"
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner" /> Signing In…</>
                ) : (
                  <>🔓 Sign In</>
                )}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-switch-link">Create one →</Link>
            </div>

            {/* Admin Panel shortcut */}
            <div className="auth-quick-login" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin-login')}>
              <p className="auth-quick-title">Admin Panel</p>
              <div className="auth-quick-item" style={{ pointerEvents: 'none' }}>
                <span className="auth-quick-role admin">Admin</span>
                <span>admin@eventx.com</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>→ Admin Login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
