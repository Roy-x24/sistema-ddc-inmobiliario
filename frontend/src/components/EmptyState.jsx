export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state" style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(148,163,184,0.22)', padding: 32 }}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</div>
      <div style={{ maxWidth: 520, margin: '0 auto', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{message}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
