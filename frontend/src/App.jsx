// ============================================================
// ARCHIVO: frontend/src/App.jsx
// DESCRIPCIÓN: Raíz de la aplicación — rutas y providers
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* POS — cualquier usuario autenticado */}
            <Route
              path="/pos"
              element={
                <PrivateRoute>
                  <POSPage />
                </PrivateRoute>
              }
            />

            {/* Dashboard — solo dueño y encargado */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={['dueno', 'encargado']}>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* Ruta raíz → login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Cualquier otra ruta → login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
