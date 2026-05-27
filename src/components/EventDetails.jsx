import React, { useState, useEffect } from 'react';
import VenueMap from './VenueMap';
import WeatherWidget from './WeatherWidget';

const EventDetails = ({ event, availableTickets, totalTickets }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!event || !event.date) return;

    const parseDateTime = (dateStr, timeStr) => {
      try {
        if (!dateStr) return new Date(NaN);
        // Normalize time
        let timePart = (timeStr || '00:00').trim().toUpperCase();
        let [h, m] = timePart.split(':');
        let hour = parseInt(h);
        if (timePart.includes('PM') && hour < 12) hour += 12;
        if (timePart.includes('AM') && hour === 12) hour = 0;
        
        const hStr = String(hour || 0).padStart(2, '0');
        const mStr = String(m || '00').substring(0, 2).padStart(2, '0');
        
        return new Date(`${dateStr}T${hStr}:${mStr}:00`);
      } catch (e) {
        return new Date(NaN);
      }
    };

    const calculateTimeLeft = () => {
      const eventDate = parseDateTime(event.date, event.time);
      
      if (isNaN(eventDate.getTime())) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const difference = +eventDate - +new Date();
      
      if (difference > 0) {
        setIsExpired(false);
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [event?.date, event?.time]);

  if (!event) return null;

  const soldPercent = totalTickets > 0 
    ? Math.round(((totalTickets - availableTickets) / totalTickets) * 100)
    : 0;

  const availablePercent = totalTickets > 0 
    ? Math.round((availableTickets / totalTickets) * 100)
    : 0;

  const getAvailabilityColor = () => {
    if (availablePercent > 50) return '#34d399';
    if (availablePercent > 20) return '#f59e0b';
    return '#f87171';
  };

  const getCalendarUrl = () => {
    try {
      const title = encodeURIComponent(event.name || "Event");
      const details = encodeURIComponent(event.description || `Event at ${event.venue || 'Veltech University'}`);
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
      // End date 2 hours later
      const endDateObj = new Date(startDateObj.getTime() + (2 * 60 * 60 * 1000));
      const end = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
      
      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    } catch (e) {
      return "#";
    }
  };

  return (
    <div className="card card-left">
      <div className="card-banner" style={{ background: 'var(--gradient-dynamic)' }} />
      <div className="card-body">

        {/* Section Label */}
        <div className="section-label">
          <span>🎪</span>
          <span>Event Details</span>
        </div>

        {/* Countdown Timer */}
        {!isExpired && (
          <div className="countdown-container">
            <div className="countdown-item">
              <span className="countdown-value" style={{ color: '#ffd600' }}>{String(timeLeft.days || 0).padStart(2, '0')}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value" style={{ color: '#ffd600' }}>{String(timeLeft.hours || 0).padStart(2, '0')}</span>
              <span className="countdown-label">Hrs</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value" style={{ color: '#ffd600' }}>{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
              <span className="countdown-label">Min</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value" style={{ color: '#ffd600' }}>{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
              <span className="countdown-label">Sec</span>
            </div>
          </div>
        )}

        {/* Event Icon */}
        <div className="event-icon-wrap" aria-hidden="true" style={{ background: 'var(--gradient-dynamic)' }}>🎓</div>

        {/* Event Name */}
        <h2 className="event-name" style={{ background: 'var(--gradient-dynamic)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{event.name}</h2>

        {/* Department Badge */}
        <div className="event-dept" style={{ background: 'rgba(var(--accent-dynamic-rgb), 0.1)', borderColor: 'rgba(var(--accent-dynamic-rgb), 0.3)', color: 'var(--accent-dynamic)' }}>
          <span>🏛️</span>
          <span>{event.department}</span>
        </div>

        {/* Info Grid */}
        <div className="event-info-grid">
          <div className="info-item">
            <span className="info-label">
              <span>📅</span> Date
            </span>
            <span className="info-value">{event.date}</span>
          </div>

          <div className="info-item">
            <span className="info-label">
              <span>🕐</span> Time
            </span>
            <span className="info-value">{event.time}</span>
          </div>

          {/* Weather Widget moved here */}
          <div style={{ gridColumn: '1 / -1' }}>
            <WeatherWidget date={event.date} />
          </div>

          <div className="info-item" style={{ gridColumn: '1 / -1' }}>
            <span className="info-label">
              <span>📍</span> Venue
            </span>
            <div className="info-value">
              <div>{event.venue ? event.venue.replace(', Veltech University', '') : 'TBD'}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px', fontWeight: 500 }}>Veltech University</div>
            </div>
          </div>
        </div>

        {/* Add to Calendar Button */}
        <a 
          href={getCalendarUrl()} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-calendar"
          style={{ background: '#1a237e', border: '1px solid #ffd600', color: '#ffd600' }}
        >
          📅 Add to Google Calendar
        </a>

        <div style={{ margin: '20px 0' }}></div>

        {/* Ticket Availability */}
        <div className="ticket-availability" style={{ background: 'rgba(var(--accent-dynamic-rgb), 0.07)', borderColor: 'rgba(var(--accent-dynamic-rgb), 0.2)' }}>
          <div className="ticket-count">
            <span
              className="ticket-number"
              style={{ color: getAvailabilityColor() }}
              aria-label={`${availableTickets} tickets available`}
            >
              {availableTickets}
            </span>
            <span className="ticket-label">Tickets Left</span>
          </div>

          <div className="ticket-progress-wrap">
            <div className="ticket-progress-label">
              <span>{soldPercent}% Sold</span>
              <span>{availablePercent}% Available</span>
            </div>
            <div
              className="ticket-progress-bar"
              role="progressbar"
              aria-valuenow={availableTickets}
              aria-valuemin={0}
              aria-valuemax={totalTickets}
              aria-label="Ticket availability"
            >
              <div
                className="ticket-progress-fill"
                style={{ width: `${availablePercent}%`, background: 'var(--gradient-dynamic)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                0
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {totalTickets} total
              </span>
            </div>
          </div>
        </div>

        {/* Price Badge */}
        <div className="price-badge" aria-label={`Ticket price: ₹${event.price}`} style={{ background: 'var(--gradient-dynamic)' }}>
          <span className="price-tag">Per Ticket</span>
          <span className="price-value">₹{Number(event.price || 0).toLocaleString('en-IN')}</span>
        </div>


        {/* ── Venue Map (Innovation: Leaflet.js Maps) ── */}
        <VenueMap venue={event.venue} />

      </div>
    </div>
  );
};

export default EventDetails;
