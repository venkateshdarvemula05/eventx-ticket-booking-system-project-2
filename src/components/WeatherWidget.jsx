import React, { useEffect, useState } from 'react';

const LAT = 13.0694;
const LON = 80.1601;

const WMO_CODES = {
  0: { label: 'Clear Sky', emoji: '☀️' }, 1: { label: 'Mostly Clear', emoji: '🌤️' },
  2: { label: 'Partly Cloudy', emoji: '⛅' }, 3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' }, 51: { label: 'Light Drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' }, 61: { label: 'Slight Rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' }, 65: { label: 'Heavy Rain', emoji: '⛈️' },
  80: { label: 'Rain Showers', emoji: '🌦️' }, 81: { label: 'Showers', emoji: '🌧️' },
  82: { label: 'Heavy Showers', emoji: '⛈️' }, 95: { label: 'Thunderstorm', emoji: '⛈️' },
};

function getAdvice(rainProb, code) {
  if (rainProb > 60 || [65,80,81,82,95].includes(code))
    return { text: 'Heavy rain expected — carry an umbrella ☂️', color: '#60a5fa' };
  if (rainProb > 30 || [51,53,61,63].includes(code))
    return { text: 'Light rain possible — be prepared 🌂', color: '#93c5fd' };
  if ([0,1].includes(code))
    return { text: 'Clear skies — perfect event weather! 🎉', color: '#34d399' };
  return { text: 'Mild weather — great for the event 👍', color: '#a3e635' };
}

const WeatherWidget = ({ date, marginTop = '16px', mini = false }) => {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!date) { setStatus('error'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date); eventDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((eventDate - today) / 86400000);
    
    // Stable Mock Seed Logic
    const getSeed = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };

    const getSeasonalMock = (dateStr) => {
      const d = new Date(dateStr);
      const month = d.getMonth();
      const seed = getSeed(dateStr);
      const rand = (min, max) => min + (seed % (max - min + 1));
      
      let mCode, mMax, mMin, mRain;

      if (month <= 1) { // Jan-Feb: Winter
        mMax = rand(27, 30); mMin = rand(19, 23); mRain = rand(0, 5);
        mCode = [0, 1, 2][seed % 3];
      } else if (month >= 2 && month <= 5) { // Mar-Jun: Summer
        mMax = rand(34, 40); mMin = rand(26, 30); mRain = rand(0, 10);
        mCode = [0, 1][seed % 2];
      } else if (month >= 6 && month <= 8) { // Jul-Sep: Pre-Monsoon
        mMax = rand(31, 35); mMin = rand(25, 28); mRain = rand(15, 45);
        mCode = [2, 3, 51, 61, 80][seed % 5];
      } else { // Oct-Dec: Monsoon
        mMax = rand(27, 31); mMin = rand(23, 26); mRain = rand(50, 95);
        mCode = [63, 65, 81, 82, 95][seed % 5];
      }

      return {
        max: mMax, min: mMin, rainProb: mRain,
        condition: WMO_CODES[mCode] || { label: 'Unknown', emoji: '🌡️' },
        code: mCode, isToday: false, isMock: true,
        isPast: diffDays < 0
      };
    };

    // If it's more than 15 days away OR it's in the past, use seasonal logic
    if (diffDays > 15 || diffDays < 0) {
      setWeather(getSeasonalMock(date));
      setStatus('ready');
      return;
    }

    // Otherwise use real-time forecast
    const ds = eventDate.toISOString().split('T')[0];
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&start_date=${ds}&end_date=${ds}`)
      .then(r => r.json())
      .then(data => {
        const d = data.daily;
        if (!d || !d.time?.length) { setStatus('error'); return; }
        const code = d.weathercode[0];
        setWeather({ 
          max: Math.round(d.temperature_2m_max[0]), 
          min: Math.round(d.temperature_2m_min[0]), 
          rainProb: d.precipitation_probability_max[0] ?? 0, 
          condition: WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️' }, 
          code, 
          isToday: diffDays === 0, 
          isMock: false,
          isPast: false
        });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [date]);

  if (mini) {
    if (status !== 'ready' || !weather) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <span>{weather.condition.emoji}</span>
        <span>{weather.max}°C</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <span>🌤️</span><span>Weather on Event Day</span>
      </div>
      {status === 'loading' && (
        <div style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetching weather forecast…</span>
        </div>
      )}
      {status === 'error' && (
        <div style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🌐 Weather data unavailable.
        </div>
      )}
      {status === 'ready' && weather && (() => {
        const advice = getAdvice(weather.rainProb, weather.code);
        const label = weather.isPast ? '📜 Historical Record' : (weather.isMock ? '🔮 Seasonal Prediction' : '📡 Real-time Forecast');
        
        return (
          <div style={{ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.06)', padding: '16px 18px', animation: 'fadeInUp 0.4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{weather.condition.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{weather.max}°C</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {weather.min}°C</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  {weather.condition.label}
                  {weather.isToday && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '100px', padding: '1px 8px', fontWeight: 700 }}>TODAY</span>}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{weather.rainProb}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>☔ Rain</div>
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: advice.color, fontWeight: 600, borderLeft: `3px solid ${advice.color}` }}>
              {advice.text}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
              {label} · Veltech University, Chennai
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default WeatherWidget;
