import { useState, useEffect } from 'react';
import { useToast } from '../Toaster.jsx';
import { T, FONT, DISPLAY, SURVEY_KINDS, getCountry } from '../../lib/constants.jsx';
import { ChevronLeft, MapPin, Store, BarChart3, CheckCircle2, Clock, ChevronRight, ChevronDown, Loader2, LogOut } from 'lucide-react';
import { fetchSurveys, checkoutPdv } from '../../lib/data.js';

export default function PdvDetail({ pdv, checkedInStatus, onBack, onCheckin, onStartSurvey, setCatalog }) {
  const country = getCountry(pdv.country);
  const checkedIn   = !!checkedInStatus;
  const isProcessing = checkedInStatus === 'processing';

  const statusLabel = pdv.status === 'done' ? 'Completado' : pdv.status === 'in_progress' ? 'En progreso' : 'Pendiente';
  const statusColor = pdv.status === 'done' ? T.success : pdv.status === 'in_progress' ? T.warn : T.textLow;
  // El GVM puede iniciar levantamientos si el PDV está in_progress/done O si el check-in local está done
  const canSurvey   = pdv.status === 'in_progress' || pdv.status === 'done' || checkedIn;
  const toast = useToast();
  const [checkingOut, setCheckingOut] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [completedKinds, setCompletedKinds] = useState(new Set());

  const canCheckout = canSurvey && completedKinds.size >= 1 && pdv.status !== 'done';

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await checkoutPdv(pdv.id);
      setCatalog?.(prev => prev.map(p => p.id === pdv.id ? { ...p, status: 'done' } : p));
      toast.success(`✅ Visita a "${pdv.name}" completada`);
      setTimeout(() => onBack(), 1200);
    } catch (e) {
      toast.error(`Error al cerrar visita: ${e.message}`);
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    if (!canSurvey) return;
    fetchSurveys({ pdvId: pdv.id }).then(surveys => {
      setCompletedKinds(new Set(surveys.map(s => s.kind)));
    }).catch(() => {});
  }, [pdv.id, canSurvey]);

  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 10, background: T.surface,
          border: `1px solid ${T.border}`, cursor: 'pointer',
          display: 'grid', placeItems: 'center', color: T.ink,
        }} className="press back-btn">
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: T.ink }}>{pdv.name}</div>
          <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{country.flag} {pdv.country}</div>
        </div>
      </div>

      {/* Estado del PDV */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: statusColor + '20',
          color: statusColor, display: 'grid', placeItems: 'center', fontWeight: 700,
        }}>
          {pdv.status === 'done' ? '✓' : pdv.status === 'in_progress' ? '◐' : '○'}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{statusLabel}</div>
          <div style={{ fontSize: 10, color: T.textMed }}>
            {pdv.status === 'done' ? 'Levantamiento completado'
              : pdv.status === 'in_progress' ? 'Check-in confirmado · puedes iniciar levantamientos'
              : 'Falta hacer el check-in'}
          </div>
        </div>
      </div>

      {/* Banner: check-in en segundo plano */}
      {isProcessing && (
        <div className="pop" style={{
          background: T.infoSoft, border: `1px solid ${T.info}30`, borderRadius: 12,
          padding: '11px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Loader2 size={18} color={T.info} className="spin" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>Verificando check-in en segundo plano…</div>
            <div style={{ fontSize: 11, color: T.textMed }}>Puedes iniciar levantamientos mientras validamos el GPS</div>
          </div>
        </div>
      )}

      {/* Banner: check-in confirmado localmente */}
      {checkedInStatus === 'done' && pdv.status === 'pending' && (
        <div className="pop" style={{
          background: T.successSoft, border: `1px solid ${T.success}30`, borderRadius: 12,
          padding: '11px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={18} color={T.success} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>Check-in confirmado localmente ✓</div>
            <div style={{ fontSize: 11, color: T.textMed }}>Se sincronizará con el servidor al reconectarte</div>
          </div>
        </div>
      )}

      {/* Datos del PDV */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        marginBottom: 18, overflow: 'hidden',
      }} className="rise">
        <button onClick={() => setShowDetails(v => !v)} className="press" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>
            INFORMACIÓN DEL PDV
          </span>
          <ChevronDown size={16} color={T.textMed} style={{
            transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .25s ease',
          }} />
        </button>
        {showDetails && (
          <div style={{ padding: '0 16px 16px', display: 'grid', gap: 12 }}>
            <DetailRow icon={MapPin}    label="Dirección"    value={pdv.addr} />
            <DetailRow icon={Store}     label="Categoría"    value={pdv.cat} />
            <DetailRow icon={BarChart3} label="Canal"        value={pdv.channel} />
            <DetailRow icon={Store}     label="Distribuidor" value={pdv.dist} />
            <DetailRow icon={MapPin}    label="Coordenadas"  value={`${(pdv.lat||0).toFixed(4)}, ${(pdv.lng||0).toFixed(4)}`} />
          </div>
        )}
      </div>

      {/* Levantamientos */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: 16, marginBottom: 18,
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 12 }}>
          LEVANTAMIENTOS
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {SURVEY_KINDS.map(survey => {
            const completed = completedKinds.has(survey.key);
            return (
              <SurveyItem
                key={survey.key}
                survey={survey}
                completed={completed}
                enabled={canSurvey && !completed}
                onStart={() => onStartSurvey && onStartSurvey(survey.key)}
              />
            );
          })}
        </div>
        {!canSurvey && (
          <div style={{ fontSize: 11, color: T.textMed, textAlign: 'center', marginTop: 10 }}>
            Realiza el check-in para habilitar los levantamientos
          </div>
        )}
      </div>

      {/* Botón de check-in (solo si pendiente y sin check-in local) */}
      {pdv.status === 'pending' && !checkedIn && (
        <button onClick={onCheckin} className="press" style={{
          width: '100%', padding: 16, borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`,
          color: T.white, fontWeight: 800, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 10px 22px -12px rgba(198,138,18,.6)',
        }}>
          <Clock size={18} /> Realizar Check-in
        </button>
      )}

      {/* GAP 5: Check-out formal al completar todos los levantamientos */}
      {canCheckout && (
        <button onClick={handleCheckout} disabled={checkingOut} className="press" style={{
          width: '100%', padding: 16, borderRadius: 12, border: 'none',
          background: checkingOut
            ? T.textLow
            : 'linear-gradient(135deg, #2C4256, #1A2F44)',
          color: T.white, fontWeight: 800, fontSize: 14,
          cursor: checkingOut ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 10px 22px -12px rgba(44,66,86,.6)',
          marginTop: 10,
        }}>
          {checkingOut
            ? <><Loader2 size={16} className="spin"/> Cerrando visita…</>
            : <><LogOut size={16}/> Finalizar visita (Check-out)</>}
        </button>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Icon size={14} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMed, letterSpacing: '.2px' }}>{label}</div>
        <div style={{ fontSize: 13, color: T.ink, marginTop: 2, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function SurveyItem({ survey, completed, enabled, onStart }) {
  const Icon = survey.icon;
  return (
    <button onClick={enabled ? onStart : undefined} disabled={!enabled && !completed} className={enabled ? 'press' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      background: completed ? T.successSoft : enabled ? T.surface : T.bg,
      borderRadius: 8,
      border: `1px solid ${completed ? T.success + '30' : T.border}`,
      cursor: completed ? 'default' : enabled ? 'pointer' : 'not-allowed',
      width: '100%', textAlign: 'left',
    }}>
      <Icon size={14} color={completed ? T.success : enabled ? survey.color : T.textLow} />
      <span style={{ fontSize: 12, fontWeight: 600, color: completed ? T.success : enabled ? T.ink : T.textLow, flex: 1 }}>
        {survey.label}
      </span>
      {completed && <CheckCircle2 size={14} color={T.success} />}
      {enabled && !completed && <ChevronRight size={14} color={T.textLow} />}
      {!completed && !enabled && <span style={{ fontSize: 10, color: T.textLow }}>Check-in requerido</span>}
    </button>
  );
}
