import React, { useState, useEffect } from 'react';
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
  'Faculty / Staff',
  'Other',
];

const EXAMPLE_NAMES = [
  'Aditya', 'Manasa', 'Rahul', 'Priya', 'Karthik', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya'
];

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const BookingForm = ({ availableTickets, pricePerTicket, eventName, onBookingSuccess }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    tickets: 1,
  });

  // Pre-fill user data when they log in or the component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    department: '',
    tickets: '',
  });
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  // Extra attendee names for tickets 2, 3, ... N
  const [attendeeNames, setAttendeeNames] = useState([]);

  const totalCost = formData.tickets * pricePerTicket;

  // ── Per-field validation ──────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!validateEmail(value)) return 'Enter a valid email address.';
        return '';
      case 'department':
        if (!value) return 'Please select your department.';
        return '';
      case 'tickets': {
        const num = Number(value);
        if (!value || isNaN(num)) return 'Enter a valid number of tickets.';
        if (num < 1) return 'Must book at least 1 ticket.';
        if (!Number.isInteger(num)) return 'Tickets must be a whole number.';
        if (num > availableTickets) return `Only ${availableTickets} ticket(s) available.`;
        if (num > 10) return 'Maximum 10 tickets per booking.';
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      newErrors[field] = validateField(field, formData[field]);
    });
    return newErrors;
  };

  // ── Handlers ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
    // Sync attendeeNames array when ticket count changes via manual input
    if (name === 'tickets') {
      const newCount = parseInt(value, 10);
      if (!isNaN(newCount) && newCount >= 1) {
        const extra = newCount - 1;
        setAttendeeNames((prev) => {
          if (extra <= 0) return [];
          const next = [...prev];
          while (next.length < extra) next.push('');
          return next.slice(0, extra);
        });
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleTicketStepper = (delta) => {
    const newVal = Math.min(
      Math.max(1, formData.tickets + delta),
      Math.min(availableTickets, 10)
    );
    setFormData((prev) => ({ ...prev, tickets: newVal }));
    // Resize attendeeNames array: extra names needed = newVal - 1
    setAttendeeNames((prev) => {
      const extra = newVal - 1;
      if (extra <= 0) return [];
      const next = [...prev];
      while (next.length < extra) next.push('');
      return next.slice(0, extra);
    });
    if (touched.tickets) {
      setErrors((prev) => ({ ...prev, tickets: validateField('tickets', newVal) }));
    }
  };

  const handleReset = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: '',
      tickets: 1,
    });
    setErrors({ name: '', email: '', department: '', tickets: '' });
    setTouched({});
    setAttendeeNames([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = validateAll();
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    setIsSubmitting(true);
    // Simulate async API call
    await new Promise((res) => setTimeout(res, 900));
    setIsSubmitting(false);

    const bookingId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const now = new Date();
    const bookedAt = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    onBookingSuccess({
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department,
      eventName,
      ticketsBooked: Number(formData.tickets),
      pricePerTicket,
      totalPrice: totalCost,
      bookingId,
      bookedAt,
      // attendeeNames array should ONLY contain names for tickets 2, 3...
      attendeeNames: Number(formData.tickets) > 1
        ? attendeeNames.map(n => n.trim()).filter(Boolean)
        : [],
    });

    handleReset();
  };

  const isSoldOut = availableTickets === 0;

  return (
    <div className="card card-right">
      <div className="card-banner" />
      <div className="card-body">

        {/* Header */}
        <div className="section-label">
          <span>🎟️</span>
          <span>Book Tickets</span>
        </div>

        <h2 className="form-title">Reserve Your Spot</h2>
        <p className="form-subtitle">
          Fill in your details below to secure your tickets for this event.
        </p>

        {isSoldOut ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🚫</div>
            <h3 style={{ color: '#f87171', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Sold Out
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              All tickets for this event have been booked. Please check back later.
            </p>
          </div>
        ) : (
          <form
            id="booking-form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Ticket booking form"
          >
            {/* Name */}
            <div className="form-group">
              <label htmlFor="booking-name" className="form-label">
                Full Name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="booking-name"
                type="text"
                name="name"
                className={`form-input${errors.name && touched.name ? ' input-error' : ''}`}
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
                aria-required="true"
                aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                aria-invalid={!!(errors.name && touched.name)}
              />
              {errors.name && touched.name && (
                <span id="name-error" className="error-msg" role="alert">
                  <span aria-hidden="true">⚠️</span> {errors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="booking-email" className="form-label">
                Email Address <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="booking-email"
                type="email"
                name="email"
                className={`form-input${errors.email && touched.email ? ' input-error' : ''}`}
                placeholder="e.g. priya@college.edu"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                aria-invalid={!!(errors.email && touched.email)}
              />
              {errors.email && touched.email && (
                <span id="email-error" className="error-msg" role="alert">
                  <span aria-hidden="true">⚠️</span> {errors.email}
                </span>
              )}
            </div>

            {/* Department - Custom Dynamic Filter */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="booking-department" className="form-label">
                Department <span className="required" aria-hidden="true">*</span>
              </label>
              <button
                type="button"
                className={`form-input${errors.department && touched.department ? ' input-error' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: formData.department ? '#fff' : 'var(--text-muted)',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: errors.department && touched.department ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)'
                }}
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                onBlur={() => setTimeout(() => setIsDeptOpen(false), 200)}
              >
                <span>{formData.department || '— Select your department —'}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  transition: 'transform 0.3s ease',
                  transform: isDeptOpen ? 'rotate(180deg)' : 'rotate(0)'
                }}>▼</span>
              </button>

              {isDeptOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  left: 0,
                  right: 0,
                  background: 'rgba(15, 15, 26, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  zIndex: 1000,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                  animation: 'fadeInUp 0.2s ease both'
                }} className="custom-scrollbar">
                  {DEPARTMENTS.map((dept) => (
                    <div
                      key={dept}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, department: dept }));
                        setIsDeptOpen(false);
                        setTouched(prev => ({ ...prev, department: true }));
                        setErrors(prev => ({ ...prev, department: '' }));
                      }}
                      style={{
                        padding: '12px 16px',
                        color: formData.department === dept ? '#fff' : 'var(--text-secondary)',
                        background: formData.department === dept ? 'var(--gradient-primary)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid rgba(255,255,255,0.03)'
                      }}
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              )}
              {errors.department && touched.department && (
                <span id="dept-error" className="error-msg" role="alert">
                  <span aria-hidden="true">⚠️</span> {errors.department}
                </span>
              )}
            </div>

            {/* Number of Tickets */}
            <div className="form-group">
              <label htmlFor="booking-tickets" className="form-label">
                Number of Tickets <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="ticket-selector">
                <button
                  type="button"
                  id="btn-decrease-tickets"
                  className="ticket-btn"
                  onClick={() => handleTicketStepper(-1)}
                  disabled={formData.tickets <= 1}
                  aria-label="Decrease ticket count"
                >
                  −
                </button>
                <input
                  id="booking-tickets"
                  type="number"
                  name="tickets"
                  className={`form-input ticket-input-field${errors.tickets && touched.tickets ? ' input-error' : ''}`}
                  value={formData.tickets}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={1}
                  max={Math.min(availableTickets, 10)}
                  aria-required="true"
                  aria-describedby="tickets-helper"
                  aria-invalid={!!(errors.tickets && touched.tickets)}
                />
                <button
                  type="button"
                  id="btn-increase-tickets"
                  className="ticket-btn"
                  onClick={() => handleTicketStepper(1)}
                  disabled={formData.tickets >= Math.min(availableTickets, 10)}
                  aria-label="Increase ticket count"
                >
                  +
                </button>
              </div>
              {errors.tickets && touched.tickets ? (
                <span className="error-msg" role="alert">
                  <span aria-hidden="true">⚠️</span> {errors.tickets}
                </span>
              ) : (
                <span id="tickets-helper" className="input-helper">
                  Max {Math.min(availableTickets, 10)} per booking · {availableTickets} available
                </span>
              )}
            </div>

            {/* Extra Attendee Names (for tickets > 1) */}
            {Number(formData.tickets) > 1 && (
              <div className="form-group" style={{ marginTop: '8px' }}>
                <div style={
                  {
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }
                }>
                  <span>👥</span>
                  <span>Attendee Names</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.65, fontWeight: 400 }}>
                    (Ticket 1 is auto-filled with your name)
                  </span>
                </div>

                {/* Ticket 1 — auto-filled, editable */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    minWidth: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>1</span>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                    placeholder="Your name"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>You</span>
                </div>

                {/* Tickets 2 .. N */}
                {attendeeNames.map((aName, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      minWidth: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0
                    }}>{idx + 2}</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder={`e.g. ${EXAMPLE_NAMES[idx % EXAMPLE_NAMES.length]}`}
                      value={aName}
                      onChange={(e) => {
                        const updated = [...attendeeNames];
                        updated[idx] = e.target.value;
                        setAttendeeNames(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Cost Preview */}
            {formData.tickets >= 1 && !errors.tickets && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-5)',
                  background: 'rgba(124, 58, 237, 0.07)',
                  border: '1px solid rgba(124, 58, 237, 0.18)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-3)',
                  animation: 'fadeIn 0.2s ease',
                }}
                aria-live="polite"
                aria-label={`Total cost: ₹${totalCost.toLocaleString('en-IN')}`}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {formData.tickets} × ₹{pricePerTicket.toLocaleString('en-IN')}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  background: 'var(--gradient-text)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-submit-booking"
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
              aria-label="Confirm ticket booking"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">🎟️</span>
                  <span>Confirm Booking</span>
                </>
              )}
            </button>

            {/* Reset */}
            <button
              id="btn-reset-form"
              type="button"
              className="btn-reset"
              onClick={handleReset}
              aria-label="Reset booking form"
            >
              <span aria-hidden="true">↺</span>
              <span>Reset Form</span>
            </button>

          </form>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
