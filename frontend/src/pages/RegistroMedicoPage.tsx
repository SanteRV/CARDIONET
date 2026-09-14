import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import { setToken } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

export function RegistroMedicoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const { setUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, data } = await authApi.registroMedico({
      email,
      password,
      medico_id: parseInt(medicoId, 10),
    });
    if (ok && data.token && data.usuario) {
      setToken(data.token);
      setUser(data.usuario);
      notify('Registro exitoso', 'info');
      navigate('/perfil-medico');
    } else {
      notify((data as { error?: string }).error || 'Error al registrarse', 'error');
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow mx-auto" style={{ maxWidth: 500 }}>
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><i className="bi bi-person-badge"></i> Registro - Médico</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <div className="mb-3">
              <label className="form-label">ID del médico (CMP o ID en el sistema)</label>
              <input type="number" className="form-control" value={medicoId} onChange={(e) => setMedicoId(e.target.value)} required placeholder="Ej: 1" />
              <small className="text-muted">Debe coincidir con un médico ya importado.</small>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Registrarme
            </button>
            <p className="mt-2 mb-0 text-center">
              <Link to="/registro">Soy paciente, registrarme como paciente</Link>
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
