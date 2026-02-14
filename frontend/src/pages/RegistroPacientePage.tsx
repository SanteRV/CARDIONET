import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { EvaluacionInput } from '../api/evaluacion';
import * as authApi from '../api/auth';
import { setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const initialForm = {
  email: '',
  password: '',
  apellidos_nombre: '',
  historia_clinica: '',
  dni: '',
  fecha_nacimiento: '',
  telefono: '',
  direccion: '',
  provincia: 'Lima',
  ciudad: 'Lima',
  distrito: 'Lima',
};

function getInitialForm(datosPaciente: EvaluacionInput | null | undefined) {
  if (!datosPaciente) return initialForm;
  return {
    ...initialForm,
    apellidos_nombre: datosPaciente.apellidos_nombre || '',
    historia_clinica: datosPaciente.historia_clinica || '',
    dni: datosPaciente.dni || '',
    fecha_nacimiento: datosPaciente.fecha_nacimiento || '',
    telefono: datosPaciente.telefono || '',
    direccion: datosPaciente.direccion || '',
  };
}

function RegistroForm() {
  const location = useLocation();
  const datosPaciente = location.state?.datosPaciente as EvaluacionInput | undefined;
  const [form, setForm] = useState(() => getInitialForm(datosPaciente));
  const { setUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await authApi.registroPaciente(form);
    if (ok && data.token && data.usuario) {
      setToken(data.token);
      setUser(data.usuario);
      notify('Registro exitoso', 'info');
      navigate('/evaluacion');
    } else {
      notify((data as { error?: string }).error || 'Error al registrarse', 'error');
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow mx-auto" style={{ maxWidth: 500 }}>
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><i className="bi bi-person-plus"></i> Registro - Paciente</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Apellidos y Nombre</label>
              <input type="text" className="form-control" value={form.apellidos_nombre} onChange={(e) => setForm((f) => ({ ...f, apellidos_nombre: e.target.value }))} required />
            </div>
            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Historia Clínica</label>
                <input type="text" className="form-control" value={form.historia_clinica} onChange={(e) => setForm((f) => ({ ...f, historia_clinica: e.target.value }))} required />
              </div>
              <div className="col-6">
                <label className="form-label">DNI (8 dígitos)</label>
                <input type="text" className="form-control" pattern="[0-9]{8}" maxLength={8} value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" className="form-control" value={form.fecha_nacimiento} onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input type="text" className="form-control" pattern="[0-9]{9}" maxLength={9} value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Dirección</label>
              <input type="text" className="form-control" value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
            </div>
            <div className="row mb-3">
              <div className="col-4">
                <label className="form-label">Provincia</label>
                <input type="text" className="form-control" value={form.provincia} onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))} />
              </div>
              <div className="col-4">
                <label className="form-label">Ciudad</label>
                <input type="text" className="form-control" value={form.ciudad} onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))} />
              </div>
              <div className="col-4">
                <label className="form-label">Distrito</label>
                <input type="text" className="form-control" value={form.distrito} onChange={(e) => setForm((f) => ({ ...f, distrito: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Registrarme
            </button>
            <p className="mt-2 mb-0 text-center">
              <Link to="/registro-medico">Soy médico, registrarme como médico</Link>
            </p>
            <button type="button" className="btn btn-link w-100 mt-1" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RegistroPacientePage() {
  return <RegistroForm />;
}
