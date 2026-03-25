import { useState, useCallback } from 'react';
import { Presupuesto, PresupuestoItem, EstadoPresupuesto } from '../models';
import { Ic } from './shared';

interface Props {
  initial?: Presupuesto | null;
  onSave: (data: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClose: () => void;
}

const EMPTY_ITEM = (): PresupuestoItem => ({
  descripcion: '', detalle: '', cantidad: 1, unidad: 'u', precio_unitario: 0,
});

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(n);

export default function PresupuestoForm({ initial, onSave, onClose }: Props) {
  const isNew = !initial;
  const today = new Date().toISOString().slice(0, 10);

  const [saving, setSaving] = useState(false);
  const [ivaEnabled, setIvaEnabled] = useState((initial?.iva_pct ?? 21) > 0);
  const [savedIvaPct, setSavedIvaPct] = useState(initial?.iva_pct || 21);
  const [form, setForm] = useState({
    numero: initial?.numero || '',
    cliente_nombre: initial?.cliente_nombre || '',
    cliente_email: initial?.cliente_email || '',
    cliente_telefono: initial?.cliente_telefono || '',
    cliente_direccion: initial?.cliente_direccion || '',
    fecha: initial?.fecha || today,
    validez_dias: initial?.validez_dias ?? 30,
    estado: (initial?.estado || 'borrador') as EstadoPresupuesto,
    notas: initial?.notas || '',
    incluye: initial?.incluye || '',
    no_incluye: initial?.no_incluye || '',
    descuento_pct: initial?.descuento_pct ?? 0,
    iva_pct: initial?.iva_pct ?? 21,
  });

  const [items, setItems] = useState<PresupuestoItem[]>(
    initial?.items?.length ? initial.items : [EMPTY_ITEM()]
  );

  const set = useCallback(<K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const setItem = useCallback((idx: number, k: keyof PresupuestoItem, v: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [k]: v };
      updated.subtotal = Number(updated.cantidad) * Number(updated.precio_unitario);
      return updated;
    }));
  }, []);

  const addItem = () => setItems(prev => [...prev, EMPTY_ITEM()]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  // Totals
  const rawSubtotal = items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio_unitario), 0);
  const descuento = rawSubtotal * (Number(form.descuento_pct) / 100);
  const base = rawSubtotal - descuento;
  const iva = base * (Number(form.iva_pct) / 100);
  const total = base + iva;

  const handleSave = async () => {
    if (!form.cliente_nombre.trim()) return alert('Ingresá el nombre del cliente');
    if (!items.some(i => i.descripcion.trim())) return alert('Agregá al menos un ítem');
    setSaving(true);
    try {
      await onSave({
        ...form,
        items,
        subtotal: rawSubtotal,
        total,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <h2>{isNew ? '✦ Nuevo Presupuesto' : `✦ Editar ${initial?.numero}`}</h2>
          <button className="close-btn" onClick={onClose}><Ic.X size={14} /></button>
        </div>

        <div className="modal-body">

          {/* ── ENCABEZADO ─── */}
          <div className="section-sep">Datos del Presupuesto</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Número</label>
              <input
                value={form.numero}
                onChange={e => set('numero', e.target.value)}
                placeholder="Ej: P-0001 (auto si está vacío)"
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value as EstadoPresupuesto)}>
                <option value="borrador">Borrador</option>
                <option value="enviado">Enviado</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Validez (días)</label>
              <input type="number" min="1" value={form.validez_dias}
                onChange={e => set('validez_dias', Number(e.target.value))} />
            </div>
          </div>

          {/* ── CLIENTE ─── */}
          <div className="section-sep">Datos del Cliente</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre / Razón social *</label>
              <input
                value={form.cliente_nombre}
                onChange={e => set('cliente_nombre', e.target.value)}
                placeholder="Nombre del cliente o empresa"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={form.cliente_telefono} onChange={e => set('cliente_telefono', e.target.value)}
                placeholder="Ej: +54 11 1234-5678" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.cliente_email} onChange={e => set('cliente_email', e.target.value)}
                placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input value={form.cliente_direccion} onChange={e => set('cliente_direccion', e.target.value)}
                placeholder="Dirección del cliente" />
            </div>
          </div>

          {/* ── ITEMS ─── */}
          <div className="section-sep">Artículos y Servicios</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="items-edit-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Descripción *</th>
                  <th style={{ width: '25%' }}>Detalle / Especificación</th>
                  <th style={{ width: 70 }}>Cant.</th>
                  <th style={{ width: 65 }}>Unidad</th>
                  <th style={{ width: 110 }}>P. Unitario</th>
                  <th style={{ width: 110 }}>Subtotal</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={item.descripcion}
                        onChange={e => setItem(i, 'descripcion', e.target.value)}
                        placeholder="Nombre del artículo o servicio"
                      />
                    </td>
                    <td>
                      <input
                        value={item.detalle}
                        onChange={e => setItem(i, 'detalle', e.target.value)}
                        placeholder="Color, medida, modelo..."
                      />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01"
                        value={item.cantidad}
                        onChange={e => setItem(i, 'cantidad', Number(e.target.value))}
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        value={item.unidad}
                        onChange={e => setItem(i, 'unidad', e.target.value)}
                        placeholder="u, m², m..."
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01"
                        value={item.precio_unitario}
                        onChange={e => setItem(i, 'precio_unitario', Number(e.target.value))}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className="td-subtotal">
                      $ {fmt(Number(item.cantidad) * Number(item.precio_unitario))}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {items.length > 1 && (
                        <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }}
                          onClick={() => removeItem(i)}>
                          <Ic.Trash size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-outline btn-sm mt-16" onClick={addItem}>
            <Ic.Plus size={13} /> Agregar artículo
          </button>

          {/* ── TOTALES + CONDICIONES ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, marginTop: 24, alignItems: 'start' }}>
            <div>
              <div className="section-sep">Condiciones</div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>✓ Incluye (una línea por ítem)</label>
                <textarea
                  value={form.incluye}
                  onChange={e => set('incluye', e.target.value)}
                  placeholder={"Entrega e instalación\nGarantía 6 meses\nManual de uso"}
                  rows={4}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>✗ No incluye</label>
                <textarea
                  value={form.no_incluye}
                  onChange={e => set('no_incluye', e.target.value)}
                  placeholder={"Mano de obra de armado\nTrasporte a domicilio\nMateriales eléctricos"}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Notas y observaciones</label>
                <textarea
                  value={form.notas}
                  onChange={e => set('notas', e.target.value)}
                  placeholder="Forma de pago, condiciones especiales, aclaraciones..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <div className="section-sep">Totales</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
                <div className="form-group">
                  <label>Descuento (%)</label>
                  <input type="number" min="0" max="100" step="0.5"
                    value={form.descuento_pct}
                    onChange={e => set('descuento_pct', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ivaEnabled}
                      onChange={e => {
                        const checked = e.target.checked;
                        setIvaEnabled(checked);
                        if (!checked) {
                          setSavedIvaPct(form.iva_pct || 21);
                          set('iva_pct', 0);
                        } else {
                          set('iva_pct', savedIvaPct);
                        }
                      }}
                    />
                    IVA (%)
                  </label>
                  {ivaEnabled && (
                    <input type="number" min="0" max="100" step="0.5"
                      value={form.iva_pct}
                      onChange={e => {
                        const v = Number(e.target.value);
                        set('iva_pct', v);
                        setSavedIvaPct(v);
                      }} />
                  )}
                </div>
              </div>

              <div className="totals-panel">
                <div className="totals-panel-head">Resumen</div>
                <div className="totals-row">
                  <span className="t-lbl">Subtotal</span>
                  <span className="t-val">$ {fmt(rawSubtotal)}</span>
                </div>
                {Number(form.descuento_pct) > 0 && (
                  <div className="totals-row">
                    <span className="t-lbl">Desc. ({form.descuento_pct}%)</span>
                    <span className="t-val" style={{ color: 'var(--danger)' }}>- $ {fmt(descuento)}</span>
                  </div>
                )}
                {Number(form.iva_pct) > 0 && (
                  <div className="totals-row">
                    <span className="t-lbl">IVA ({form.iva_pct}%)</span>
                    <span className="t-val">$ {fmt(iva)}</span>
                  </div>
                )}
                <div className="totals-row total-final">
                  <span className="t-lbl">TOTAL</span>
                  <span className="t-val">$ {fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? <Ic.Spinner size={14} /> : (isNew ? <Ic.Plus size={14} /> : <Ic.Check size={14} />)}
            {isNew ? 'Crear presupuesto' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}
