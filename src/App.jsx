import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEvents } from './context/EventContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EventDetails from './components/EventDetails';
import BookingForm from './components/BookingForm';
import BookingSummary from './components/BookingSummary';
import MyTickets from './pages/MyTickets';
import { ToastContainer } from './components/Toast';
import Chatbot from './components/Chatbot';
import WeatherWidget from './components/WeatherWidget';
import './index.css';

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
];

// ── Toast helper ─────────────────────────────────────────
let toastId = 0;

// ── Protected Route Helper ───────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/register" replace />;
  return children;
};

// ── Guest Route Helper (redirect if logged in) ──────────
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// ── Dashboard / Booking Page ─────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { events, bookings, bookTickets, loading } = useEvents();
  
  // Only active events
  const activeEvents = events.filter((e) => e.status === 'active');
  
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

  const categorizedEvents = categorizeEvents(activeEvents);
  
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentView, setCurrentView] = useState('events'); // 'events' | 'mytickets'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  const normalizeDept = (dept) => {
    if (!dept) return '';
    const d = dept.toLowerCase().trim();
    if (d.includes('computer science') || d.includes('cse')) return 'Department of Computer Science & Engineering';
    if (d.includes('electronics') || d.includes('ece')) return 'Department of Electronics & Communication';
    if (d.includes('mechanical')) return 'Department of Mechanical Engineering';
    if (d.includes('civil')) return 'Department of Civil Engineering';
    if (d.includes('information technology') || d.includes('it')) return 'Department of Information Technology';
    if (d.includes('artificial intelligence') || d.includes('ai')) return 'Department of Artificial Intelligence & ML';
    if (d.includes('data science')) return 'Department of Data Science';
    if (d.includes('management') || d.includes('mba')) return 'Department of MBA / Management';
    if (d.includes('arts') || d.includes('humanities')) return 'Department of Arts & Humanities';
    return dept.trim();
  };

  // Get unique departments (normalized to avoid duplicates)
  const departments = ['All', ...new Set(activeEvents.map(e => normalizeDept(e.department)).filter(Boolean))];

  // Auto-select first upcoming/today event when they load
  React.useEffect(() => {
    if (activeEvents.length > 0 && !selectedEventId) {
      const defaultEvent = categorizedEvents.today[0] || categorizedEvents.upcoming[0];
      if (defaultEvent) {
        setSelectedEventId(defaultEvent.id);
      }
    }
  }, [activeEvents, selectedEventId, categorizedEvents.today, categorizedEvents.upcoming]);

  // Selected event object
  const selectedEvent = activeEvents.find(e => e.id === selectedEventId) || categorizedEvents.today[0] || categorizedEvents.upcoming[0];

  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleBookingSuccess = useCallback(async (details) => {
    // pass complete details to save booking under user's name
    const success = await bookTickets(selectedEvent.id, details.ticketsBooked, details);
    if (!success) {
      addToast('Sorry, not enough tickets available or booking failed.', 'error', 5000);
      return;
    }
    
    setBookingDetails(details);
    setBookingSuccess(true);
    addToast(
      `${details.ticketsBooked} ticket${details.ticketsBooked > 1 ? 's' : ''} booked successfully!`,
      'success',
      5000
    );

    // Show email sent popup
    setTimeout(() => {
      addToast(`Confirmation email sent to ${details.email}`, 'success', 5000);
    }, 800);
  }, [addToast, bookTickets, selectedEvent]);

  const handleBookAnother = useCallback(() => {
    setBookingSuccess(false);
    setBookingDetails(null);
    addToast('Form is ready for a new booking.', 'info', 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [addToast]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return { bg: 'rgba(239,68,68,0.15)', color: '#f87171' };
      case 'faculty': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' };
      default: return { bg: 'rgba(16,185,129,0.15)', color: '#34d399' };
    }
  };

  const roleColors = getRoleBadgeColor(user?.role);

  const getDepartmentTheme = (dept) => {
    if (!dept) return { accent: '#7c3aed', rgb: '124, 58, 237', gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' };
    const d = dept.toLowerCase();
    if (d.includes('computer science') || d.includes('cse')) return { accent: '#3b82f6', rgb: '59, 130, 246', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)' };
    if (d.includes('information technology') || d.includes('it')) return { accent: '#a855f7', rgb: '168, 85, 247', gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' };
    if (d.includes('mba') || d.includes('management')) return { accent: '#f59e0b', rgb: '245, 158, 11', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' };
    if (d.includes('artificial intelligence') || d.includes('ai')) return { accent: '#10b981', rgb: '16, 185, 129', gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' };
    return { accent: '#7c3aed', rgb: '124, 58, 237', gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' };
  };

  const currentTheme = getDepartmentTheme(selectedEvent?.department);

  return (
    <div style={{
      '--accent-dynamic': currentTheme.accent,
      '--accent-dynamic-rgb': currentTheme.rgb,
      '--gradient-dynamic': currentTheme.gradient,
      '--shadow-dynamic-glow': `0 0 30px ${currentTheme.accent}4d, 0 0 60px ${currentTheme.accent}1a`
    }}>
      {/* Animated background */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="app-wrapper">
        {/* ── Header ── */}
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
            {/* User info */}
            <div className="header-user-info">
              <div className="header-user-avatar" aria-hidden="true">
                {getInitials(user?.name || 'U')}
              </div>
              <span className="header-user-name">{user?.name}</span>
              <span
                className="header-user-role"
                style={{ background: roleColors.bg, color: roleColors.color }}
              >
                {user?.role}
              </span>
            </div>

            {/* My Tickets Button */}
            <button
              onClick={() => setCurrentView(currentView === 'mytickets' ? 'events' : 'mytickets')}
              style={{
                padding: '7px 16px',
                background: currentView === 'mytickets' ? 'var(--gradient-primary)' : 'transparent',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: '100px',
                color: '#c4b5fd',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🎫</span>
              <span>My Tickets</span>
            </button>

            {/* Logout */}
            <button
              id="btn-logout"
              className="btn-logout"
              onClick={logout}
              aria-label="Sign out"
            >
              <span aria-hidden="true">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="main-content" id="main-content" role="main">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
              <div className="logo-icon animate-pulse" style={{ fontSize: '3rem', marginBottom: '20px' }}>⚡</div>
              <h3>Loading Events...</h3>
            </div>
          ) : currentView === 'mytickets' ? (
              <MyTickets onBack={() => setCurrentView('events')} addToast={addToast} />
          ) : (
            <>
          {/* Hero Section */}
          <section className="page-hero" aria-label="Page introduction">
            <div className="hero-eyebrow" role="doc-subtitle">
              <span aria-hidden="true">🎓</span>
              <span>Veltech University Official Events</span>
            </div>
            <h1 className="hero-title">
              Welcome, {user?.name?.split(' ')[0]}!<br />
              Book Your Tickets
            </h1>
            <p className="hero-subtitle">
              {user?.role === 'admin'
                ? 'Manage events directly from the Admin Dashboard.'
                : user?.role === 'faculty'
                ? 'As faculty, you can book tickets below and explore active events.'
                : 'Discover upcoming department events and secure your spot instantly.'}
            </p>
          </section>

          {/* Search & Department Filter */}
          {activeEvents.length > 0 && !bookingSuccess && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search events by name, venue, or department…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    paddingLeft: '42px', 
                    width: '100%',
                    background: '#000',
                    color: '#fff',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>
              {/* Floating Department Dropdown */}
              <div style={{ position: 'relative', width: '280px' }}>
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
                    transition: 'all 0.3s ease',
                    boxShadow: isDeptOpen ? 'var(--shadow-glow)' : 'none'
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
                    {departments.map(d => (
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
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeEvents.length > 0 && !bookingSuccess && (() => {
            // Apply search & dept filter to categorized events
            const filterFn = (evt) => {
              const matchesSearch = !searchTerm || 
                evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evt.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (evt.department && evt.department.toLowerCase().includes(searchTerm.toLowerCase()));
              const matchesDept = deptFilter === 'All' || normalizeDept(evt.department) === deptFilter;
              return matchesSearch && matchesDept;
            };

            const filtered = {
              today: categorizedEvents.today.filter(filterFn),
              upcoming: categorizedEvents.upcoming.filter(filterFn),
              past: categorizedEvents.past.filter(filterFn),
            };

            const totalFiltered = filtered.today.length + filtered.upcoming.length + filtered.past.length;

            if (totalFiltered === 0) {
              return (
                <div className="admin-empty" style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                  <h3>No Events Found</h3>
                  <p>Try a different search term or department filter.</p>
                </div>
              );
            }

            return (
            <div className="events-categorized-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '32px' }}>
              {[
                { label: 'Today\'s Events', items: filtered.today },
                { label: 'Upcoming Events', items: filtered.upcoming },
                { label: 'Recently Completed', items: filtered.past }
              ].map(({ label, items }) => items.length > 0 && (
                <div key={label}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    {label} <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '8px' }}>({items.length})</span>
                    {label === 'Recently Completed' && (
                      <span style={{ fontSize: '0.7rem', marginLeft: '10px', color: '#64b5f6', opacity: 0.85, fontWeight: 500 }}>🔒 Booking closed</span>
                    )}
                  </h3>
                  <div className="event-select-grid">
                    {items.map(evt => {
                      const isCompleted = label === 'Recently Completed';
                      return (
                        <div
                          key={evt.id}
                          className={`card event-select-card${!isCompleted && selectedEventId === evt.id ? ' selected' : ''}`}
                          onClick={() => {
                            if (isCompleted) {
                              addToast('This event is completed. Please choose from upcoming events.', 'error', 5000);
                            } else {
                              setSelectedEventId(evt.id);
                            }
                          }}
                          style={isCompleted ? {
                            opacity: 0.45,
                            filter: 'grayscale(60%) brightness(0.75)',
                            cursor: 'not-allowed',
                            boxShadow: '0 0 0 1.5px rgba(100,181,246,0.18), 0 4px 24px rgba(100,181,246,0.10)',
                            background: 'rgba(30,40,70,0.55)',
                            border: '1px solid rgba(100,181,246,0.18)',
                            pointerEvents: 'auto',
                            position: 'relative',
                            overflow: 'hidden',
                          } : {}}
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
                          <div className="card-body" style={{ padding: 'var(--space-4)', position: 'relative', zIndex: 2 }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {evt.name}
                              {isCompleted && <span style={{ fontSize: '0.65rem', background: 'rgba(100,181,246,0.15)', color: '#64b5f6', border: '1px solid rgba(100,181,246,0.25)', borderRadius: '4px', padding: '1px 7px', fontWeight: 600, letterSpacing: '0.04em' }}>COMPLETED</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                              📍 {evt.venue.replace(', Veltech University', '')}<br/>
                              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Veltech University</span><br/>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span>🗓️ {new Date(evt.date).toLocaleDateString()}</span>
                                <WeatherWidget date={evt.date} mini={true} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            );
          })()}

          {/* Split Layout */}
          {!selectedEvent ? (
             <div className="admin-empty">
               <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
               <h3>No Events Found</h3>
               <p>There are currently no active events available for booking.</p>
             </div>
          ) : (
            <div className="split-layout" role="region" aria-label="Event booking section">
              {/* LEFT — Event Details */}
              <EventDetails
                event={selectedEvent}
                availableTickets={selectedEvent?.availableTickets || 0}
                totalTickets={selectedEvent?.totalTickets || 0}
              />

              {/* RIGHT — Form or Summary */}
              {bookingSuccess && bookingDetails ? (
                <BookingSummary
                  bookingDetails={bookingDetails}
                  onBookAnother={handleBookAnother}
                />
              ) : (
                <BookingForm
                  availableTickets={selectedEvent?.availableTickets || 0}
                  pricePerTicket={selectedEvent?.price || 0}
                  eventName={selectedEvent?.name || ''}
                  onBookingSuccess={handleBookingSuccess}
                />
              )}
            </div>
          )}
            </>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="app-footer" role="contentinfo">
          <div style={{ marginBottom: '12px' }}>
            <img 
              src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" 
              alt="Veltech University" 
              className="veltech-logo-img footer-logo"
              style={{ margin: '0 auto' }}
            />
          </div>
          <p>
            Built with ❤️ by <span>EventX</span> for <strong style={{ color: 'var(--accent-purple)' }}>VELTECH UNIVERSITY</strong> &nbsp;·&nbsp; Logged in as{' '}
            <span>{user?.role}</span> &nbsp;·&nbsp; © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
      {/* ── EventX AI Chatbot (Innovation Module) ── */}
      <Chatbot events={activeEvents} bookings={bookings} role={user?.role} user={user} allDepartments={DEPARTMENTS} />
    </div>
  );
};

// ── Root App: Routes ─────────────────────────────────────
const App = () => {
  const { user } = useAuth();
  
  // Custom Protected Route to handle Admin vs Dashboard routing
  const HomeRoute = () => {
    if (!user) return <Navigate to="/register" replace />;
    if (user.role === 'admin') return <AdminDashboard onToast={() => {}} />;
    return <Dashboard />;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/admin-login"
        element={
          <GuestRoute>
            <AdminLogin />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={<HomeRoute />}
      />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
