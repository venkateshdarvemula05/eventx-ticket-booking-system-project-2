import React from 'react';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from '../components/WeatherWidget';

const MyTickets = ({ onBack, addToast }) => {
  const { bookings, events, cancelBooking } = useEvents();
  const { user } = useAuth();

  // Filter bookings for the current user (match by email)
  const myBookings = bookings.filter(
    (b) => b.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  // Enrich bookings with event data
  const enriched = myBookings.map((b) => {
    const evt = events.find((e) => e.id === b.eventId);
    return { ...b, event: evt || null };
  });

  // Split into upcoming vs past
  const now = new Date();
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  const upcomingTickets = enriched.filter(
    (b) => b.event && b.event.date >= todayStr
  );
  const pastTickets = enriched.filter(
    (b) => b.event && b.event.date < todayStr
  );

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadPdf = (ticket) => {
    if (addToast) addToast('Generating your ticket PDF...', 'info', 3000);
    
    // Dynamic imports for PDF and QR code generation
    Promise.all([
      import('jspdf'),
      import('qrcode')
    ]).then(async ([jspdfModule, qrcodeModule]) => {
      try {
        // Handle different export patterns for different build environments
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
        const QRCode = qrcodeModule.default || qrcodeModule;

        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [200, 120],
        });

        // Background (Page)
        doc.setFillColor(10, 10, 18);
        doc.rect(0, 0, 200, 120, 'F');

        // Main Ticket Body (Dark)
        doc.setFillColor(15, 15, 28);
        doc.roundedRect(10, 10, 130, 100, 3, 3, 'FD');
        doc.setDrawColor(255, 214, 0); // Gold border
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 130, 100);

        // Side Stub (Vibrant Blue)
        doc.setFillColor(26, 35, 126);
        doc.roundedRect(145, 10, 45, 100, 3, 3, 'FD');

        // Perforation line
        doc.setDrawColor(255, 255, 255);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(142, 10, 142, 110);

        // Add Logo with White Pill Background (CENTERED - TIGHT FIT)
        try {
          const pillWidth = 36;
          const pillHeight = 12;
          const pillX = 75 - (pillWidth / 2);
          const pillY = 14;

          // 1. Always draw the white pill (Reduced padding)
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 6, 6, 'F');

          // 2. Fetch Logo via CORS Proxy
          const getLogoBase64 = async () => {
            try {
              const logoUrl = 'https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png';
              const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(logoUrl)}&output=png`;
              const response = await fetch(proxyUrl);
              if (!response.ok) throw new Error('Proxy failed');
              const blob = await response.blob();
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
            } catch (err) { return null; }
          };

          const base64Data = await getLogoBase64();
          if (base64Data) {
            // Tighter fit for the image inside the pill
            doc.addImage(base64Data, 'PNG', pillX + 2, pillY + 1.5, pillWidth - 4, pillHeight - 3);
          } else {
            // Fallback Text Branding (Centered in pill)
            doc.setTextColor(150, 0, 0);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('VELTECH', 75, pillY + 5, null, null, 'center');
            doc.setFontSize(5);
            doc.text('UNIVERSITY', 75, pillY + 8, null, null, 'center');
          }
        } catch (e) {
          console.error('Logo Rendering Error:', e);
        }

        // Header (Center Aligned - Moved up for better spacing)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('EventX Veltech University', 75, 35, null, null, 'center');

        doc.setFontSize(14);
        doc.setTextColor(255, 214, 0); // Gold
        const evtName = ticket.event?.name || 'Event';
        doc.text(evtName, 75, 44, null, null, 'center');

        // Attendees Section
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTENDEE DETAILS', 15, 60);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(230, 230, 230);
        doc.setFontSize(11);
        
        doc.text(`Attendee 1: ${ticket.name} (Primary)`, 15, 68);
        
        let yPos = 76;
        if (ticket.attendeeNames) {
          try {
            const names = typeof ticket.attendeeNames === 'string' 
              ? JSON.parse(ticket.attendeeNames) 
              : ticket.attendeeNames;
            
            if (Array.isArray(names) && names.length > 0) {
              names.forEach((name, idx) => {
                if (yPos < 100) {
                  doc.text(`Attendee ${idx + 2}: ${name}`, 15, yPos);
                  yPos += 8;
                }
              });
            }
          } catch (e) { console.error(e); }
        }

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Venue: ${ticket.event?.venue || 'N/A'}`, 15, yPos + 4);
        doc.text(`Booking ID: ${ticket.id}`, 15, yPos + 10);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TICKET', 167, 22, null, null, 'center');
        
        try {
          const qrDataUrl = await QRCode.toDataURL(ticket.id, {
            margin: 1,
            color: { dark: '#FFFFFF', light: '#1A237E' }
          });
          doc.addImage(qrDataUrl, 'PNG', 152, 28, 30, 30);
        } catch (err) { console.error('QR Error:', err); }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Qty: ${ticket.ticketsBooked}`, 167, 65, null, null, 'center');
        
        doc.setFontSize(8);
        const splitId = doc.splitTextToSize(`ID: ${ticket.id}`, 40);
        doc.text(splitId, 167, 72, null, null, 'center');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ADMIT ONE', 167, 95, null, null, 'center');
        doc.text('VELTECH', 167, 102, null, null, 'center');

        doc.save(`Ticket_${ticket.id}.pdf`);
        if (addToast) addToast('Ticket PDF downloaded successfully!', 'success', 5000);
      } catch (err) {
        console.error('PDF Generation Error:', err);
        if (addToast) addToast('Failed to generate PDF. Please try again.', 'error', 5000);
      }
    }).catch(err => {
      console.error('Library Load Error:', err);
      if (addToast) addToast('Failed to load PDF libraries.', 'error', 5000);
    });
  };

  const renderTicketCard = (ticket, isPast) => (
    <div
      key={ticket.id}
      className="card"
      style={{
        animation: 'fadeInUp 0.4s ease both',
        opacity: isPast ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ position: 'relative' }}>
        <div
          className="card-banner"
          style={{
            background: isPast
              ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
              : 'var(--gradient-dynamic)',
            height: '60px'
          }}
        />
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
        }}>
          <img 
            src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" 
            alt="Veltech" 
            className="veltech-logo-img"
            style={{ height: '30px', padding: '4px 12px' }}
          />
        </div>
      </div>
      <div className="card-body" style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Event Name */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--text-primary)',
          }}
        >
          {ticket.event?.name || 'Unknown Event'}
        </h3>

        {/* Status badge */}
        <span
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '3px 10px',
            borderRadius: '4px',
            marginBottom: '12px',
            background: isPast
              ? 'rgba(107,114,128,0.15)'
              : 'rgba(16,185,129,0.15)',
            color: isPast ? '#9ca3af' : '#34d399',
          }}
        >
          {isPast ? 'Attended' : 'Upcoming'}
        </span>

        {/* Details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span>📅 {formatDate(ticket.event?.date)}</span>
          {ticket.event && <WeatherWidget date={ticket.event.date} marginTop="8px" />}
          <span>
            📍{' '}
            {ticket.event?.venue?.replace(', Veltech University', '') || 'N/A'}
          </span>
          <span>🎟️ {ticket.ticketsBooked} ticket(s)</span>
          <span>
            💰 ₹{Number(ticket.totalPrice || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Booking ID */}
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}
        >
          🔖 Booking ID: <strong>{ticket.id}</strong>
        </div>

        {/* Add to Calendar */}
        {!isPast && (
          <a 
            href={(function() {
              try {
                const event = ticket.event;
                if (!event) return "#";
                const title = encodeURIComponent(event.name || "Event");
                const details = encodeURIComponent(`Event at ${event.venue || 'Veltech University'}`);
                const location = encodeURIComponent(`${event.venue || 'Veltech University'}`);
                const dateStr = event.date;
                const timeStr = event.time || '00:00';
                let timePart = timeStr.trim().toUpperCase();
                let [h, m] = timePart.split(':');
                let hour = parseInt(h);
                if (timePart.includes('PM') && hour < 12) hour += 12;
                if (timePart.includes('AM') && hour === 12) hour = 0;
                const hStr = String(hour || 0).padStart(2, '0');
                const mStr = String(m || '00').substring(0, 2).padStart(2, '0');
                const startDateObj = new Date(`${dateStr}T${hStr}:${mStr}:00`);
                if (isNaN(startDateObj.getTime())) return "#";
                const start = startDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
                const endDateObj = new Date(startDateObj.getTime() + (2 * 60 * 60 * 1000));
                const end = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
                return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
              } catch (e) { return "#"; }
            })()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-calendar"
            style={{ 
              background: 'rgba(26, 35, 126, 0.2)', 
              border: '1px solid rgba(255, 214, 0, 0.3)', 
              color: '#ffd600',
              padding: '8px 12px',
              fontSize: '0.75rem',
              marginBottom: '12px',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600
            }}
          >
            <span>📅</span> Add to Google Calendar
          </a>
        )}

        {/* Download & Delete Row */}
        {!isPast && (
          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <button
              onClick={() => handleDownloadPdf(ticket)}
              style={{
                flex: 1,
                height: '48px',
                padding: '0',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                color: '#fff',
                border: '1px solid transparent',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => {
                if (window.confirm('⚠️ Are you sure you want to delete this booking?')) {
                  cancelBooking(ticket.id, 'user').then(res => {
                    if (res.success) {
                      if (addToast) addToast('Your tickets have been successfully cancelled. A refund has been initiated to your original payment method, and a confirmation email has been sent.', 'success', 5000);
                    } else {
                      if (addToast) addToast('Failed to cancel booking. Please try again.', 'error', 5000);
                    }
                  });
                }
              }}
              style={{
                flex: 1,
                height: '48px',
                padding: '0',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Delete Booking"
            >
              🗑️
            </button>
          </div>
        )}

        {/* Delete option for past events (history cleanup) */}
        {isPast && (
           <div style={{ marginTop: 'auto' }}>
            <button
              onClick={() => {
                if (window.confirm('🗑️ Delete this booking from your history?')) {
                  cancelBooking(ticket.id, 'user').then(res => {
                    if (res.success) {
                      if (addToast) addToast('Booking removed from history.', 'info', 5000);
                    }
                  });
                }
              }}
              style={{
                width: '100%',
                height: '40px',
                padding: '0',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🗑️ Clear from History
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.88rem',
          marginBottom: '24px',
          transition: 'all 0.2s ease',
        }}
      >
        ← Back to Events
      </button>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          fontWeight: 800,
          marginBottom: '8px',
          background: 'var(--gradient-text)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        My Tickets
      </h2>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
        }}
      >
        All your booked event tickets in one place.
      </p>

      {enriched.length === 0 ? (
        <div className="admin-empty">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</div>
          <h3>No Tickets Yet</h3>
          <p>
            You haven't booked any tickets yet. Browse events and book your
            first ticket!
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Tickets */}
          {upcomingTickets.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '1.2rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                }}
              >
                🎯 Upcoming Tickets{' '}
                <span
                  style={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    marginLeft: '8px',
                  }}
                >
                  ({upcomingTickets.length})
                </span>
              </h3>
              <div className="event-select-grid">
                {upcomingTickets.map((t) => renderTicketCard(t, false))}
              </div>
            </div>
          )}

          {/* Past Tickets */}
          {pastTickets.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px',
                }}
              >
                📜 Past Events Attended{' '}
                <span
                  style={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    marginLeft: '8px',
                  }}
                >
                  ({pastTickets.length})
                </span>
              </h3>
              <div className="event-select-grid">
                {pastTickets.map((t) => renderTicketCard(t, true))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTickets;
