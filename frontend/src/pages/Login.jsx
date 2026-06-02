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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900">
      {/* Background ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(11,27,61,1),_transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Decorative lines */}
      <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent" />

      <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
        {/* Card */}
        <div className="rounded-2xl border border-gold/15 bg-navy-800/60 p-10 shadow-elevated backdrop-blur-xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 shadow-glow">
              <Shield className="h-7 w-7 text-gold" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-cream">DDC/KYC</h1>
            <div className="ornament mt-3 mb-2 text-gold-muted">
              <span className="text-[10px] uppercase tracking-[0.2em]">Inmobiliario</span>
            </div>
            <p className="text-sm text-gold-muted/70">Debida Diligencia de Clientes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-gold-muted">Correo electronico</label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-navy-900/60 px-4 py-3 text-sm text-cream placeholder-gold-muted/30 transition-all focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15"
                placeholder="usuario@ddc.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-gold-muted">Contrasena</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-navy-900/60 px-4 py-3 text-sm text-cream placeholder-gold-muted/30 transition-all focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15"
                placeholder="********"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-risk-alto/20 bg-risk-alto/10 px-4 py-3 text-center text-sm text-risk-alto">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-gold py-3 text-sm font-bold uppercase tracking-wider text-navy-900 shadow-glow transition-all hover:bg-gold-light hover:shadow-elevated disabled:opacity-60"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>

          <div className="mt-8 border-t border-gold/10 pt-5 text-center">
            <p className="text-[11px] text-gold-muted/50">Sujetos Obligados — Ley 23 de 2015</p>
          </div>
        </div>
      </div>
    </div>
  );
}
