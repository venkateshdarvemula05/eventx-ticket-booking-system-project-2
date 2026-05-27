import React, { useState, useCallback } from 'react';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { ToastContainer } from '../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Chatbot from '../components/Chatbot';
import WeatherWidget from '../components/WeatherWidget';

let toastId = 0;

const DEPARTMENTS = [
  'Department of Computer Science & Engineering',
  'Department of Electronics & Communication',
  'Department of Mechanical Engineering',
  'Department of Civil Engineering',
  'Department of Information Technology',
  'Department of Electrical Engineering',
  'Department of Biomedical Engineering',
  'Department of Chemical Engineering',
  'Department of Artificial Intelligence & ML',
  'Department of Data Science',
  'Department of Arts & Humanities',
  'Department of MBA / Management',
  'Other',
];

const INDIAN_NAMES = [
  'Aditya', 'Manasa', 'Rahul', 'Priya', 'Karthik', 'Sneha', 'Vikram', 'Anjali',
  'Rohan', 'Kavya', 'Arjun', 'Nidhi', 'Siddharth', 'Pooja', 'Abhinav', 'Neha',
  'Vivek', 'Divya', 'Sanjay', 'Shruti', 'Vishal', 'Swati', 'Tarun', 'Meghana',
  'Pranav', 'Ananya', 'Nitin', 'Rashmi', 'Kiran', 'Aparna', 'Gaurav', 'Deepa',
  'Rohit', 'Harini', 'Manoj', 'Bhavana', 'Ashish', 'Geetha', 'Suresh', 'Kritika',
  'Ravi', 'Preethi', 'Kalyan', 'Shilpa', 'Deepak', 'Sindhu', 'Naveen', 'Roopa',
  'Varun', 'Pallavi',
];

const getPseudoRandomName = (id, index) => {
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // Add index to hash to get a different name for each attendee of the same booking
  return INDIAN_NAMES[(Math.abs(hash) + index) % INDIAN_NAMES.length];
};

const emptyForm = {
  name: '',
  department: '',
  date: '',
  time: '',
  endTime: '',
  venue: '',
  price: '',
  totalTickets: '',
  description: '',
};

const AdminDashboard = () => {
  const { events, addEvent, updateEvent, deleteEvent, bookings, loading, cancelBooking, bookTickets } = useEvents();
  const { user, logout } = useAuth();

  const [toasts, setToasts] = useState([]);
  const [tab, setTab] = useState('events'); // 'events' | 'bookings'
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [expandedBookingNames, setExpandedBookingNames] = useState(null); // booking id whose names are expanded

  const onToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Validation ──────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'name': return !value.trim() ? 'Event name is required.' : '';
      case 'department': return !value ? 'Department is required.' : '';
      case 'date': return !value ? 'Date is required.' : '';
      case 'time': return !value ? 'Start time is required.' : '';
      case 'venue': return !value.trim() ? 'Venue is required.' : '';
      case 'price': {
        if (value === '' || value === undefined) return 'Price is required.';
        if (Number(value) < 0) return 'Price cannot be negative.';
        return '';
      }
      case 'totalTickets': {
        if (!value) return 'Total tickets is required.';
        if (Number(value) < 1) return 'Must have at least 1 ticket.';
        if (!Number.isInteger(Number(value))) return 'Must be a whole number.';
        return '';
      }
      default: return '';
    }
  };

  const validateAll = () => {
    const newErrors = {};
    ['name', 'department', 'date', 'time', 'venue', 'price', 'totalTickets'].forEach((f) => {
      newErrors[f] = validateField(f, formData[f]);
    });
    return newErrors;
  };

  // ── Handlers ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleCreate = () => {
    setFormData(emptyForm);
    setEditingEvent(null);
    setErrors({});
    setView('create');
  };

  const handleEdit = (evt) => {
    setFormData({
      name: evt.name,
      department: evt.department,
      date: evt.date,
      time: evt.time,
      endTime: evt.endTime || '',
      venue: evt.venue,
      price: String(evt.price),
      totalTickets: String(evt.totalTickets),
      description: evt.description || '',
    });
    setEditingEvent(evt);
    setErrors({});
    setView('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateAll();
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    if (view === 'create') {
      const success = await addEvent(formData);
      if (success) onToast('Event created successfully!', 'success', 5000);
      else onToast('Error creating event.', 'error', 5000);
    } else {
      const success = await updateEvent(editingEvent.id, formData);
      if (success) onToast('Event updated successfully!', 'success', 5000);
      else onToast('Error updating event.', 'error', 5000);
    }

    setView('list');
    setFormData(emptyForm);
    setEditingEvent(null);
  };

  const handleDelete = async (id) => {
    const success = await deleteEvent(id);
    if (success) onToast('Event deleted permanently.', 'success', 5000);
    else onToast('Error deleting event.', 'error', 5000);
    setDeleteConfirm(null);
  };

  const handleCancel = () => {
    setView('list');
    setFormData(emptyForm);
    setEditingEvent(null);
    setErrors({});
  };

  const handleAdminBook = async (evt) => {
    if (evt.availableTickets <= 0) {
      onToast('❌ No tickets available!', 'error', 5000);
      return;
    }

    if (window.confirm(`Do you (Admin) want to book 1 ticket for "${evt.name}"?`)) {
      const userDetails = {
        bookingId: `ADM-BOK-${Date.now()}`,
        name: user.name,
        email: user.email,
        phone: 'Admin-Internal',
        totalPrice: evt.price
      };

      const success = await bookTickets(evt.id, 1, userDetails);
      if (success) {
        onToast('Tickets booked successfully!', 'success', 5000);
      } else {
        onToast('Booking failed. Not enough tickets.', 'error', 5000);
      }
    }
  };

  // ── Filtered events ─────────────────────────────────
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  };

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Stats ───────────────────────────────────────────
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'active').length;

  // Ensure we don't get negative values if database state is inconsistent
  const totalTicketsSold = events.reduce((sum, e) => {
    const sold = e.totalTickets - e.availableTickets;
    return sum + Math.max(0, sold);
  }, 0);

  const totalRevenue = events.reduce((sum, e) => {
    const sold = e.totalTickets - e.availableTickets;
    return sum + (Math.max(0, sold) * e.price);
  }, 0);

  const categorizeEvents = (eventsList) => {
    const today = [];
    const upcoming = [];
    const past = [];

    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    eventsList.forEach(evt => {
      if (evt.date === todayStr) {
        today.push(evt);
      } else if (evt.date < todayStr) {
        past.push(evt);
      } else {
        upcoming.push(evt);
      }
    });

    return { today, upcoming, past };
  };

  const categorizedAdminEvents = categorizeEvents(filteredEvents);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="app-wrapper">
        {/* Header */}
        <header className="app-header" role="banner">
          <a href="/" className="header-logo" aria-label="EventX home" style={{ textDecoration: 'none' }}>
            <img 
              src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" 
              alt="Veltech University" 
              className="veltech-logo-img"
              style={{ height: '42px', marginRight: '12px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="logo-text" style={{ lineHeight: '1', color: '#ffd600', fontSize: '1.5rem' }}>EventX</span>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 900, 
                color: '#fff', 
                textShadow: '0 0 15px rgba(255, 214, 0, 0.6)', 
                letterSpacing: '1.8px', 
                marginTop: '2px' 
              }}>VELTECH UNIVERSITY</span>
            </div>
          </a>
          <div className="header-user">
            <div className="header-badge">
              <span className="badge-dot" aria-hidden="true" />
              <span>Admin Panel</span>
            </div>
            <div className="header-user-info">
              <div className="header-user-avatar">{getInitials(user?.name || 'A')}</div>
              <span className="header-user-name">{user?.name}</span>
              <span className="header-user-role" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                Admin
              </span>
            </div>
            <button id="btn-logout" className="btn-logout" onClick={logout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </header>

        <main className="main-content" style={{ maxWidth: '1200px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
              <div className="logo-icon animate-pulse" style={{ fontSize: '3rem', marginBottom: '20px' }}>⚡</div>
              <h3>Loading Dashboard Data...</h3>
            </div>
          ) : (
            <>
              {/* Hero */}
              <section className="page-hero">
                <div className="hero-eyebrow"><span>🛡️</span><span>Admin Dashboard</span></div>
                <h1 className="hero-title">Manage Events</h1>
                <p className="hero-subtitle">Create, edit, and manage all department events from one place.</p>
              </section>

              {/* Stats */}
              <div className="admin-stats">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.12)' }}>📊</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalEvents}</span>
                    <span className="stat-label">Total Events</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{activeEvents}</span>
                    <span className="stat-label">Active</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>🎟️</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalTicketsSold}</span>
                    <span className="stat-label">Tickets Sold</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>💰</div>
                  <div className="stat-info">
                    <span className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</span>
                    <span className="stat-label">Revenue</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              {view === 'list' && (
                <div className="admin-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <button
                    className={`admin-tab-btn ${tab === 'events' ? 'active' : ''}`}
                    onClick={() => setTab('events')}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: tab === 'events' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                      color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    🎟️ Manage Events
                  </button>
                  <button
                    className={`admin-tab-btn ${tab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setTab('bookings')}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: tab === 'bookings' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                      color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    📋 View Bookings ({bookings.length > 10 ? 10 : bookings.length})
                  </button>
                  <button
                    className={`admin-tab-btn ${tab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setTab('analytics')}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: tab === 'analytics' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                      color: '#fff', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    📊 Analytics
                  </button>
                </div>
              )}

              {/* ── LIST VIEW ── */}
              {view === 'list' && tab === 'events' && (
                <div className="animate-fade-in-up">
                  {/* Toolbar */}
                  <div className="admin-toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="admin-search-wrap" style={{ flex: 1, minWidth: '250px' }}>
                      <span className="admin-search-icon">🔍</span>
                      <input
                        id="admin-search"
                        type="text"
                        className="form-input admin-search-input"
                        placeholder="Search events by name or venue…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: '#000', border: '1px solid var(--border-color)' }}
                      />
                    </div>

                    {/* Dynamic Department Filter for Admin */}
                    <div style={{ position: 'relative', width: '260px' }}>
                      <button
                        onClick={() => setIsDeptOpen(!isDeptOpen)}
                        className="form-input"
                        style={{
                          background: '#000',
                          color: '#fff',
                          border: '1px solid var(--border-color)',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: isDeptOpen ? 'var(--shadow-glow)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onBlur={() => setTimeout(() => setIsDeptOpen(false), 200)}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                          {deptFilter === 'All' ? '🏛️ All Departments' : deptFilter}
                        </span>
                        <span style={{ 
                          transition: 'transform 0.3s ease', 
                          transform: isDeptOpen ? 'rotate(180deg)' : 'rotate(0)',
                          fontSize: '0.7rem',
                          opacity: 0.7
                        }}>▼</span>
                      </button>

                      {isDeptOpen && (
                        <div style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          right: 0,
                          background: 'rgba(15, 15, 26, 0.98)',
                          backdropFilter: 'blur(24px)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          zIndex: 1000,
                          maxHeight: '300px',
                          overflowY: 'auto',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                          animation: 'fadeInUp 0.2s ease both'
                        }} className="custom-scrollbar">
                          {['All', ...DEPARTMENTS].map(d => (
                            <div
                              key={d}
                              onClick={() => {
                                setDeptFilter(d);
                                setIsDeptOpen(false);
                              }}
                              style={{
                                padding: '12px 16px',
                                color: deptFilter === d ? '#fff' : 'var(--text-secondary)',
                                background: deptFilter === d ? 'var(--gradient-primary)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: deptFilter === d ? 700 : 500,
                                transition: 'all 0.2s ease',
                                borderBottom: '1px solid rgba(255,255,255,0.03)'
                              }}
                            >
                              {d === 'All' ? '🏛️ All Departments' : d}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button id="btn-create-event" className="btn-submit admin-create-btn" onClick={handleCreate} style={{ width: 'auto', marginTop: 0 }}>
                      <span>➕</span> Create Event
                    </button>
                  </div>

                  {/* Event Cards */}
                  {filteredEvents.length === 0 ? (
                    <div className="admin-empty">
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                      <h3>No Events Found</h3>
                      <p>{searchTerm ? 'Try a different search term.' : 'Create your first event to get started!'}</p>
                    </div>
                  ) : (
                    <div className="events-categorized-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      {[
                        { label: 'Today\'s Events', items: categorizedAdminEvents.today },
                        { label: 'Upcoming Events', items: categorizedAdminEvents.upcoming },
                        { label: 'Recently Completed', items: categorizedAdminEvents.past }
                      ].map(({ label, items }) => items.length > 0 && (
                        <div key={label}>
                          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            {label} <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '8px' }}>({items.length})</span>
                            {label === 'Recently Completed' && (
                              <span style={{ fontSize: '0.7rem', marginLeft: '10px', color: '#64b5f6', opacity: 0.85, fontWeight: 500 }}>🔒 Read-only — event has ended</span>
                            )}
                          </h3>
                          <div className="admin-event-grid">
                            {items.map((evt, idx) => {
                              const isCompleted = label === 'Recently Completed';
                              return (
                                <div
                                  key={evt.id}
                                  className="card admin-event-card"
                                  style={{
                                    animationDelay: `${idx * 0.05}s`,
                                    ...(isCompleted ? {
                                      opacity: 0.45,
                                      filter: 'grayscale(60%) brightness(0.75)',
                                      boxShadow: '0 0 0 1.5px rgba(100,181,246,0.18), 0 4px 24px rgba(100,181,246,0.10)',
                                      background: 'rgba(30,40,70,0.55)',
                                      border: '1px solid rgba(100,181,246,0.18)',
                                      position: 'relative',
                                      overflow: 'hidden',
                                    } : {})
                                  }}
                                >
                                  {isCompleted && (
                                    <div style={{
                                      position: 'absolute', inset: 0,
                                      background: 'linear-gradient(135deg, rgba(100,181,246,0.07) 0%, rgba(30,40,80,0.18) 100%)',
                                      zIndex: 1,
                                      pointerEvents: 'none',
                                      borderRadius: 'inherit',
                                    }} />
                                  )}
                                  <div className="card-banner" style={{ position: 'relative', zIndex: 2 }} />
                                  <div className="card-body" style={{ padding: 'var(--space-5)', position: 'relative', zIndex: 2 }}>
                                    {/* Title row */}
                                    <div className="admin-card-header">
                                      <div>
                                        <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {evt.name}
                                          {isCompleted && (
                                            <span style={{ fontSize: '0.6rem', background: 'rgba(100,181,246,0.15)', color: '#64b5f6', border: '1px solid rgba(100,181,246,0.25)', borderRadius: '4px', padding: '1px 7px', fontWeight: 700, letterSpacing: '0.05em' }}>COMPLETED</span>
                                          )}
                                        </h3>
                                        <span className="event-dept" style={{ marginBottom: '0', fontSize: '0.72rem', padding: '3px 10px' }}>
                                          {evt.department}
                                        </span>
                                      </div>
                                      <div className="admin-card-actions">
                                        {!isCompleted && (
                                          <button
                                            className="admin-action-btn admin-edit-btn"
                                            onClick={() => handleEdit(evt)}
                                            title="Edit event"
                                          >
                                            ✏️
                                          </button>
                                        )}
                                        <button
                                          className="admin-action-btn admin-delete-btn"
                                          onClick={() => setDeleteConfirm(evt.id)}
                                          title="Delete event"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>

                                    {/* Info */}
                                    <div className="admin-card-meta">
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>📅 {formatDate(evt.date)}</span>
                                        <WeatherWidget date={evt.date} mini={true} />
                                      </div>
                                      <span>🕐 {formatTime(evt.time)}{evt.endTime ? ` – ${formatTime(evt.endTime)}` : ''}</span>
                                      <div style={{ marginTop: '4px' }}>
                                        <span style={{ display: 'block' }}>📍 {evt.venue.replace(', Veltech University', '')}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7, paddingLeft: '24px', display: 'block' }}>Veltech University</span>
                                      </div>
                                    </div>

                                    {/* Ticket & Price row */}
                                    <div className="admin-card-stats">
                                      <div className="admin-card-stat">
                                        <span className="admin-stat-label">Tickets</span>
                                        <span className="admin-stat-value">
                                          {evt.availableTickets}/{evt.totalTickets}
                                        </span>
                                        <div className="admin-mini-progress">
                                          <div
                                            className="admin-mini-fill"
                                            style={{
                                              width: `${(evt.availableTickets / evt.totalTickets) * 100}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="admin-card-stat">
                                        <span className="admin-stat-label">Price</span>
                                        <span className="admin-stat-value admin-price">
                                          {evt.price === 0 ? 'Free' : `₹${evt.price.toLocaleString('en-IN')}`}
                                        </span>
                                      </div>
                                      <div className="admin-card-stat">
                                        <span className="admin-stat-label">Sold</span>
                                        <span className="admin-stat-value">
                                          {Math.max(0, evt.totalTickets - evt.availableTickets)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Direct Booking Button for Admin — hidden for completed events */}
                                    {!isCompleted ? (
                                      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <button
                                          className="btn-submit"
                                          style={{
                                            width: '100%',
                                            padding: '10px',
                                            fontSize: '0.85rem',
                                            background: evt.availableTickets > 0 ? 'var(--gradient-primary)' : '#444',
                                            opacity: evt.availableTickets > 0 ? 1 : 0.6,
                                            cursor: evt.availableTickets > 0 ? 'pointer' : 'not-allowed'
                                          }}
                                          onClick={() => handleAdminBook(evt)}
                                          disabled={evt.availableTickets <= 0}
                                        >
                                          {evt.availableTickets > 0 ? '🎫 Book Ticket for Admin' : '🚫 Sold Out'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <div style={{
                                          width: '100%',
                                          padding: '10px',
                                          fontSize: '0.82rem',
                                          textAlign: 'center',
                                          color: '#64b5f6',
                                          background: 'rgba(100,181,246,0.07)',
                                          border: '1px solid rgba(100,181,246,0.18)',
                                          borderRadius: '8px',
                                          fontWeight: 600,
                                          letterSpacing: '0.02em',
                                        }}>
                                          🔒 Event Ended — Booking Unavailable
                                        </div>
                                      </div>
                                    )}

                                    {/* Delete confirmation */}
                                    {deleteConfirm === evt.id && (
                                      <div className="admin-delete-confirm">
                                        <p>⚠️ Delete <strong>"{evt.name}"</strong>? This cannot be undone.</p>
                                        <div className="admin-delete-actions">
                                          <button className="btn-submit" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={() => handleDelete(evt.id)}>
                                            Yes, Delete
                                          </button>
                                          <button className="btn-reset" style={{ padding: '10px 20px', fontSize: '0.85rem', marginTop: 0 }} onClick={() => setDeleteConfirm(null)}>
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── BOOKINGS LIST VIEW ── */}
              {view === 'list' && tab === 'bookings' && (
                <div className="animate-fade-in-up">
                  {bookings.length === 0 ? (
                    <div className="admin-empty">
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                      <h3>No Bookings Yet</h3>
                      <p>When users book tickets, they will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {bookings.slice(0, 10).map((booking) => {
                        const evt = events.find(e => e.id === booking.eventId) || { name: 'Unknown Event' };
                        const hasNames = booking.ticketsBooked > 1;
                        const isExpanded = expandedBookingNames === booking.id;
                        return (
                          <div key={booking.id} className="card" style={{ padding: '20px' }}>
                            {/* Main row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                    {booking.name}
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({booking.email})</span>

                                  {/* Names toggle button — only shown when multiple tickets */}
                                  {hasNames && (
                                    <button
                                      onClick={() => setExpandedBookingNames(isExpanded ? null : booking.id)}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(124,58,237,0.35)',
                                        background: isExpanded ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
                                        color: '#c4b5fd',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '8px'
                                      }}
                                      title="View attendee names"
                                    >
                                      👥 Names {isExpanded ? '▲' : '▼'}
                                    </button>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ color: 'var(--accent-neon)' }}>{evt.name}</span> • {evt.venue ? (evt.venue.includes('Veltech University') ? evt.venue : `${evt.venue}, Veltech University`) : 'Online'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  ID: {booking.id} • {new Date(booking.createdAt).toLocaleString()}
                                </div>
                              </div>

                              {/* Right side: ticket count + names button + delete */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '1.3rem', fontWeight: 800, background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {booking.ticketsBooked} Ticket{booking.ticketsBooked > 1 ? 's' : ''}
                                  </div>
                                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    ₹{Number(booking.totalPrice).toLocaleString('en-IN')}
                                  </div>
                                </div>



                                <button
                                  className="admin-action-btn admin-delete-btn"
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to cancel the booking for ${booking.name}? This will refund ${booking.ticketsBooked} ticket(s) back to the event.`)) {
                                      const result = await cancelBooking(booking.id);
                                      if (result === true || (result && result.success)) {
                                        onToast('Booking cancelled successfully.', 'success', 5000);
                                        setTimeout(() => {
                                          const emailStr = result.email || booking.email;
                                          onToast(`Cancellation email sent to ${emailStr}`, 'success', 5000);
                                        }, 800);
                                        if (expandedBookingNames === booking.id) setExpandedBookingNames(null);
                                      } else {
                                        onToast('Failed to cancel booking.', 'error', 5000);
                                      }
                                    }
                                  }}
                                  title="Cancel booking"
                                  style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Expanded attendee names panel */}
                            {isExpanded && hasNames && (
                              <div style={{
                                marginTop: '14px',
                                padding: '14px 16px',
                                background: 'rgba(124,58,237,0.07)',
                                border: '1px solid rgba(124,58,237,0.2)',
                                borderRadius: '10px',
                                animation: 'fadeIn 0.2s ease',
                              }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  👥 Attendee List ({booking.ticketsBooked} ticket{booking.ticketsBooked > 1 ? 's' : ''})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {Array.from({ length: booking.ticketsBooked }).map((_, idx) => {
                                    return (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                          minWidth: '22px', height: '22px', borderRadius: '50%',
                                          background: idx === 0 ? 'var(--gradient-primary)' : 'rgba(124,58,237,0.25)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '0.7rem', fontWeight: 700,
                                          color: idx === 0 ? '#fff' : '#c4b5fd', flexShrink: 0
                                        }}>
                                          {idx + 1}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: idx === 0 ? 600 : 400 }}>
                                          {idx === 0 ? booking.name : (booking.attendeeNames?.[idx - 1] || getPseudoRandomName(booking.id, idx))}
                                          {idx === 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '8px' }}>(Booker)</span>}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── ANALYTICS VIEW ── */}
              {view === 'list' && tab === 'analytics' && (
                <div className="animate-fade-in-up">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    📊 Event Analytics Dashboard
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    {/* Bar Chart — Tickets Sold Per Event */}
                    <div className="card" style={{ animation: 'fadeInUp 0.4s ease both' }}>
                      <div className="card-banner" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }} />
                      <div className="card-body" style={{ padding: 'var(--space-5)' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                          🎟️ Tickets Sold Per Event
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={events.map(e => ({
                            name: e.name.length > 15 ? e.name.substring(0, 15) + '…' : e.name,
                            sold: Math.max(0, e.totalTickets - e.availableTickets),
                            available: e.availableTickets,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#fff' }}
                              labelStyle={{ color: '#c4b5fd', fontWeight: 700 }}
                            />
                            <Bar dataKey="sold" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Sold" />
                            <Bar dataKey="available" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Available" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart — Revenue by Event */}
                    <div className="card" style={{ animation: 'fadeInUp 0.4s 0.1s ease both' }}>
                      <div className="card-banner" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }} />
                      <div className="card-body" style={{ padding: 'var(--space-5)' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                          💰 Revenue Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={380}>
                          <PieChart>
                            <Pie
                              data={events
                                .filter(e => (e.totalTickets - e.availableTickets) * e.price > 0)
                                .filter(e => !e.name.toLowerCase().includes('web dev bootcamp')) // Removing the 'red one after tech fest'
                                .map(e => ({
                                  name: e.name,
                                  value: Math.max(0, e.totalTickets - e.availableTickets) * e.price,
                                }))}
                              cx="50%" cy="40%"
                              innerRadius={60} outerRadius={85}
                              paddingAngle={5}
                              dataKey="value"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                              {events.filter(e => (e.totalTickets - e.availableTickets) * e.price > 0).map((_, i) => (
                                <Cell key={i} fill={['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'][i % 10]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#fff' }}
                              formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              align="center"
                              layout="horizontal"
                              iconType="circle" 
                              wrapperStyle={{ 
                                paddingTop: '30px', 
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                bottom: 0
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Department-wise Summary Table */}
                  <div className="card" style={{ animation: 'fadeInUp 0.4s 0.2s ease both' }}>
                    <div className="card-banner" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }} />
                    <div className="card-body" style={{ padding: 'var(--space-5)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                        🏛️ Department-wise Summary
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid rgba(124,58,237,0.3)' }}>
                              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>Department</th>
                              <th style={{ textAlign: 'center', padding: '12px 16px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>Events</th>
                              <th style={{ textAlign: 'center', padding: '12px 16px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>Tickets Sold</th>
                              <th style={{ textAlign: 'right', padding: '12px 16px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const deptMap = {};
                              events.forEach(e => {
                                const dept = e.department || 'Other';
                                if (!deptMap[dept]) deptMap[dept] = { count: 0, sold: 0, revenue: 0 };
                                deptMap[dept].count++;
                                const sold = Math.max(0, e.totalTickets - e.availableTickets);
                                deptMap[dept].sold += sold;
                                deptMap[dept].revenue += sold * e.price;
                              });
                              return Object.entries(deptMap).map(([dept, stats], idx) => (
                                <tr key={dept} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{dept}</td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>{stats.count}</td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>{stats.sold}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{stats.revenue.toLocaleString('en-IN')}</td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CREATE / EDIT VIEW ── */}
              {(view === 'create' || view === 'edit') && (
                <div className="card animate-fade-in-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
                  <div className="card-banner" style={{
                    background: view === 'edit'
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : 'var(--gradient-primary)',
                  }} />
                  <div className="card-body">
                    <div className="section-label">
                      <span>{view === 'edit' ? '✏️' : '➕'}</span>
                      <span>{view === 'edit' ? 'Edit Event' : 'Create New Event'}</span>
                    </div>

                    <h2 className="form-title">
                      {view === 'edit' ? `Editing: ${editingEvent?.name}` : 'New Event Details'}
                    </h2>
                    <p className="form-subtitle">
                      {view === 'edit' ? 'Update any field below and save.' : 'Fill in all the details for the new event.'}
                    </p>

                    <form id="admin-event-form" onSubmit={handleSubmit} noValidate>
                      {/* Event Name */}
                      <div className="form-group">
                        <label htmlFor="evt-name" className="form-label">Event Name <span className="required">*</span></label>
                        <input id="evt-name" type="text" name="name" className={`form-input${errors.name ? ' input-error' : ''}`}
                          placeholder="e.g. TechFest 2025" value={formData.name} onChange={handleChange} />
                        {errors.name && <span className="error-msg">⚠️ {errors.name}</span>}
                      </div>

                      {/* Department */}
                      <div className="form-group">
                        <label htmlFor="evt-dept" className="form-label">Department <span className="required">*</span></label>
                        <select id="evt-dept" name="department" className={`form-input form-select${errors.department ? ' input-error' : ''}`}
                          value={formData.department} onChange={handleChange}>
                          <option value="">— Select department —</option>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.department && <span className="error-msg">⚠️ {errors.department}</span>}
                      </div>

                      {/* Date + Time row */}
                      <div className="form-row-2">
                        <div className="form-group">
                          <label htmlFor="evt-date" className="form-label">Date <span className="required">*</span></label>
                          <input id="evt-date" type="date" name="date" className={`form-input${errors.date ? ' input-error' : ''}`}
                            value={formData.date} onChange={handleChange} />
                          {errors.date && <span className="error-msg">⚠️ {errors.date}</span>}
                        </div>
                        <div className="form-group">
                          <label htmlFor="evt-time" className="form-label">Start Time <span className="required">*</span></label>
                          <input id="evt-time" type="time" name="time" className={`form-input${errors.time ? ' input-error' : ''}`}
                            value={formData.time} onChange={handleChange} />
                          {errors.time && <span className="error-msg">⚠️ {errors.time}</span>}
                        </div>
                      </div>

                      {/* End Time + Venue */}
                      <div className="form-row-2">
                        <div className="form-group">
                          <label htmlFor="evt-endtime" className="form-label">End Time</label>
                          <input id="evt-endtime" type="time" name="endTime" className="form-input"
                            value={formData.endTime} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="evt-venue" className="form-label">Venue <span className="required">*</span></label>
                          <input id="evt-venue" type="text" name="venue" className={`form-input${errors.venue ? ' input-error' : ''}`}
                            placeholder="e.g. Main Auditorium" value={formData.venue} onChange={handleChange} />
                          {errors.venue && <span className="error-msg">⚠️ {errors.venue}</span>}
                        </div>
                      </div>

                      {/* Price + Tickets */}
                      <div className="form-row-2">
                        <div className="form-group">
                          <label htmlFor="evt-price" className="form-label">Ticket Price (₹) <span className="required">*</span></label>
                          <input id="evt-price" type="number" name="price" className={`form-input${errors.price ? ' input-error' : ''}`}
                            placeholder="e.g. 299" min="0" value={formData.price} onChange={handleChange} />
                          {errors.price && <span className="error-msg">⚠️ {errors.price}</span>}
                          <span className="input-helper">Set to 0 for free events</span>
                        </div>
                        <div className="form-group">
                          <label htmlFor="evt-tickets" className="form-label">Total Tickets <span className="required">*</span></label>
                          <input id="evt-tickets" type="number" name="totalTickets" className={`form-input${errors.totalTickets ? ' input-error' : ''}`}
                            placeholder="e.g. 150" min="1" value={formData.totalTickets} onChange={handleChange} />
                          {errors.totalTickets && <span className="error-msg">⚠️ {errors.totalTickets}</span>}
                          {view === 'edit' && editingEvent && (
                            <span className="input-helper">
                              Currently {editingEvent.totalTickets - editingEvent.availableTickets} sold
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="form-group">
                        <label htmlFor="evt-desc" className="form-label">Description</label>
                        <textarea
                          id="evt-desc"
                          name="description"
                          className="form-input"
                          placeholder="Brief description of the event…"
                          value={formData.description}
                          onChange={handleChange}
                          rows={3}
                          style={{ resize: 'vertical', minHeight: '80px' }}
                        />
                      </div>

                      {/* Buttons */}
                      <button id="btn-save-event" type="submit" className="btn-submit">
                        {view === 'edit' ? '💾 Save Changes' : '🚀 Create Event'}
                      </button>
                      <button type="button" className="btn-reset" onClick={handleCancel}>
                        ← Back to List
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="app-footer" role="contentinfo">
          <div style={{ marginBottom: '12px' }}>
            <img 
              src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" 
              alt="Veltech University" 
              className="veltech-logo-img footer-logo"
              style={{ margin: '0 auto' }}
            />
          </div>
          <p>Built with ❤️ by <span>EventX</span> for <strong style={{ color: 'var(--accent-purple)' }}>VELTECH UNIVERSITY</strong> &nbsp;·&nbsp; Admin Panel &nbsp;·&nbsp; © {new Date().getFullYear()}</p>
        </footer>
        <Chatbot events={events} bookings={bookings} role="admin" user={user} allDepartments={DEPARTMENTS} onCreateEvent={addEvent} />
      </div>
    </>
  );
};

export default AdminDashboard;
