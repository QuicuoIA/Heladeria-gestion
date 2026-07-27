// ============================================================
// ARCHIVO: frontend/src/pages/LoginPage.jsx
// DESCRIPCIÓN: Pantalla de login con teclado numérico tipo POS
// ============================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const MAX_PIN = 6;

const LoginPage = () => {
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const cerrarToast = useCallback(() => setToast(null), []);

  const handleDigit = (digit) => {
    if (pin.length < MAX_PIN) {
      setPin(prev => prev + digit);
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleConfirm = async () => {
    if (pin.length < 4) {
      setToast({ message: 'El PIN debe tener al menos 4 dígitos.', type: 'error' });
      return;
    }
    setCargando(true);
    const result = await login(pin);
    setCargando(false);

    if (result.success) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      if (usuario.rol === 'empleado') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setToast({ message: result.mensaje, type: 'error' });
      setPin('');
    }
  };

  const teclado = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['DEL', '0', '✓']
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />
      )}

      <div className="w-full max-w-sm">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍦</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">QuicuoIA</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de gestión para nevería</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <p className="text-center text-slate-300 text-sm font-medium mb-5">
            Ingresa tu PIN de acceso
          </p>

          {/* Indicador de PIN */}
          <div className="flex justify-center gap-3 mb-7" aria-label="PIN ingresado">
            {Array.from({ length: MAX_PIN }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-cyan-400 scale-110'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Teclado numérico */}
          <div className="grid gap-3">
            {teclado.map((fila, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-3">
                {fila.map((tecla) => {
                  const esConfirmar = tecla === '✓';
                  const esBorrar = tecla === 'DEL';

                  return (
                    <button
                      key={tecla}
                      id={`btn-pin-${tecla === '✓' ? 'confirm' : tecla === 'DEL' ? 'delete' : tecla}`}
                      onClick={() => {
                        if (esConfirmar) handleConfirm();
                        else if (esBorrar) handleDelete();
                        else handleDigit(tecla);
                      }}
                      disabled={cargando}
                      className={`
                        h-14 rounded-2xl text-lg font-bold transition-all duration-150
                        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${esConfirmar
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30'
                          : esBorrar
                          ? 'bg-slate-600 hover:bg-slate-500 text-rose-300'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }
                      `}
                    >
                      {cargando && esConfirmar
                        ? <div className="flex justify-center"><Spinner size="sm" /></div>
                        : tecla
                      }
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          QuicuoIA v1.0 — Nevería
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
