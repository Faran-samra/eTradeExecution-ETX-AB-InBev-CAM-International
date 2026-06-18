import { useState } from 'react';
import { T, FONT, DISPLAY, getCountry } from '../lib/constants.jsx';
import { Store, CheckCircle2, X, Check, MapPin, Clock,
         UserRound, Route, Crosshair, AlertCircle, Loader2 } from 'lucide-react';
import { createPdv } from '../lib/data.js';
import { useToast } from './Toaster.jsx';

const NOTIF_KEY = (userId) => `etx-notif-${userId}`;

function pushNotification(userId, notif) {
  try {
    const key = NOTIF_KEY(userId);
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...existing, { ...notif, ts: Date.now() }]));
  } catch {}
}

export default function SolicitudesTab({ approvals, setPendingApprovals, catalog, setCatalog }) {
  const toast = useToast();
  const [approvingId,  setApprovingId]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // approval object al rechazar
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting,    setRejecting]    = useState(false);

  // ── Aprobar: persiste a Supabase + notifica al GVM ───────────────────
  const approve = async (approval) => {
    setApprovingId(approval.id);
    try {
      // GAP 2 fix: insertar en Supabase
      const savedPdv = await createPdv(approval.pdv);

      // Actualizar catálogo local con el PDV real de la BD
      setCatalog(c => {
        const exists = c.find(p => p.id === savedPdv.id);
        return exists ? c : [...c, savedPdv];
      });

      // Eliminar de pendientes
      setPendingApprovals(a => a.filter(x => x.id !== approval.id));

      // GAP 1 fix: notificar al GVM
      pushNotification(approval.requestedBy, {
        type: 'approved',
        pdvName: approval.pdv.name,
      });

      toast.success(`"${approval.pdv.name}" aprobado y guardado`);
    } catch (e) {
      toast.error(`Error al aprobar: ${e.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  // ── Rechazar: modal con motivo ────────────────────────────────────────
  const openReject = (approval) => {
    setRejectTarget(approval);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      // Eliminar de pendientes
      setPendingApprovals(a => a.filter(x => x.id !== rejectTarget.id));

      // GAP 1 fix: notificar al GVM con el motivo
      pushNotification(rejectTarget.requestedBy, {
        type:   'rejected',
        pdvName: rejectTarget.pdv.name,
        reason: rejectReason.trim() || null,
      });

      toast.warn(`Solicitud de "${rejectTarget.pdv.name}" rechazada`);
      setRejectTarget(null);
      setRejectReason('');
    } finally {
      setRejecting(false);
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="fade" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: T.successSoft,
          display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <CheckCircle2 size={28} color={T.success} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink }}>
          Sin solicitudes pendientes
        </div>
        <div style={{ fontSize: 13, color: T.textMed, marginTop: 8, maxWidth: 300, margin: '8px auto 0' }}>
          Cuando un GVM registre un nuevo punto de venta aparecerá aquí.
        </div>
      </div>
    );
  }

  return (
    <div className="fade">
      <div style={{ fontSize: 12.5, color: T.textMed, marginBottom: 20, fontFamily: FONT }}>
        {approvals.length} solicitud{approvals.length > 1 ? 'es' : ''} pendiente{approvals.length > 1 ? 's' : ''}
      </div>

      {approvals.map((a, i) => {
        const country     = getCountry(a.country);
        const isApproving = approvingId === a.id;
        return (
          <div key={a.id} className="rise" style={{
            animationDelay: `${i * 55}ms`,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
            padding: 20, marginBottom: 16,
            boxShadow: '0 4px 16px -10px rgba(38,48,58,.2)', fontFamily: FONT,
          }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primarySoft,
                  display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {/* Foto si existe */}
                  {a.pdv.photoUrl
                    ? <img src={a.pdv.photoUrl} alt="local"
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 12 }}/>
                    : <Store size={20} color={T.primaryDim}/>
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.ink }}>{a.pdv.name}</div>
                  <div style={{ fontSize: 11.5, color: T.textMed, marginTop: 2 }}>
                    {country.flag} {country.name} · {a.pdv.cat}
                  </div>
                </div>
              </div>
              <span style={{ background: T.warnSoft, color: T.warn, fontSize: 10.5, fontWeight: 800,
                padding: '4px 10px', borderRadius: 8, flexShrink: 0, marginLeft: 8 }}>
                Pendiente
              </span>
            </div>

            {/* Datos */}
            <div style={{ background: T.bg, borderRadius: 12, padding: '8px 14px', marginBottom: 14 }}>
              {[
                [UserRound, 'Solicitado por', a.requestedByName],
                [MapPin,    'Dirección',       a.pdv.addr || '—'],
                [Route,     'Canal',           a.pdv.channel],
                [Store,     'Categoría',       a.pdv.cat],
                [Clock,     'Fecha',           new Date(a.requestedAt).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })],
              ].map(([Icon, label, value], idx) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                  borderBottom: idx < 4 ? `1px solid ${T.border}` : 'none',
                }}>
                  <Icon size={13} color={T.textLow} style={{ flexShrink: 0 }}/>
                  <span style={{ fontSize: 11.5, color: T.textLow, fontWeight: 700, minWidth: 100 }}>{label}</span>
                  <span style={{ fontSize: 12, color: T.ink, fontWeight: 700, flex: 1 }}>{value}</span>
                </div>
              ))}
              {(a.pdv.lat !== 0 || a.pdv.lng !== 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 7 }}>
                  <Crosshair size={13} color={T.textLow}/>
                  <span style={{ fontSize: 11.5, color: T.textLow, fontWeight: 700, minWidth: 100 }}>Coordenadas</span>
                  <span style={{ fontSize: 11, color: T.textMed, fontFamily: 'monospace' }}>
                    {a.pdv.lat.toFixed(5)}, {a.pdv.lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Modal de rechazo inline ──────────────────────────────── */}
            {rejectTarget?.id === a.id && (
              <div className="pop" style={{
                background: T.dangerSoft, border: `1px solid ${T.danger}30`,
                borderRadius: 12, padding: 14, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <AlertCircle size={16} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }}/>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>
                    Motivo del rechazo (opcional)
                  </div>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ej. Dirección incompleta, local duplicado, zona sin cobertura…"
                  rows={2}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 12,
                    border: `1px solid ${T.danger}40`, background: T.white, color: T.ink,
                    resize: 'vertical', fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => setRejectTarget(null)} style={{
                    flex: 1, padding: '9px 0', border: `1px solid ${T.border}`,
                    background: T.surface, color: T.textMed, borderRadius: 9,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>Cancelar</button>
                  <button onClick={confirmReject} disabled={rejecting} className="press" style={{
                    flex: 1, padding: '9px 0', border: 'none',
                    background: T.danger, color: T.white, borderRadius: 9,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    {rejecting
                      ? <><Loader2 size={13} className="spin"/> Rechazando…</>
                      : <><X size={13}/> Confirmar rechazo</>}
                  </button>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => rejectTarget?.id === a.id ? setRejectTarget(null) : openReject(a)}
                disabled={isApproving}
                className="press" style={{
                  flex: 1, border: `1px solid ${T.dangerSoft}`, background: T.dangerSoft,
                  color: T.danger, padding: '11px 0', borderRadius: 12,
                  fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <X size={14}/> {rejectTarget?.id === a.id ? 'Cerrar' : 'Rechazar'}
              </button>
              <button onClick={() => approve(a)} disabled={isApproving || !!rejectTarget} className="press" style={{
                flex: 2, border: 'none', cursor: isApproving || rejectTarget ? 'default' : 'pointer',
                background: `linear-gradient(135deg, ${T.success}, #1E8B52)`, color: T.white,
                padding: '11px 0', borderRadius: 12, fontSize: 12.5, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: (isApproving || rejectTarget) ? 0.6 : 1,
                boxShadow: '0 8px 20px -10px rgba(44,157,99,.55)',
              }}>
                {isApproving
                  ? <><Loader2 size={14} className="spin"/> Guardando en BD…</>
                  : <><Check size={14}/> Aprobar y guardar</>}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
