import React, { useEffect, useState } from 'react';

const Toast = ({ id, type, message, duration = 5000, onRemove }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration - 500);

    const dismissTimer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'info': return 'fa-info-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-success border-success text-success';
      case 'error': return 'bg-danger border-danger text-danger';
      case 'warning': return 'bg-warning border-warning text-warning';
      default: return 'bg-info border-info text-info';
    }
  };

  if (!visible) return null;

  return (
    <div className={`toast-notification premium-card p-4 mb-3 shadow-lg transform transition-all duration-300 ${getColors()}`}>
      <div className="flex items-start gap-3">
        <i className={`fas ${getIcon()} text-xl mt-0.5 flex-shrink-0`}></i>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{message}</p>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="ml-2 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;