import { useEffect, useState } from 'react';
import { usePresupuestos } from './controllers';
import { Ic, ToastProvider } from './views/shared';
import { Dashboard, PresupuestosPage, ConfigPage, AuthPage } from './views/pages';
import { clearSession, getToken } from './utils/auth';

type Page = 'dashboard' | 'presupuestos' | 'config';

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: 'Panel de control', sub: 'Resumen general de actividad' },
  presupuestos: { title: 'Presupuestos', sub: 'Gestioná y descargá tus presupuestos en PDF' },
  config: { title: 'Configuración', sub: 'Datos del comercio, logo y colores del PDF' },
};

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<Page>('dashboard');
  const { presupuestos, loading, load, error } = usePresupuestos();

  const nav = (p: Page) => setPage(p);

  useEffect(() => {
    if (!error) return;
    // Si la sesión expiró / falló el refresh, volvemos a la pantalla de activación.
    if (/(Sesión|no autorizado|Unauthorized|Bearer|Falta licenseKey)/i.test(error)) {
      onLogout();
    }
  }, [error, onLogout]);

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">✦ PresupuestosPro</div>
          <div className="brand-sub">Gestión comercial</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>
          <button className={`nav-link${page === 'dashboard' ? ' active' : ''}`} onClick={() => nav('dashboard')}>
            <Ic.Dashboard size={15} /> Dashboard
          </button>
          <button className={`nav-link${page === 'presupuestos' ? ' active' : ''}`} onClick={() => nav('presupuestos')}>
            <Ic.Doc size={15} /> Presupuestos
          </button>

          <div className="nav-section-label" style={{ marginTop: 24 }}>Sistema</div>
          <button className={`nav-link${page === 'config' ? ' active' : ''}`} onClick={() => nav('config')}>
            <Ic.Settings size={15} /> Configuración
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 10, letterSpacing: 0.5, marginBottom: 4, color: 'var(--text-dim)' }}>
            Base de datos
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--warning)' : 'var(--success)' }} />
            <span style={{ fontSize: 12 }}>
              {loading ? 'Conectando...' : `${presupuestos.length} presupuesto${presupuestos.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <div className="topbar-left">
            <h1>{PAGE_TITLES[page].title}</h1>
            <p>{PAGE_TITLES[page].sub}</p>
          </div>
          <div className="topbar-right">
            {page !== 'presupuestos' && (
              <button className="btn btn-gold" onClick={() => nav('presupuestos')}>
                <Ic.Plus size={14} /> Nuevo presupuesto
              </button>
            )}
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-dim)' }}>
              <Ic.Spinner size={20} />
              <span>Cargando datos...</span>
            </div>
          ) : (
            <>
              {page === 'dashboard' && <Dashboard presupuestos={presupuestos} />}
              {page === 'presupuestos' && <PresupuestosPage presupuestos={presupuestos} onRefresh={load} />}
              {page === 'config' && <ConfigPage />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());

  return (
    <>
      <ToastProvider />
      {authed ? (
        <AuthenticatedApp
          onLogout={() => {
            clearSession();
            setAuthed(false);
          }}
        />
      ) : (
        <AuthPage onAuthed={() => setAuthed(true)} />
      )}
    </>
  );
}
