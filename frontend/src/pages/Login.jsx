import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import gradientImg from '../img/gradient.svg';

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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6 font-sans">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        {/* Left Panel - Image/Gradient */}
        <div className="relative hidden w-1/2 p-4 md:block">
          <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#02196b] via-blue-800 to-blue-700">
            <img 
              src={gradientImg} 
              alt="Gradient Background" 
              className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-80"
            />
            <div className="absolute inset-0 flex flex-col justify-between p-12">
              <div className="text-4xl text-white">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20M4.929 4.929l14.142 14.142M4.929 19.071L19.071 4.929"/>
                </svg>
              </div>
              <div className="text-[#f4f7fb]">
                <p className="mb-2 text-sm font-medium uppercase tracking-widest opacity-80">Sistema DDC</p>
                <h1 className="text-4xl font-bold leading-tight text-[#f4f7fb]">
                  Debida Diligencia<br />
                  y Cumplimiento<br />
                  Inmobiliario
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 md:px-16">
          <div className="mb-8 md:hidden">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.929 4.929l14.142 14.142M4.929 19.071L19.071 4.929"/>
            </svg>
          </div>
          
          <h2 className="mb-2 font-display text-3xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mb-8 text-sm text-gray-500">
            Accede al sistema para gestionar clientes, expedientes y matrices de riesgo en un solo lugar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Correo electrónico</label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="usuario@ddc.com"
              />
            </div>
            
            <div className="relative">
              <label className="mb-2 block text-sm font-semibold text-gray-900">Contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute bottom-3 right-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-70"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sujetos Obligados — Ley 23 de 2015
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
