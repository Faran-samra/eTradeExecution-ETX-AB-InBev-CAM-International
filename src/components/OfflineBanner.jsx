import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { T, FONT } from '../lib/constants.jsx';

export default function OfflineBanner({ pendingCount = 0, syncing = false, onSync }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const go = () => setOnline(true);
    const stop = () => setOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', stop);
    return () => {
      window.removeEventListener('online', go);
      window.removeEventListener('offline', stop);
    };
  }, []);

  if (online && pendingCount === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: online ? T.success : T.navy,
      color: T.white, padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: FONT, fontSize: 12, fontWeight: 700,
      boxShadow: '0 -4px 20px rgba(0,0,0,.15)',
    }}>
      {!online ? (
        <>
          <WifiOff size={14} />
          Sin conexión — los datos se guardarán localmente y sincronizarán al reconectarte
          {pendingCount > 0 && (
            <span style={{
              background: 'rgba(255,255,255,.2)', padding: '2px 8px', borderRadius: 5,
            }}>
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </>
      ) : (
        <>
          <RefreshCw size={14} className={syncing ? 'spin' : ''} />
          {syncing
            ? 'Sincronizando datos guardados localmente…'
            : `${pendingCount} operación${pendingCount !== 1 ? 'es' : ''} pendiente${pendingCount !== 1 ? 's' : ''} por sincronizar`
          }
          {!syncing && onSync && (
            <button
              onClick={onSync}
              style={{
                background: 'rgba(255,255,255,.25)', border: 'none', color: T.white,
                padding: '3px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                cursor: 'pointer', marginLeft: 4,
              }}
            >
              Sincronizar ahora
            </button>
          )}
        </>
      )}
    </div>
  );
}
