export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aceptado' | 'rechazado';

export interface PresupuestoItem {
  id?: string;
  descripcion: string;
  detalle: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal?: number;
  orden?: number;
}

export interface Presupuesto {
  id: string;
  numero: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_direccion: string;
  fecha: string;
  validez_dias: number;
  estado: EstadoPresupuesto;
  notas: string;
  incluye: string;
  no_incluye: string;
  subtotal: number;
  descuento_pct: number;
  iva_pct: number;
  total: number;
  pdf_path?: string;
  created_at?: string;
  updated_at?: string;
  items: PresupuestoItem[];
  item_count?: number;
}
