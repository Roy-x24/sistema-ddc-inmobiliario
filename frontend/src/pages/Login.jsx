import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

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
      const token = res.data.access_token;
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      iniciarSesion(token, me.data);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, #1B2332 0%, #0B0F19 60%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in-up" style={{
        width: 400,
        padding: 48,
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}>
            <span className="gold-gradient-text">DDC/KYC</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 300, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Sistema de Debida Diligencia
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo electrónico</label>
            <input
              type="email"
              required
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              className="input-field"
              style={{ padding: '14px 16px', fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              style={{ padding: '14px 16px', fontSize: 15 }}
            />
          </div>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: '#FCA5A5',
              fontSize: 13,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 15,
              marginTop: 4,
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Sujetos Obligados — Ley 23 de 2015
          </p>
        </div>
      </div>
    </div>
  );
}
