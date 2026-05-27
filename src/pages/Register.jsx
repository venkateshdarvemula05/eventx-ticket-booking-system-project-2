import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Artificial Intelligence & ML',
  'Data Science',
  'MBA / Management',
  'Other',
];

const ROLES = [
  { value: 'student', label: '🎓 Student', desc: 'Book tickets for events' },
  { value: 'faculty', label: '👨‍🏫 Faculty', desc: 'Book tickets & view analytics' },
  { value: 'admin', label: '🛡️ Admin', desc: 'Update admin password' },
];

const initialData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  department: '',
};

const Register = () => {
  const { register } = useAuth();

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── OTP State (Innovation: Email OTP Verification) ──────
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const countdownRef = useRef(null);

  const startCountdown = () => {
    setOtpCountdown(60); // 1 minute (Updated from 5m)
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setOtpError('Enter a valid email address.');
      return;
    }
    setOtpLoading(true); setOtpError(''); setOtpSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpSuccess(`OTP sent to ${otpEmail}. Check your inbox!`);
        setFormData(p => ({ ...p, email: otpEmail }));
        startCountdown();
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setOtpError(data.error || 'Failed to send OTP.');
      }
    } catch { setOtpError('Cannot connect to backend server.'); }
    setOtpLoading(false);
  };

  const handleOtpInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otpValue];
    newOtp[index] = value;
    setOtpValue(newOtp);
    setOtpError('');
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpValue.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch('http://localhost:5000/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpVerified(true);
        setOtpSuccess('✅ Email verified! Complete your registration below.');
        clearInterval(countdownRef.current);
      } else {
        setOtpError(data.error || 'Invalid OTP.');
      }
    } catch { setOtpError('Cannot connect to backend server.'); }
    setOtpLoading(false);
  };

  const fmtCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Admin-specific state
  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmNew, setAdminConfirmNew] = useState('');
  const [adminErrors, setAdminErrors] = useState({});
  const [adminSuccess, setAdminSuccess] = useState('');

  const isAdminMode = formData.role === 'admin';

  const validate = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.';
        if (!/[0-9]/.test(value)) return 'Include at least one number.';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.password) return 'Passwords do not match.';
        return '';
      case 'role':
        if (!value) return 'Please select your role.';
        return '';
      case 'department':
        if (!value) return 'Please select your department.';
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
    if (name === 'password' && touched.confirmPassword) {
      setErrors((p) => ({
        ...p,
        confirmPassword: formData.confirmPassword && formData.confirmPassword !== value
          ? 'Passwords do not match.'
          : '',
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const handleRoleSelect = (role) => {
    setFormData((p) => ({ ...p, role }));
    setTouched((p) => ({ ...p, role: true }));
    setErrors((p) => ({ ...p, role: '' }));
    setSubmitError('');
    setAdminSuccess('');
    setAdminErrors({});
  };

  // ── Admin Password Update Handler ──────────────────────────
  const handleAdminPasswordUpdate = async (e) => {
    e.preventDefault();
    setAdminErrors({});
    setAdminSuccess('');
    setSubmitError('');

    const errs = {};
    if (!adminOldPassword) errs.oldPassword = 'Current admin password is required.';
    if (!adminNewPassword) errs.newPassword = 'New password is required.';
    else if (adminNewPassword.length < 6) errs.newPassword = 'Min 6 characters.';
    else if (!/[A-Z]/.test(adminNewPassword)) errs.newPassword = 'Include at least one uppercase letter.';
    else if (!/[0-9]/.test(adminNewPassword)) errs.newPassword = 'Include at least one number.';
    if (!adminConfirmNew) errs.confirmNew = 'Please confirm the new password.';
    else if (adminConfirmNew !== adminNewPassword) errs.confirmNew = 'Passwords do not match.';

    if (Object.keys(errs).length > 0) { setAdminErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: adminOldPassword, newPassword: adminNewPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminSuccess('✅ Admin password updated successfully! You can now log in with the new password.');
        setAdminOldPassword('');
        setAdminNewPassword('');
        setAdminConfirmNew('');
      } else {
        setSubmitError(data.error || 'Failed to update password.');
      }
    } catch {
      setSubmitError('Cannot connect to backend server.');
    }
    setIsSubmitting(false);
  };

  // ── Regular Register Submit ─────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const allTouched = Object.keys(formData).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = {};
    Object.keys(formData).forEach((k) => {
      newErrors[k] = validate(k, formData[k]);
    });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
    }
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
        {/* Left panel — register branding */}
        <div className="auth-brand-panel" style={{
          background: 'linear-gradient(160deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(124, 58, 237, 0.12) 100%), var(--bg-secondary)',
        }}>
          <div className="auth-brand-content">
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '100px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#34d399',
              marginBottom: '24px',
            }}>
              <span style={{ width: '7px', height: '7px', background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              New Account Registration
            </div>

            <h1 className="auth-brand-title" style={{ fontSize: '2.2rem' }}>
              Welcome to
              <span style={{ display: 'block', background: 'linear-gradient(135deg, #34d399, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                EventX Portal
              </span>
            </h1>
            <p className="auth-brand-subtitle">
              Your gateway to Veltech University's vibrant event ecosystem — from tech fests to cultural nights.
            </p>

            {/* Stats strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '32px',
            }}>
              {[
                { num: '50+', label: 'Events' },
                { num: '2K+', label: 'Students' },
                { num: '10+', label: 'Depts' },
              ].map(({ num, label }) => (
                <div key={label} style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(6px)',
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                How it works
              </div>
              {[
                { step: '01', icon: '📝', title: 'Create Account', desc: 'Register with your Veltech email in under a minute' },
                { step: '02', icon: '🔍', title: 'Browse Events', desc: 'Explore department events, workshops & fests' },
                { step: '03', icon: '🎟️', title: 'Book & Attend', desc: 'Secure your seat and get a PDF ticket instantly' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(59,130,246,0.15))',
                    border: '1px solid rgba(52,211,153,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}>{icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#34d399', letterSpacing: '1px' }}>{step}</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700 }}>{title}</strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
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
              <span>📝</span>
              <span>{isAdminMode ? 'Admin Settings' : 'Create Account'}</span>
            </div>

            <h2 className="form-title" style={{ marginBottom: '4px' }}>
              {isAdminMode ? 'Update Admin Password' : 'Get Started'}
            </h2>
            <p className="form-subtitle">
              {isAdminMode
                ? 'There is only one admin. Enter your current password to set a new one.'
                : 'Create your account to start booking event tickets.'}
            </p>

            {submitError && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>❌</span> {submitError}
              </div>
            )}

            {/* ── OTP VERIFICATION STEP (Innovation Module) ── */}
            {!isAdminMode && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <span>{otpVerified ? '✅' : '📧'}</span>
                  <span>Step 1: Verify Your Email</span>
                  {otpVerified && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '100px', padding: '2px 10px', fontWeight: 700 }}>VERIFIED</span>}
                </div>

                {!otpVerified ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
                    {/* Email input + send button */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <input
                        id="otp-email-input"
                        type="email"
                        className="form-input"
                        placeholder="Enter your email to get OTP"
                        value={otpEmail}
                        onChange={e => { setOtpEmail(e.target.value); setOtpError(''); }}
                        disabled={otpSent && otpCountdown > 0}
                        style={{ flex: 1, opacity: otpSent && otpCountdown > 0 ? 0.6 : 1 }}
                      />
                      <button
                        id="btn-send-otp"
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || (otpSent && otpCountdown > 0)}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #34d399, #3b82f6)', border: 'none', color: '#fff', fontWeight: 700, cursor: otpLoading || (otpSent && otpCountdown > 0) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap', opacity: otpSent && otpCountdown > 0 ? 0.6 : 1, flexShrink: 0 }}
                      >
                        {otpLoading ? '⏳' : otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>

                    {/* 6-digit OTP boxes */}
                    {otpSent && (
                      <>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '16px 0 8px' }}>
                          {otpValue.map((digit, i) => (
                            <input
                              key={i}
                              ref={otpRefs[i]}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={e => handleOtpInput(i, e.target.value)}
                              onKeyDown={e => handleOtpKeyDown(i, e)}
                              style={{
                                width: '44px', height: '52px', textAlign: 'center',
                                fontSize: '1.4rem', fontWeight: 900,
                                background: digit ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                                border: `2px solid ${digit ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.15)'}`,
                                borderRadius: '10px', color: '#fff',
                                outline: 'none', transition: 'all 0.2s',
                                caretColor: '#34d399',
                              }}
                            />
                          ))}
                        </div>

                        {/* Countdown */}
                        {otpCountdown > 0 && (
                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            ⏱️ OTP expires in <strong style={{ color: '#ffd600' }}>{fmtCountdown(otpCountdown)}</strong>
                          </div>
                        )}
                        {otpCountdown === 0 && otpSent && (
                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#f87171', marginBottom: '10px' }}>
                            ⚠️ OTP expired. Click Resend to get a new one.
                          </div>
                        )}

                        <button
                          id="btn-verify-otp"
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || otpValue.join('').length < 6 || otpCountdown === 0}
                          style={{ width: '100%', padding: '11px', borderRadius: '10px', background: otpValue.join('').length === 6 && otpCountdown > 0 ? 'linear-gradient(135deg, #34d399, #3b82f6)' : 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontWeight: 700, cursor: otpValue.join('').length === 6 && otpCountdown > 0 ? 'pointer' : 'not-allowed', fontSize: '0.88rem', transition: 'all 0.2s' }}
                        >
                          {otpLoading ? '⏳ Verifying…' : '✅ Verify OTP'}
                        </button>
                      </>
                    )}

                    {otpError && <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#f87171' }}>❌ {otpError}</div>}
                    {otpSuccess && !otpVerified && <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#34d399' }}>{otpSuccess}</div>}
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                    ✅ {otpEmail} has been verified. Fill in the details below to complete registration.
                  </div>
                )}
              </div>
            )}

            {/* Show rest of form only after OTP verified (or in admin mode) */}
            {(otpVerified || isAdminMode) && (
            <div>

            <div className="form-group">
              <label className="form-label">
                I am a <span className="required">*</span>
              </label>
              <div className="role-selector">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    className={`role-option${formData.role === r.value ? ' role-active' : ''}`}
                    onClick={() => handleRoleSelect(r.value)}
                  >
                    <span className="role-option-label">{r.label}</span>
                    <span className="role-option-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
              {errors.role && touched.role && (
                <span className="error-msg" role="alert">⚠️ {errors.role}</span>
              )}
            </div>

            {/* ── ADMIN: Password Change Panel ── */}
            {isAdminMode ? (
              <form id="admin-password-form" onSubmit={handleAdminPasswordUpdate} noValidate>
                {adminSuccess && (
                  <div className="auth-alert auth-alert-success" role="alert" style={{ marginBottom: '20px' }}>
                    {adminSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="admin-old-password" className="form-label">
                    Current Admin Password <span className="required">*</span>
                  </label>
                  <input
                    id="admin-old-password"
                    type="password"
                    className={`form-input${adminErrors.oldPassword ? ' input-error' : ''}`}
                    placeholder="Enter current admin password"
                    value={adminOldPassword}
                    onChange={(e) => { setAdminOldPassword(e.target.value); setAdminErrors((p) => ({ ...p, oldPassword: '' })); setSubmitError(''); }}
                    autoComplete="current-password"
                  />
                  {adminErrors.oldPassword && (
                    <span className="error-msg" role="alert">⚠️ {adminErrors.oldPassword}</span>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="admin-new-password" className="form-label">
                      New Password <span className="required">*</span>
                    </label>
                    <input
                      id="admin-new-password"
                      type="password"
                      className={`form-input${adminErrors.newPassword ? ' input-error' : ''}`}
                      placeholder="Min 6 chars, 1 uppercase, 1 number"
                      value={adminNewPassword}
                      onChange={(e) => { setAdminNewPassword(e.target.value); setAdminErrors((p) => ({ ...p, newPassword: '' })); }}
                      autoComplete="new-password"
                    />
                    {adminErrors.newPassword && (
                      <span className="error-msg" role="alert">⚠️ {adminErrors.newPassword}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-confirm-new" className="form-label">
                      Confirm New Password <span className="required">*</span>
                    </label>
                    <input
                      id="admin-confirm-new"
                      type="password"
                      className={`form-input${adminErrors.confirmNew ? ' input-error' : ''}`}
                      placeholder="Re-enter new password"
                      value={adminConfirmNew}
                      onChange={(e) => { setAdminConfirmNew(e.target.value); setAdminErrors((p) => ({ ...p, confirmNew: '' })); }}
                      autoComplete="new-password"
                    />
                    {adminErrors.confirmNew && (
                      <span className="error-msg" role="alert">⚠️ {adminErrors.confirmNew}</span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.07)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#f87171',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                  }}
                >
                  🛡️ <strong>Admin Notice:</strong> There is only one administrator account. This will change the password for the existing admin.
                </div>

                <button
                  id="btn-update-admin"
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  {isSubmitting ? (
                    <><span className="spinner" /> Updating Password…</>
                  ) : (
                    <>🔐 Update Admin Password</>
                  )}
                </button>
              </form>
            ) : (
              /* ── REGULAR: Student / Faculty Registration Form ── */
              <form id="register-form" onSubmit={handleSubmit} noValidate>
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="reg-name" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    className={`form-input${errors.name && touched.name ? ' input-error' : ''}`}
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="name"
                  />
                  {errors.name && touched.name && (
                    <span className="error-msg" role="alert">⚠️ {errors.name}</span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="reg-email" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="reg-email"
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

                {/* Department */}
                <div className="form-group">
                  <label htmlFor="reg-department" className="form-label">
                    Department <span className="required">*</span>
                  </label>
                  <select
                    id="reg-department"
                    name="department"
                    className={`form-input form-select${errors.department && touched.department ? ' input-error' : ''}`}
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">— Select your department —</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.department && touched.department && (
                    <span className="error-msg" role="alert">⚠️ {errors.department}</span>
                  )}
                </div>

                {/* Password */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="reg-password" className="form-label">
                      Password <span className="required">*</span>
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      name="password"
                      className={`form-input${errors.password && touched.password ? ' input-error' : ''}`}
                      placeholder="Min 6 chars"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="new-password"
                    />
                    {errors.password && touched.password && (
                      <span className="error-msg" role="alert">⚠️ {errors.password}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm" className="form-label">
                      Confirm Password <span className="required">*</span>
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      name="confirmPassword"
                      className={`form-input${errors.confirmPassword && touched.confirmPassword ? ' input-error' : ''}`}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && touched.confirmPassword && (
                      <span className="error-msg" role="alert">⚠️ {errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <button
                  id="btn-register"
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><span className="spinner" /> Creating Account…</>
                  ) : (
                    <>🚀 Create Account</>
                  )}
                </button>
              </form>
            )}

            </div>
            )}


            <div className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">Sign in →</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
