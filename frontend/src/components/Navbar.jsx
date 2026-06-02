import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <header style={{
      height: 64,
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          color: '#0B0F19'
        }}>
          DDC
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em' }}>
          <span className="gold-gradient-text">DDC/KYC</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 10, fontFamily: 'var(--font-body)', fontWeight: 400 }}>Inmobiliario</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{usuario?.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{usuario?.rol?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={cerrarSesion}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
