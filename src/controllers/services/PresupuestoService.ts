import { Presupuesto, Config } from '../../models';
import { getLicenseKey, getMachineId, getToken, setSessionToken } from '../../utils/auth';

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

async function refreshToken(): Promise<void> {
  const licenseKey = getLicenseKey();
  if (!licenseKey) throw new Error('Falta licenseKey para refrescar sesión');
  const machineId = getMachineId();
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenseKey,
      machineId,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!json?.ok || !json?.token) throw new Error(json?.error || 'Sesión expirada');
  setSessionToken(json.token);
}

async function request<T>(path: string, opts?: RequestInit, _retry = false): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
    ...opts,
  });

  if (res.status === 401 && !_retry && path !== '/auth/activate' && path !== '/auth/refresh') {
    await refreshToken();
    return request<T>(path, opts, true);
  }

  const json = await res.json().catch(() => ({}));
  if (!json?.ok) throw new Error(json?.error || 'Error en servidor');
  return json.data as T;
}

export class PresupuestoService {
  static list = () => request<Presupuesto[]>('/presupuestos');
  
  static get = (id: string) => request<Presupuesto>(`/presupuestos/${id}`);
  
  static create = (body: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) =>
    request<Presupuesto>('/presupuestos', { method: 'POST', body: JSON.stringify(body) });
  
  static update = (id: string, body: Partial<Presupuesto>) =>
    request<Presupuesto>(`/presupuestos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  
  static delete = (id: string) => request<void>(`/presupuestos/${id}`, { method: 'DELETE' });

  static generatePDF = async (id: string, numero: string) => {
    const tryGenerate = async () => {
      const token = getToken();
      return await fetch(`${BASE}/pdf/${id}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    };

    let res = await tryGenerate();
    if (res.status === 401) {
      await refreshToken();
      res = await tryGenerate();
    }
    if (!res.ok) throw new Error('Error generando PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${numero}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
}
