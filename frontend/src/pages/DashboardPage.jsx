// ============================================================
// ARCHIVO: frontend/src/pages/DashboardPage.jsx
// DESCRIPCIÓN: Dashboard administrativo con gráficas y métricas
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const COLORES_PIE = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6'];

const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

const DashboardPage = () => {
  const { usuario, logout } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);

  const [resumenHoy, setResumenHoy] = useState(null);
  const [sabores, setSabores] = useState([]);
  const [totalMensual, setTotalMensual] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const cerrarToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const cargarTodo = async () => {
      setCargando(true);
      try {
        const [rHoy, rSabores, rMensual, rCategorias, rAlertas] = await Promise.all([
          api.get('/dashboard/resumen-hoy'),
          api.get('/dashboard/sabores-vendidos?dias=7'),
          api.get('/dashboard/total-mensual'),
          api.get('/dashboard/ventas-por-categoria?dias=7'),
          api.get('/inventario/alertas')
        ]);

        setResumenHoy(rHoy.data.resumen);
        setSabores(rSabores.data.sabores || []);
        setTotalMensual(rMensual.data.dias || []);
        setCategorias(rCategorias.data.categorias || []);
        setAlertas(rAlertas.data.alertas || []);
      } catch {
        setToast({ message: 'Error al cargar el dashboard.', type: 'error' });
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, []);

  const descargar = async (endpoint, filename) => {
    try {
      const { data } = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: 'Error al descargar el archivo.', type: 'error' });
    }
  };

  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const fechaHoy = hoy.toISOString().slice(0, 10);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm mt-4">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />
      )}

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍦</span>
          <h1 className="text-white font-bold text-lg">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">👤 {usuario?.nombre}</span>
          <button onClick={logout} className="text-slate-400 hover:text-rose-400 text-sm transition-colors">
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ── Cards de resumen ─────────────────────────── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">📊 Resumen de hoy</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ventas',        value: resumenHoy?.num_ventas ?? 0,             suffix: '',  icon: '🧾', color: 'from-cyan-500 to-cyan-700' },
              { label: 'Total del día', value: fmt(resumenHoy?.total_dia),              suffix: '',  icon: '💰', color: 'from-emerald-500 to-emerald-700' },
              { label: 'Efectivo',      value: fmt(resumenHoy?.efectivo),               suffix: '',  icon: '💵', color: 'from-violet-500 to-violet-700' },
              { label: 'Transferencia', value: fmt(resumenHoy?.transferencia),          suffix: '',  icon: '📲', color: 'from-amber-500 to-amber-700' },
            ].map(card => (
              <div
                key={card.label}
                className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 shadow-lg`}
              >
                <div className="text-2xl mb-1">{card.icon}</div>
                <div className="text-white/80 text-xs font-medium uppercase tracking-wider">{card.label}</div>
                <div className="text-white text-2xl font-extrabold mt-1">{card.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Gráfica de barras: ventas por día ─────── */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-white font-bold text-base mb-4">📅 Ventas por día (mes actual)</h2>
          {totalMensual.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Sin datos este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={totalMensual} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="dia"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(d) => d ? String(d).slice(8) : ''}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Total']}
                />
                <Bar dataKey="total_dia" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Total día" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Gráfica de pie: ventas por categoría ── */}
          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-bold text-base mb-4">🥧 Ventas por categoría (7 días)</h2>
            {categorias.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Sin datos.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorias}
                    dataKey="total_dinero"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ categoria, percent }) =>
                      `${categoria} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categorias.map((_, i) => (
                      <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Total']}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* ── Top sabores ───────────────────────────── */}
          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-bold text-base mb-4">🏆 Top sabores (7 días)</h2>
            {sabores.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Sin ventas en los últimos 7 días.</p>
            ) : (
              <div className="space-y-2">
                {sabores.map((s, i) => (
                  <div
                    key={s.id_producto || i}
                    className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-4 py-2.5"
                  >
                    <span className="text-cyan-400 font-bold w-5 text-sm">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {s.nombre}
                        {s.tamanio && <span className="text-slate-400 text-xs ml-1">({s.tamanio})</span>}
                      </p>
                      <p className="text-slate-400 text-xs">{s.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 text-sm font-bold">{s.total_piezas} pzs</p>
                      <p className="text-slate-400 text-xs">{fmt(s.total_dinero)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Alertas de stock ──────────────────────── */}
        {alertas.length > 0 && (
          <section className="bg-slate-800 rounded-2xl p-6 border border-rose-500/30">
            <h2 className="text-rose-400 font-bold text-base mb-4">⚠️ Alertas de stock bajo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 font-medium">Producto</th>
                    <th className="text-right pb-3 font-medium">Actual</th>
                    <th className="text-right pb-3 font-medium">Mínimo</th>
                    <th className="text-right pb-3 font-medium">Faltante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {alertas.map((a) => (
                    <tr key={a.id_inventario} className="bg-rose-950/20">
                      <td className="py-2.5">
                        <span className="text-white font-medium">{a.nombre}</span>
                        {a.tamanio && <span className="text-slate-400 text-xs ml-1">({a.tamanio})</span>}
                        <div className="text-slate-500 text-xs">{a.categoria}</div>
                      </td>
                      <td className="text-right text-amber-400 font-bold py-2.5">{a.cantidad_actual}</td>
                      <td className="text-right text-slate-400 py-2.5">{a.cantidad_minima}</td>
                      <td className="text-right py-2.5">
                        <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full text-xs font-bold">
                          -{a.faltante}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Botones de descarga ───────────────────── */}
        <section className="flex gap-4 flex-wrap">
          <button
            id="btn-descargar-excel"
            onClick={() => descargar(`/reportes/excel?mes=${mes}&anio=${anio}`, `reporte_${anio}_${String(mes).padStart(2,'0')}.xlsx`)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold
                       px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            📥 Descargar Excel
          </button>
          <button
            id="btn-descargar-pdf"
            onClick={() => descargar(`/reportes/pdf?fecha=${fechaHoy}`, `reporte_${fechaHoy}.pdf`)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold
                       px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-600/20"
          >
            📄 Descargar PDF
          </button>
        </section>

      </div>
    </div>
  );
};

export default DashboardPage;
