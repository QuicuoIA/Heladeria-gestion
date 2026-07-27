// ============================================================
// ARCHIVO: frontend/src/pages/POSPage.jsx
// DESCRIPCIÓN: Punto de venta — catálogo + carrito + cobro
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const POSPage = () => {
  const { usuario, logout } = useAuth();
  const { items, agregar, eliminar, limpiar, total } = useCart();

  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [cargandoCobro, setCargandoCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  const cerrarToast = useCallback(() => setToast(null), []);

  // ── Estado de conexión ────────────────────────────────────
  useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Cargar catálogo ───────────────────────────────────────
  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        setCargandoCatalogo(true);
        const { data } = await api.get('/catalogo');
        // Agrupar por categoría
        const agrupado = {};
        const productos = data.productos || data.catalogo || data || [];
        productos.forEach(p => {
          const cat = p.categoria || p.nombre_categoria || 'General';
          if (!agrupado[cat]) agrupado[cat] = [];
          agrupado[cat].push(p);
        });
        setCatalogo(agrupado);
      } catch {
        setToast({ message: 'Error al cargar el catálogo.', type: 'error' });
      } finally {
        setCargandoCatalogo(false);
      }
    };
    cargarCatalogo();
  }, []);

  // ── Cobrar ────────────────────────────────────────────────
  const handleCobrar = async () => {
    if (items.length === 0 || cargandoCobro) return;
    setCargandoCobro(true);

    try {
      const promesas = items.map(item =>
        api.post('/ventas', {
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          metodo_pago: metodoPago
        })
      );

      await Promise.all(promesas);
      limpiar();
      setToast({ message: '✅ Venta registrada correctamente.', type: 'success' });
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error al registrar la venta.';
      setToast({ message: mensaje, type: 'error' });
    } finally {
      setCargandoCobro(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />
      )}

      {/* Banner sin conexión */}
      {!online && (
        <div className="bg-amber-500 text-slate-900 text-center py-2 px-4 text-sm font-semibold z-40">
          ⚠️ Sin conexión — Reconectando...
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍦</span>
          <h1 className="text-white font-bold text-lg">QuicuoIA POS</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            👤 {usuario?.nombre}
          </span>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-400 text-sm transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Panel izquierdo: Catálogo ─────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {cargandoCatalogo ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            Object.entries(catalogo).map(([categoria, productos]) => (
              <section key={categoria} className="mb-8">
                <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">
                  {categoria}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {productos.map(p => (
                    <button
                      key={p.id_producto}
                      id={`producto-${p.id_producto}`}
                      onClick={() => agregar({
                        id_producto: p.id_producto,
                        nombre: p.nombre,
                        tamanio: p.tamanio,
                        precio: parseFloat(p.precio),
                        cantidad: 1
                      })}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500/50
                                 rounded-2xl p-4 text-left transition-all duration-150 active:scale-95 group"
                    >
                      <div className="text-white font-semibold text-sm leading-tight group-hover:text-cyan-300 transition-colors">
                        {p.nombre}
                      </div>
                      {p.tamanio && (
                        <div className="text-slate-500 text-xs mt-0.5">{p.tamanio}</div>
                      )}
                      <div className="text-cyan-400 font-bold text-base mt-2">
                        ${parseFloat(p.precio).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* ── Panel derecho: Carrito ────────────────────── */}
        <aside className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-white font-bold text-base">🛒 Carrito</h2>
          </div>

          {/* Lista de items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-8">
                Agrega productos del catálogo
              </p>
            ) : (
              items.map(item => (
                <div
                  key={item.id_producto}
                  className="bg-slate-700/50 rounded-xl p-3 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {item.nombre}
                      {item.tamanio && <span className="text-slate-400 text-xs ml-1">({item.tamanio})</span>}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {item.cantidad} × ${parseFloat(item.precio).toFixed(2)}
                    </p>
                    <p className="text-cyan-400 text-sm font-bold">
                      ${(item.cantidad * parseFloat(item.precio)).toFixed(2)}
                    </p>
                  </div>
                  <button
                    id={`eliminar-${item.id_producto}`}
                    onClick={() => eliminar(item.id_producto)}
                    className="text-slate-500 hover:text-rose-400 transition-colors text-lg leading-none"
                    aria-label="Eliminar item"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer: total + método de pago + cobrar */}
          <div className="p-4 border-t border-slate-700 space-y-3">
            {/* Total */}
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 text-sm">Total</span>
              <span className="text-white text-2xl font-extrabold">
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Método de pago */}
            <select
              id="select-metodo-pago"
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-cyan-500"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">📲 Transferencia</option>
            </select>

            {/* Botón cobrar */}
            <button
              id="btn-cobrar"
              onClick={handleCobrar}
              disabled={items.length === 0 || cargandoCobro}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed
                         text-white font-bold py-3 rounded-2xl transition-all duration-150 active:scale-95
                         shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {cargandoCobro
                ? <><Spinner size="sm" color="border-white" /> Procesando...</>
                : '💳 Cobrar'
              }
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default POSPage;
