import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Landmark, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const destino = me.data.rol === 'admin' ? '/admin/dashboard' : me.data.rol === 'auditor' ? '/auditor/dashboard' : '/dashboard';
      navigate(destino);
    } catch (err) {
      setError('Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#08111f] font-sans text-slate-950 md:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden p-10 text-white md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.38),transparent_32%),radial-gradient(circle_at_78%_30%,rgba(245,158,11,0.24),transparent_34%),linear-gradient(135deg,#08111f,#101827)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide">DDC KYC</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100/70">Real Estate Compliance</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ley 23 de 2015
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
              Control inteligente para debida diligencia inmobiliaria.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Expedientes, documentos, riesgo y auditoria en una experiencia pensada para operar rapido y decidir con claridad.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-3">
            {['Expedientes', 'Riesgo', 'Auditoria'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{item}</p>
                <p className="mt-2 text-sm font-semibold text-white">Listo para operar</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Landmark className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10">
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Acceso seguro</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Iniciar sesion</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Gestiona clientes, expedientes y matrices de riesgo desde un solo panel.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Correo electronico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-semibold text-slate-950 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    placeholder="usuario@ddc.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Contrasena</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 pr-12 text-sm font-semibold text-slate-950 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-xl bg-slate-950 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:translate-y-0 disabled:opacity-70"
              >
                {cargando ? 'Ingresando...' : 'Entrar al sistema'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs font-semibold text-slate-400">
              Sujetos Obligados - Ley 23 de 2015
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
