import { Config } from '../../models';
import { getLicenseKey, getMachineId, getToken, setSessionToken } from '../../utils/auth';

const BASE = import.meta.env.VITE_API_URL || '/api';

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

export class ConfigService {
  static get = () => request<Config>('/config');
  
  static save = (data: Config) => request<void>('/config', { method: 'POST', body: JSON.stringify(data) });
  
  static uploadLogo = async (file: File): Promise<{ path: string }> => {
    const form = new FormData();
    form.append('logo', file);

    const tryUpload = async () => {
      const t = getToken();
      return await fetch(`${BASE}/config/logo`, {
        method: 'POST',
        headers: {
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: form,
      });
    };

    let res = await tryUpload();
    if (res.status === 401) {
      await refreshToken();
      res = await tryUpload();
    }

    const json = await res.json().catch(() => ({}));
    if (!json?.ok) throw new Error(json?.error || 'Error subiendo logo');
    return json.data;
  };
}
