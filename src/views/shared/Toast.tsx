import { useState, useCallback, useEffect } from 'react';
import { Ic } from './Icons';

interface Toast { id: number; message: string; type: 'success' | 'error'; }

let _addToast: ((msg: string, type: 'success' | 'error') => void) | null = null;

export function toast(msg: string, type: 'success' | 'error' = 'success') {
  _addToast?.(msg, type);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? <Ic.Check size={15} /> : <Ic.X size={15} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
