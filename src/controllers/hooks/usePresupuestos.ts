import { useState, useCallback, useEffect } from 'react';
import { Presupuesto } from '../../models';
import { PresupuestoService } from '../services';

export const usePresupuestos = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PresupuestoService.list();
      setPresupuestos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (data: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await PresupuestoService.create(data);
      setPresupuestos(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando presupuesto');
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Presupuesto>) => {
    try {
      const actualizado = await PresupuestoService.update(id, data);
      setPresupuestos(prev => prev.map(p => p.id === id ? actualizado : p));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando presupuesto');
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await PresupuestoService.delete(id);
      setPresupuestos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando presupuesto');
      throw err;
    }
  }, []);

  const generatePDF = useCallback(async (id: string, numero: string) => {
    try {
      await PresupuestoService.generatePDF(id, numero);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando PDF');
      throw err;
    }
  }, []);

  return { presupuestos, loading, error, load, create, update, remove, generatePDF };
};
