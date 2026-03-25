import { Presupuesto } from '../types';

const fmt = (n: number) =>
  '$ ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(n);

interface Props { presupuestos: Presupuesto[]; }

const ESTADOS = ['borrador', 'enviado', 'aceptado', 'rechazado'] as const;
const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', enviado: 'Enviado', aceptado: 'Aceptado', rechazado: 'Rechazado'
};

export default function Dashboard({ presupuestos }: Props) {
  const total = presupuestos.reduce((s, p) => s + Number(p.total), 0);
  const aceptados = presupuestos.filter(p => p.estado === 'aceptado');
  const pendientes = presupuestos.filter(p => p.estado === 'enviado');
  const convRate = presupuestos.length
    ? Math.round((aceptados.length / presupuestos.length) * 100)
    : 0;

  const recientes = [...presupuestos]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 8);

  const BADGE: Record<string, string> = {
    borrador: 'badge-borrador', enviado: 'badge-enviado',
    aceptado: 'badge-aceptado', rechazado: 'badge-rechazado',
  };

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Total presupuestos</div>
          <div className="stat-value">{presupuestos.length}</div>
          <div className="stat-sub">histórico</div>
        </div>
        <div className="stat-box" style={{ '--gold': '#3ecf8e' } as React.CSSProperties}>
          <div className="stat-label">Monto aceptado</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {fmt(aceptados.reduce((s, p) => s + Number(p.total), 0))}
          </div>
          <div className="stat-sub">{aceptados.length} presupuesto{aceptados.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value">{pendientes.length}</div>
          <div className="stat-sub">en espera de respuesta</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Conversión</div>
          <div className="stat-value">{convRate}%</div>
          <div className="stat-sub">de aceptación</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Presupuestos recientes</h2>
          </div>
          {recientes.length === 0 ? (
            <div className="empty-state">
              <h3>Sin presupuestos aún</h3>
              <p>Creá tu primer presupuesto desde la sección Presupuestos</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Número</th><th>Cliente</th><th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Total</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map(p => (
                    <tr key={p.id}>
                      <td className="td-mono">{p.numero}</td>
                      <td className="td-primary">{p.cliente_nombre}</td>
                      <td>{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(Number(p.total))}</td>
                      <td><span className={`badge ${BADGE[p.estado]}`}>{ESTADO_LABELS[p.estado]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h2>Por estado</h2></div>
          <div className="card-body">
            {ESTADOS.map(estado => {
              const count = presupuestos.filter(p => p.estado === estado).length;
              const pct = presupuestos.length ? (count / presupuestos.length) * 100 : 0;
              return (
                <div key={estado} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span className={`badge ${BADGE[estado]}`}>{ESTADO_LABELS[estado]}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--dark-4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
            <div className="divider" />
            <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Monto total cotizado</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: 'var(--gold-lt)', fontWeight: 700 }}>
                {fmt(total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
