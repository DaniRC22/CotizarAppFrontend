// LEGACY COMPATIBILITY: Usa los servicios y hooks de controllers/
// Esta API se mantiene para compatibilidad con imports legacy.

import { PresupuestoService, ConfigService } from '../controllers';

export const api = {
  presupuestos: {
    list: () => PresupuestoService.list(),
    get: (id: string) => PresupuestoService.get(id),
    create: (body: any) => PresupuestoService.create(body),
    update: (id: string, body: any) => PresupuestoService.update(id, body),
    delete: (id: string) => PresupuestoService.delete(id),
  },
  config: {
    get: () => ConfigService.get(),
    save: (data: any) => ConfigService.save(data),
    uploadLogo: (file: File) => ConfigService.uploadLogo(file),
  },
  pdf: {
    generate: (id: string, numero: string) => PresupuestoService.generatePDF(id, numero),
  },
};
