import { useState, useEffect, useRef } from 'react';
import { Config } from '../../models';
import { ConfigService } from '../../controllers';
import { toast } from '../shared';
import { Ic } from '../shared';

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({
    empresa_nombre: '',
    empresa_domicilio: '',
    empresa_telefono: '',
    empresa_email: '',
    empresa_web: '',
    empresa_cuit: '',
    empresa_condicion_iva: 'Responsable Inscripto',
    color_primario: '#C9952A',
    color_acento: '#1a1a2e',
  });
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ConfigService.get().then(data => {
      setConfig(prev => ({ ...prev, ...data }));
      if (data.logo_path) setLogoPreview(data.logo_path);
    }).catch(() => {});
  }, []);

  const set = <K extends keyof Config>(k: K, v: Config[K]) =>
    setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await ConfigService.save(config);
      toast('Configuración guardada', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const result = await ConfigService.uploadLogo(file);
      setConfig(prev => ({ ...prev, logo_path: result.path }));
      toast('Logo subido correctamente', 'success');
    } catch (e: any) {
      toast('Error subiendo logo', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Logo del comercio</h2></div>
        <div className="card-body">
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <div
            className={`logo-upload-zone${logoPreview ? ' has-logo' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            {logoPreview ? (
              <div>
                <img
                  src={logoPreview.startsWith('data:') ? logoPreview : logoPreview}
                  className="logo-preview"
                  alt="Logo"
                  style={{ maxHeight: 90, maxWidth: 280, objectFit: 'contain' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10 }}>
                  Hacé click para cambiar el logo
                </p>
              </div>
            ) : (
              <div>
                <Ic.Upload size={28} />
                <p style={{ marginTop: 12, fontSize: 14 }}>
                  Hacé click para subir tu logo
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                  PNG, JPG, SVG hasta 5 MB · Se mostrará en todos los presupuestos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Datos del comercio</h2></div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group form-group full" style={{ gridColumn: '1/-1' }}>
              <label>Nombre / Razón social</label>
              <input
                value={config.empresa_nombre || ''}
                onChange={e => set('empresa_nombre', e.target.value)}
                placeholder="Ej: Comercial El Maniquí SA"
              />
            </div>
            <div className="form-group">
              <label>CUIT</label>
              <input
                value={config.empresa_cuit || ''}
                onChange={e => set('empresa_cuit', e.target.value)}
                placeholder="20-12345678-9"
              />
            </div>
            <div className="form-group">
              <label>Condición IVA</label>
              <select value={config.empresa_condicion_iva || 'Responsable Inscripto'}
                onChange={e => set('empresa_condicion_iva', e.target.value)}>
                <option>Responsable Inscripto</option>
                <option>Monotributista</option>
                <option>Exento</option>
                <option>Consumidor Final</option>
              </select>
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={config.empresa_telefono || ''}
                onChange={e => set('empresa_telefono', e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email"
                value={config.empresa_email || ''}
                onChange={e => set('empresa_email', e.target.value)}
                placeholder="info@comercio.com.ar"
              />
            </div>
            <div className="form-group">
              <label>Sitio web</label>
              <input
                value={config.empresa_web || ''}
                onChange={e => set('empresa_web', e.target.value)}
                placeholder="www.comercio.com.ar"
              />
            </div>
            <div className="form-group">
              <label>Domicilio fiscal</label>
              <input
                value={config.empresa_domicilio || ''}
                onChange={e => set('empresa_domicilio', e.target.value)}
                placeholder="Av. San Martín 1234, Buenos Aires"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h2>Colores del PDF</h2></div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Color primario (acento)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color"
                  value={config.color_primario || '#C9952A'}
                  onChange={e => set('color_primario', e.target.value)}
                  style={{ width: 48, padding: 3 }}
                />
                <input
                  value={config.color_primario || '#C9952A'}
                  onChange={e => set('color_primario', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Se usa en títulos, bordes y totales del PDF
              </span>
            </div>
            <div className="form-group">
              <label>Color de fondo / encabezados</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color"
                  value={config.color_acento || '#1a1a2e'}
                  onChange={e => set('color_acento', e.target.value)}
                  style={{ width: 48, padding: 3 }}
                />
                <input
                  value={config.color_acento || '#1a1a2e'}
                  onChange={e => set('color_acento', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Se usa en la banda del título y encabezados de tabla
              </span>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: '14px 20px', background: 'var(--dark-3)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 120, height: 40, background: config.color_acento || '#1a1a2e', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: config.color_primario || '#C9952A', fontWeight: 800, letterSpacing: 2, fontSize: 14 }}>PRESUPUESTO</span>
            </div>
            <div style={{ width: 36, height: 36, background: config.color_primario || '#C9952A', borderRadius: 4 }} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Vista previa de colores en el PDF</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-gold btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <Ic.Spinner size={16} /> : <Ic.Check size={16} />}
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
