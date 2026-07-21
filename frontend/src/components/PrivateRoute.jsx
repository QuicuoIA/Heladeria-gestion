// ============================================================
// ARCHIVO: frontend/src/components/PrivateRoute.jsx
// DESCRIPCIÓN: Guarda de ruta — verifica autenticación y rol.
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {object} props
 * @param {string[]} [props.roles=[]] - Roles permitidos. Array vacío = cualquier rol.
 * @param {React.ReactNode} props.children
 */
const PrivateRoute = ({ roles = [], children }) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/pos" replace />;
  }

  return children;
};

export default PrivateRoute;
