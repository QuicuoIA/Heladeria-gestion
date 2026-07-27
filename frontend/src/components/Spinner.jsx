// ============================================================
// ARCHIVO: frontend/src/components/Spinner.jsx
// DESCRIPCIÓN: Indicador de carga circular con tamaños variables
// ============================================================

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.color='border-cyan-400']
 */
const Spinner = ({ size = 'md', color = 'border-cyan-400' }) => {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-14 w-14 border-4'
  };

  return (
    <div
      className={`${sizes[size]} ${color} border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  );
};

export default Spinner;
