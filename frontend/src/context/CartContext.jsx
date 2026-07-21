// ============================================================
// ARCHIVO: frontend/src/context/CartContext.jsx
// DESCRIPCIÓN: Contexto del carrito de compras POS
// ============================================================

import { createContext, useState, useMemo, useContext } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  /**
   * Agrega un producto al carrito. Si ya existe, suma la cantidad.
   * @param {{ id_producto, nombre, tamanio, precio, cantidad? }} producto
   */
  const agregar = (producto) => {
    const cantidadAgregar = producto.cantidad || 1;
    setItems((prev) => {
      const existe = prev.find(i => i.id_producto === producto.id_producto);
      if (existe) {
        return prev.map(i =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + cantidadAgregar }
            : i
        );
      }
      return [...prev, { ...producto, cantidad: cantidadAgregar }];
    });
  };

  /**
   * Elimina un producto del carrito por id_producto.
   * @param {number} id_producto
   */
  const eliminar = (id_producto) => {
    setItems(prev => prev.filter(i => i.id_producto !== id_producto));
  };

  /** Vacía el carrito por completo. */
  const limpiar = () => setItems([]);

  /** Total del carrito calculado con useMemo. */
  const total = useMemo(
    () => items.reduce((acc, i) => acc + parseFloat(i.precio) * i.cantidad, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, agregar, eliminar, limpiar, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
