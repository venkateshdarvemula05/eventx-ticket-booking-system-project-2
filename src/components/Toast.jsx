import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', duration = 5000, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration - 350);
    const closeTimer = setTimeout(() => onClose(), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      className={`toast toast-${type}${exiting ? ' toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon" style={{ fontSize: '1.8rem' }}>{icons[type]}</span>
      <span className="toast-text" style={{ fontSize: '1rem', fontWeight: 600 }}>{message}</span>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container" aria-label="Notifications">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </div>
);

export default Toast;
