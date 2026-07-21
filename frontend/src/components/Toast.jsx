// ============================================================
// ARCHIVO: frontend/src/components/Toast.jsx
// DESCRIPCIÓN: Notificación temporal (3s) con tipo success/error
// ============================================================

import { useEffect } from 'react';

/**
 * @param {object} props
 * @param {string} props.message
 * @param {'success'|'error'} props.type
 * @param {() => void} props.onClose
 */
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const base =
    'fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-fade-in max-w-sm';

  const color =
    type === 'success'
      ? 'bg-emerald-600 border border-emerald-400'
      : 'bg-rose-600 border border-rose-400';

  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={`${base} ${color}`} role="alert">
      <span className="text-lg">{icon}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-white/70 hover:text-white transition-colors text-lg leading-none"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
