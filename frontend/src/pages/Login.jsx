import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await api.post('/auth/login', { correo, password });
      const { access_token, refresh_token } = res.data;
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${access_token}` } });
      iniciarSesion(access_token, refresh_token, me.data);
      if (me.data.rol === 'admin') {
        navigate('/admin/matriz');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/5 bg-slate-900/80 p-10 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-acento text-white shadow-lg shadow-blue-900/30">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DDC/KYC</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-400">
            Sistema de Debida Diligencia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Correo electronico</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-acento focus:outline-none focus:ring-1 focus:ring-acento"
              placeholder="usuario@ddc.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Contrasena</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-acento focus:outline-none focus:ring-1 focus:ring-acento"
              placeholder="********"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-acento py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-5 text-center">
          <p className="text-xs text-gray-500">Sujetos Obligados - Ley 23 de 2015</p>
        </div>
      </div>
    </div>
  );
}
