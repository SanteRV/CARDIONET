export function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="spinner-border text-light" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}
