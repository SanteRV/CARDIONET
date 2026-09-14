import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, error } = await login(email, password);
    if (ok) {
      navigate('/evaluacion');
    } else {
      notify(error || 'Error al iniciar sesión', 'error');
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow mx-auto" style={{ maxWidth: 400 }}>
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><i className="bi bi-box-arrow-in-right"></i> Iniciar sesión</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Ingresar
            </button>
            <p className="mt-3 mb-0 text-center">
              <Link to="/registro">¿No tienes cuenta? Regístrate</Link>
            </p>
            <p className="mt-1 mb-0 text-center">
              <Link to="/" className="text-muted small">
                Volver
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
