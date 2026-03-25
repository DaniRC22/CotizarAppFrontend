import { useState } from 'react';
import { Presupuesto } from '../../models';
import { Ic } from '../shared';
import { PresupuestoService } from '../../controllers';
import { toast } from '../shared';
import PresupuestoForm from '../PresupuestoForm';

const fmt = (n: number) => '$ ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(n);

const BADGE: Record<string, string> = {
  borrador: 'badge-borrador', enviado: 'badge-enviado',
  aceptado: 'badge-aceptado', rechazado: 'badge-rechazado',
};
const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', enviado: 'Enviado', aceptado: 'Aceptado', rechazado: 'Rechazado'
};

interface Props {
  presupuestos: Presupuesto[];
  onRefresh: () => void;
}

export default function PresupuestosPage({ presupuestos, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Presupuesto | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = presupuestos.filter(p => {
    const matchSearch = p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.numero.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const handleSave = async (data: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await PresupuestoService.update(editing.id, data);
        toast('Presupuesto actualizado', 'success');
      } else {
        await PresupuestoService.create(data);
        toast('Presupuesto creado', 'success');
      }
      setShowForm(false);
      setEditing(null);
      onRefresh();
    } catch (e: any) {
      toast(e.message, 'error');
      throw e;
    }
  };

  const handleEdit = async (p: Presupuesto) => {
    try {
      const full = await PresupuestoService.get(p.id);
      setEditing(full);
      setShowForm(true);
    } catch (e: any) {
      toast('Error cargando presupuesto', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await PresupuestoService.delete(id);
      toast('Presupuesto eliminado', 'success');
      setConfirmDelete(null);
      onRefresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handlePdf = async (p: Presupuesto) => {
    setLoadingPdf(p.id);
    try {
      await PresupuestoService.generatePDF(p.id, p.numero);
      toast(`PDF generado: ${p.numero}.pdf`, 'success');
    } catch (e: any) {
      toast('Error generando PDF', 'error');
    } finally {
      setLoadingPdf(null);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Ic.Search size={14} />
          <input
            placeholder="Buscar por cliente o número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="toolbar-select"
        >
          <option value="todos">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="enviado">Enviado</option>
          <option value="aceptado">Aceptado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <button className="btn btn-gold" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Ic.Plus size={14} /> Nuevo presupuesto
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2>Presupuestos ({filtered.length})</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Ic.Doc size={48} />
            <h3>Sin resultados</h3>
            <p>{presupuestos.length === 0
              ? 'Creá tu primer presupuesto con el botón "Nuevo presupuesto"'
              : 'Ningún presupuesto coincide con el filtro'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Validez</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="td-mono">{p.numero}</td>
                    <td className="td-primary">{p.cliente_nombre}</td>
                    <td>{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
                    <td style={{ color: 'var(--text-dim)' }}>{p.validez_dias}d</td>
                    <td style={{ textAlign: 'right' }}>{fmt(Number(p.subtotal))}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>
                      {fmt(Number(p.total))}
                    </td>
                    <td>
                      <span className={`badge ${BADGE[p.estado]}`}>
                        {ESTADO_LABELS[p.estado]}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Descargar PDF"
                          onClick={() => handlePdf(p)}
                          disabled={loadingPdf === p.id}
                        >
                          {loadingPdf === p.id ? <Ic.Spinner size={13} /> : <Ic.Download size={13} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Editar"
                          onClick={() => handleEdit(p)}
                        >
                          <Ic.Edit size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Eliminar"
                          onClick={() => setConfirmDelete(p.id)}
                        >
                          <Ic.Trash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <PresupuestoForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Confirmar eliminación</h2>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}><Ic.X size={14} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-soft)' }}>
                ¿Estás seguro que querés eliminar este presupuesto? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>
                <Ic.Trash size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
