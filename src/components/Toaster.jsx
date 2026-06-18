import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { T, FONT, DISPLAY } from '../lib/constants.jsx';

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts,  setToasts]  = useState([]);
  const [confirm, setConfirm] = useState(null); // { message, resolve }
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type, message, duration = 4000) => {
    const id = ++counter.current;
    setToasts(prev => [...prev.slice(-4), { id, type, message }]); // max 5 at once
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => add('success', msg, dur),
    error:   (msg, dur) => add('error',   msg, dur ?? 6000),
    warn:    (msg, dur) => add('warn',    msg, dur),
    info:    (msg, dur) => add('info',    msg, dur),
    confirm: (message)  => new Promise(resolve => setConfirm({ message, resolve })),
  };

  const resolveConfirm = (val) => {
    if (confirm) { confirm.resolve(val); setConfirm(null); }
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={() => resolveConfirm(true)}
          onCancel={() => resolveConfirm(false)}
        />
      )}
    </ToastCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast stack (bottom-right)
// ─────────────────────────────────────────────────────────────────────────────
function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 16, zIndex: 99999,
      display: 'flex', flexDirection: 'column-reverse', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />)}
    </div>
  );
}

const TOAST_CFG = {
  success: { bg: T.successSoft, border: T.success, color: T.success,  Icon: CheckCircle2  },
  error:   { bg: T.dangerSoft,  border: T.danger,  color: T.danger,   Icon: AlertCircle   },
  warn:    { bg: T.warnSoft,    border: T.warn,    color: T.warn,     Icon: AlertTriangle },
  info:    { bg: T.infoSoft,    border: T.info,    color: T.info,     Icon: Info          },
};

function ToastItem({ toast, onDismiss }) {
  const { bg, border, color, Icon } = TOAST_CFG[toast.type] || TOAST_CFG.info;
  return (
    <div className="pop" style={{
      pointerEvents: 'auto',
      background: bg, border: `1px solid ${border}50`,
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 8px 28px rgba(0,0,0,.14)',
      minWidth: 260, maxWidth: 360, fontFamily: FONT,
    }}>
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 13, color, fontWeight: 600, flex: 1, lineHeight: 1.45 }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          color, padding: 0, display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm dialog (replaces browser confirm())
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,38,.55)',
      zIndex: 99998, display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div className="pop" style={{
        background: T.surface, borderRadius: 16, padding: '22px 22px 18px',
        maxWidth: 360, width: '100%', border: `1px solid ${T.border}`,
        boxShadow: '0 24px 60px rgba(0,0,0,.18)', fontFamily: FONT,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: T.dangerSoft,
          display: 'grid', placeItems: 'center', marginBottom: 14,
        }}>
          <AlertTriangle size={20} color={T.danger} />
        </div>
        <div style={{
          fontSize: 14, color: T.ink, lineHeight: 1.55, marginBottom: 18,
          fontWeight: 500,
        }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            className="press"
            style={{
              flex: 1, border: `1px solid ${T.border}`, background: T.surface,
              padding: '10px 0', borderRadius: 10, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', color: T.inkSoft,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="press"
            style={{
              flex: 1, border: 'none', background: T.danger,
              padding: '10px 0', borderRadius: 10, fontSize: 13,
              fontWeight: 800, cursor: 'pointer', color: T.white,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
