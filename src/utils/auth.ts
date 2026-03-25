const TOKEN_KEY = 'pp_token';
const LICENSE_KEY = 'pp_licenseKey';
const MACHINE_ID_KEY = 'pp_machineId';

function getRandomId(): string {
  // Browser-friendly stable identifier per tenant installation (per browser profile).
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c && typeof (c as any).randomUUID === 'function') {
    return (c as any).randomUUID();
  }

  const arr = new Uint8Array(16);
  if (!c?.getRandomValues) {
    // Fallback: no secure RNG available (should be rare in browsers).
    return Array.from(arr)
      .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .join('');
  }
  c.getRandomValues(arr);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function getLicenseKey(): string | null {
  try {
    return localStorage.getItem(LICENSE_KEY);
  } catch {
    return null;
  }
}

export function setLicenseKey(licenseKey: string): void {
  try {
    localStorage.setItem(LICENSE_KEY, licenseKey);
  } catch {
    // ignore
  }
}

export function getMachineId(): string {
  try {
    const existing = localStorage.getItem(MACHINE_ID_KEY);
    if (existing) return existing;
    const id = getRandomId();
    localStorage.setItem(MACHINE_ID_KEY, id);
    return id;
  } catch {
    // fallback (won't persist)
    return getRandomId();
  }
}

export function setActivationSession(licenseKey: string, token: string): void {
  setLicenseKey(licenseKey);
  setSessionToken(token);
  // getMachineId() ensures machineId is generated and persisted.
  getMachineId();
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LICENSE_KEY);
    localStorage.removeItem(MACHINE_ID_KEY);
  } catch {
    // ignore
  }
}

