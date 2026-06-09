import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Users, Clock, CheckCircle, AlertTriangle, ShieldAlert, Eye, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, pendiente: 0, pendiente_bf: 0, en_revision: 0,
    observado: 0, activo: 0, bloqueado: 0, rechazado: 0
  });
  const [reciente, setReciente] = useState([]);

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => {
      const data = res.data || [];
      setStats({
        total: data.length,
        pendiente: data.filter(c => c.estado === 'PENDIENTE').length,
        pendiente_bf: data.filter(c => c.estado === 'PENDIENTE_BF').length,
        en_revision: data.filter(c => c.estado === 'EN_REVISION').length,
        observado: data.filter(c => c.estado === 'OBSERVADO').length,
        activo: data.filter(c => c.estado === 'ACTIVO').length,
        bloqueado: data.filter(c => c.estado === 'BLOQUEADO').length,
        rechazado: data.filter(c => c.estado === 'RECHAZADO').length,
      });
    });
    api.get('/auditoria').then(res => {
      setReciente((res.data || []).slice(0, 10));
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total expedientes', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Pendientes', value: stats.pendiente + stats.pendiente_bf, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'En revision', value: stats.en_revision, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { label: 'Observados', value: stats.observado, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Activos', value: stats.activo, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Bloqueados', value: stats.bloqueado, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Rechazados', value: stats.rechazado, icon: FileCheck, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  ];

  const actionIcon = (accion) => {
    if (accion.includes('ACTIVAR')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (accion.includes('RECHAZAR')) return <ShieldAlert className="h-4 w-4 text-red-600" />;
    if (accion.includes('OBSERVACION')) return <AlertTriangle className="h-4 w-4 text-purple-600" />;
    if (accion.includes('DOCUMENTO')) return <FileCheck className="h-4 w-4 text-blue-600" />;
    return <Eye className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="mt-2 text-sm text-gray-500">Resumen del sistema de cumplimiento regulatorio</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-fade-in-up stagger-${i + 1}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${card.border} ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Acciones recientes</h3>
        </div>
        {reciente.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Sin registros recientes.</p>
        ) : (
          <div className="space-y-2">
            {reciente.map((r) => (
              <div
                key={r.id_auditoria}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                    {actionIcon(r.accion)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{r.usuario}</p>
                    <p className="text-xs font-medium text-gray-500 capitalize">{r.accion.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400">{new Date(r.fecha).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
