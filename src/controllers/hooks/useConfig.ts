import { useState, useCallback, useEffect } from 'react';
import { Config } from '../../models';
import { ConfigService } from '../services';

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ConfigService.get();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (data: Config) => {
    try {
      await ConfigService.save(data);
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración');
      throw err;
    }
  }, []);

  const uploadLogo = useCallback(async (file: File) => {
    try {
      const result = await ConfigService.uploadLogo(file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo logo');
      throw err;
    }
  }, []);

  return { config, loading, error, load, save, uploadLogo };
};
