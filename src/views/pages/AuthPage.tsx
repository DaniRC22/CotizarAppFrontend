import { useMemo, useState } from 'react';
import { toast } from '../shared';
import { getLicenseKey, getMachineId, setActivationSession, getToken } from '../../utils/auth';

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export default function AuthPage({ onAuthed }: { onAuthed: () => void }) {
  const [licenseKeyInput, setLicenseKeyInput] = useState(getLicenseKey() || '');
  const [loading, setLoading] = useState(false);

  const machineId = useMemo(() => getMachineId(), []);

  const activate = async () => {
    const licenseKey = licenseKeyInput.trim();
    if (!licenseKey) {
      toast('Ingresá tu clave de licencia', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, machineId }),
      });

      const json = await res.json().catch(() => ({}));
      if (!json?.ok || !json?.token) {
        throw new Error(json?.error || 'No autorizado');
      }

      setActivationSession(licenseKey, json.token);
      toast('Sesión iniciada', 'success');
      onAuthed();
    } catch (e: any) {
      toast(e?.message || 'Error iniciando sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasToken = !!getToken();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Presupuestos Pro</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            Activá tu instalación con tu clave de licencia.
          </div>
        </div>

        {hasToken ? (
          <div style={{ marginBottom: 16, background: 'var(--dark-3)', padding: 14, borderRadius: 10, color: 'var(--text)' }}>
            Ya existe una sesión activa en este navegador.
          </div>
        ) : null}

        <div className="card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Clave de licencia</label>
            <input
              value={licenseKeyInput}
              onChange={e => setLicenseKeyInput(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-soft)' }}>
              Este navegador mantendrá un identificador estable para tu máquina (machineId).
            </div>
          </div>

          <button className="btn btn-gold btn-lg" onClick={activate} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Activando...' : 'Entrar'}
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-soft)' }}>
            Si la sesión expira, se refresca automáticamente desde la clave de licencia guardada.
          </div>

          {/* Nota: mantenemos el machineId “interno” para que el usuario no tenga que tocarlo. */}
        </div>
      </div>
    </div>
  );
}

