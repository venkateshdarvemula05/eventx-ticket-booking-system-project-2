import React, { useEffect, useRef, useState } from 'react';

// Pre-mapped coordinates for Veltech University venues (Chennai, Tamil Nadu)
const VENUE_COORDS = {
  'main auditorium': [13.0694, 80.1601],
  'auditorium': [13.0694, 80.1601],
  'innovation hub': [13.0698, 80.1608],
  'innovation': [13.0698, 80.1608],
  'sports complex': [13.0688, 80.1615],
  'sports': [13.0688, 80.1615],
  'cse block': [13.0702, 80.1597],
  'computer science': [13.0702, 80.1597],
  'seminar hall': [13.0700, 80.1605],
  'conference hall': [13.0697, 80.1610],
  'open air': [13.0690, 80.1612],
  'amphitheatre': [13.0690, 80.1612],
  'library': [13.0696, 80.1600],
  'admin block': [13.0693, 80.1598],
  'lab': [13.0703, 80.1602],
  'workshop hall': [13.0699, 80.1614],
  'ece block': [13.0701, 80.1607],
  'mechanical': [13.0695, 80.1618],
  'civil': [13.0692, 80.1620],
  'mba block': [13.0706, 80.1595],
  'ai lab': [13.0704, 80.1604],
  'data science': [13.0705, 80.1599],
};

// Fallback: Veltech University main gate
const DEFAULT_COORDS = [13.0694, 80.1601];

function resolveCoords(venue) {
  if (!venue) return DEFAULT_COORDS;
  const lower = venue.toLowerCase();
  for (const [key, coords] of Object.entries(VENUE_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return DEFAULT_COORDS;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }

    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load JS
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

const VenueMap = ({ venue }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;

        // Destroy previous map instance if re-rendering
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const coords = resolveCoords(venue);

        const map = L.map(mapRef.current, {
          center: coords,
          zoom: 17,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom marker icon
        const markerIcon = L.divIcon({
          className: '',
          html: `<div style="
            background: linear-gradient(135deg, #7c3aed, #3b82f6);
            border: 3px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 32px; height: 32px;
            box-shadow: 0 4px 15px rgba(124,58,237,0.6);
            display: flex; align-items: center; justify-content: center;
          ">
            <span style="transform:rotate(45deg);font-size:14px;">📍</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36],
        });

        const venueName = venue ? venue.replace(', Veltech University', '') : 'Veltech University';
        L.marker(coords, { icon: markerIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:'Segoe UI',sans-serif;min-width:160px;">
              <strong style="font-size:0.95rem;">📍 ${venueName}</strong><br/>
              <span style="font-size:0.78rem;color:#666;">Veltech University<br/>Chennai, Tamil Nadu</span>
            </div>`,
            { maxWidth: 220 }
          )
          .openPopup();

        mapInstanceRef.current = map;
        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    setStatus('loading');
    init();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [venue]);

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '10px',
        fontSize: '0.82rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '1px',
      }}>
        <span style={{ fontSize: '1rem' }}>🗺️</span>
        <span>Venue Location</span>
      </div>

      {/* Map Container */}
      <div style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(124,58,237,0.25)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        position: 'relative',
        height: '220px',
        background: '#0f0f1a',
      }}>
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,10,18,0.85)', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{
              width: '28px', height: '28px', border: '3px solid rgba(124,58,237,0.3)',
              borderTopColor: '#7c3aed', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading map…</span>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,10,18,0.9)', flexDirection: 'column', gap: '8px',
          }}>
            <span style={{ fontSize: '2rem' }}>🗺️</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Map unavailable offline</span>
          </div>
        )}

        <div
          ref={mapRef}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />
      </div>

      {/* Caption */}
      <p style={{
        fontSize: '0.72rem', color: 'var(--text-muted)',
        margin: '6px 0 0', textAlign: 'center', lineHeight: 1.4,
      }}>
        📍 {venue ? venue.replace(', Veltech University', '') : 'Veltech University'} · Veltech University, Chennai
      </p>
    </div>
  );
};

export default VenueMap;
