import { useState, useEffect } from 'react';
import * as medicosApi from '../api/medicos';
import { useNotification } from '../hooks/useNotification';

export function PerfilMedicoPage() {
  const [perfil, setPerfil] = useState<medicosApi.Medico | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ telefono: '', direccion: '', provincia: '', distrito: '' });
  const { notify } = useNotification();

  useEffect(() => {
    medicosApi
      .getPerfil()
      .then(({ ok, data }) => {
        if (ok && data) {
          setPerfil(data);
          setForm({
            telefono: data.telefono || '',
            direccion: data.direccion_completa || data.ubicacion_consultorio || '',
            provincia: data.provincia || '',
            distrito: data.distrito || '',
          });
        }
      })
      .catch(() => notify('Error al cargar perfil', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await medicosApi.putPerfil({
      telefono: form.telefono,
      ubicacion_consultorio: form.direccion,
      provincia: form.provincia,
      distrito: form.distrito,
    });
    if (ok && data) {
      setPerfil(data);
      notify('Perfil actualizado', 'info');
    } else {
      notify((data as { error?: string }).error || 'Error al guardar', 'error');
    }
  };

  if (loading) return <div className="container my-5 text-center">Cargando...</div>;
  if (!perfil) return <div className="container my-5 text-center">No autorizado</div>;

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><i className="bi bi-person-badge-fill"></i> Mi Perfil - Médico</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Nombre</label>
                <input type="text" className="form-control" value={perfil.nombre} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Especialidad</label>
                <input type="text" className="form-control" value={perfil.especialidad || ''} readOnly />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                className="form-control"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Dirección del consultorio</label>
              <input
                type="text"
                className="form-control"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              />
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Provincia</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.provincia}
                  onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Distrito</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.distrito}
                  onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
