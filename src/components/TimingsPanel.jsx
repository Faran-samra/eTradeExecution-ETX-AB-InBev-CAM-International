/**
 * TimingsPanel — muestra al supervisor cuánto tarda cada GVM
 * en completar los levantamientos de cada PDV.
 *
 * Props:
 *   user       — usuario supervisor/admin
 *   users      — lista de perfiles
 *   catalog    — lista de PDVs
 */
import { useState, useEffect, useMemo } from 'react';
import { T, FONT, DISPLAY, SURVEY_KINDS, getCountry } from '../lib/constants.jsx';
import { fetchSurveys } from '../lib/data.js';
import { Loader2, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Timer } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmtSeconds(sec) {
  if (!sec || sec < 0) return '—';
  if (sec < 60)  return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60)   return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function durationColor(sec) {
  if (!sec) return T.textLow;
  if (sec <  600) return T.success;   // < 10 min
  if (sec < 1500) return T.warn;      // < 25 min
  if (sec < 2700) return '#E07B2A';   // < 45 min
  return T.danger;                     // > 45 min
}

function avg(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

/* Label de tipo de levantamiento */
const kindLabel = Object.fromEntries(SURVEY_KINDS.map(s => [s.key, s.label]));

/* ── componente principal ─────────────────────────────────────────────────── */
export default function TimingsPanel({ user, users, catalog }) {
  const isAdmin   = user.role === 'admin';
  const [surveys,  setSurveys]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(null); // pdvId del acordeón abierto
  const [filterGvm, setFilterGvm] = useState(''); // id del GVM a filtrar

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSurveys(isAdmin ? {} : { country: user.country })
      .then(data => {
        // Solo incluir surveys con timing
        setSurveys(data.filter(s => s.duration_seconds != null));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.country, isAdmin]);

  const gvms = useMemo(() =>
    users.filter(u => u.role === 'gvm' && (isAdmin || u.country === user.country)),
    [users, isAdmin, user.country]
  );

  const visibleSurveys = useMemo(() =>
    filterGvm ? surveys.filter(s => s.created_by === filterGvm) : surveys,
    [surveys, filterGvm]
  );

  // Agrupar surveys por PDV
  const byPdv = useMemo(() => {
    const map = {};
    visibleSurveys.forEach(s => {
      if (!map[s.pdv_id]) map[s.pdv_id] = [];
      map[s.pdv_id].push(s);
    });
    return map;
  }, [visibleSurveys]);

  // Stats globales
  const globalStats = useMemo(() => {
    const durations = visibleSurveys.map(s => s.duration_seconds).filter(Boolean);
    if (!durations.length) return null;
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      total:   visibleSurveys.length,
      avgSec:  avg(durations),
      minSec:  sorted[0],
      maxSec:  sorted[sorted.length - 1],
      p50:     sorted[Math.floor(sorted.length * 0.5)],
      onTarget: durations.filter(d => d < 1500).length, // < 25 min
    };
  }, [visibleSurveys]);

  // Stats por GVM
  const gvmStats = useMemo(() => {
    return gvms.map(g => {
      const mySurveys = visibleSurveys.filter(s => s.created_by === g.id);
      const durations  = mySurveys.map(s => s.duration_seconds).filter(Boolean);
      return {
        ...g,
        count:   mySurveys.length,
        avgSec:  avg(durations),
        minSec:  durations.length ? Math.min(...durations) : null,
        maxSec:  durations.length ? Math.max(...durations) : null,
      };
    }).filter(g => g.count > 0).sort((a, b) => (a.avgSec || 99999) - (b.avgSec || 99999));
  }, [gvms, visibleSurveys]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, fontFamily: FONT }}>
        <Loader2 size={28} className="spin" color={T.primary} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: T.textMed }}>Cargando tiempos de levantamiento…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: T.dangerSoft, border: `1px solid ${T.danger}30`, borderRadius: 12, padding: 16, fontFamily: FONT }}>
        <AlertCircle size={16} color={T.danger} />
        <span style={{ marginLeft: 8, fontSize: 13, color: T.danger }}>{error}</span>
      </div>
    );
  }

  if (!globalStats) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 24px', border: `1.5px dashed ${T.border}`,
        borderRadius: 14, background: T.surface, fontFamily: FONT,
      }}>
        <Timer size={32} color={T.textLow} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Sin datos de tiempo aún</div>
        <div style={{ fontSize: 12, color: T.textMed, marginTop: 6 }}>
          Los tiempos aparecerán aquí en cuanto los GVMs completen levantamientos.
        </div>
      </div>
    );
  }

  return (
    <div className="fade" style={{ fontFamily: FONT }}>

      {/* Filtro por GVM */}
      {gvms.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.textMed, fontWeight: 700 }}>FILTRAR GVM:</span>
          {[{ id: '', name: 'Todos', initials: '✦', color: T.primary }, ...gvms].map(g => (
            <button key={g.id} onClick={() => setFilterGvm(g.id)} className="press" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 8,
              border: `1px solid ${filterGvm === g.id ? T.primary : T.border}`,
              background: filterGvm === g.id ? T.primarySoft : T.surface,
              color: filterGvm === g.id ? T.primaryDim : T.textMed,
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}>
              {g.id && (
                <span style={{
                  width: 20, height: 20, borderRadius: 6, background: g.color, color: T.white,
                  fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center',
                }}>{g.initials}</span>
              )}
              {g.id ? g.name.split(' ')[0] : 'Todos'}
            </button>
          ))}
        </div>
      )}

      {/* ── KPIs globales ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <TimeStatCard
          label="Promedio"
          value={fmtSeconds(globalStats.avgSec)}
          sub={`${globalStats.total} levantamientos`}
          color={durationColor(globalStats.avgSec)}
          icon={Clock}
        />
        <TimeStatCard
          label="Más rápido"
          value={fmtSeconds(globalStats.minSec)}
          sub="mejor marca"
          color={T.success}
          icon={TrendingDown}
        />
        <TimeStatCard
          label="Más lento"
          value={fmtSeconds(globalStats.maxSec)}
          sub="revisable"
          color={durationColor(globalStats.maxSec)}
          icon={TrendingUp}
        />
        <TimeStatCard
          label="En meta"
          value={`${Math.round((globalStats.onTarget / globalStats.total) * 100)}%`}
          sub="< 25 min por levant."
          color={T.info}
          icon={CheckCircle2}
        />
      </div>

      {/* ── Ranking de GVMs por tiempo promedio ───────────────────────────── */}
      {gvmStats.length > 1 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
          padding: 18, marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 14 }}>
            RANKING POR VELOCIDAD · GVMs
          </div>
          <div style={{ display: 'grid', gap: 11 }}>
            {gvmStats.map((g, i) => {
              const barW = globalStats.maxSec
                ? Math.min(100, Math.round((g.avgSec / globalStats.maxSec) * 100))
                : 0;
              const color = durationColor(g.avgSec);
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: T.textLow, fontWeight: 700, minWidth: 16 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: g.color + '22',
                        color: g.color, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10,
                      }}>{g.initials}</div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{g.name}</div>
                        <div style={{ fontSize: 10, color: T.textMed }}>
                          {getCountry(g.country).flag} {g.count} levantamientos
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtSeconds(g.avgSec)}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMed }}>
                        {fmtSeconds(g.minSec)} – {fmtSeconds(g.maxSec)}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${barW}%`, height: '100%',
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      borderRadius: 3, transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detalle por PDV ───────────────────────────────────────────────── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          padding: '13px 18px', background: T.surfaceAlt,
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11, fontWeight: 800, color: T.textMed, letterSpacing: '.3px',
        }}>
          DETALLE POR PDV · {Object.keys(byPdv).length} puntos con medición
        </div>

        {Object.entries(byPdv).map(([pdvId, pdvSurveys], idx) => {
          const pdvInfo   = catalog.find(p => p.id === pdvId);
          const durations = pdvSurveys.map(s => s.duration_seconds).filter(Boolean);
          const avgSec    = avg(durations);
          const isOpen    = expanded === pdvId;

          return (
            <div key={pdvId} style={{ borderBottom: idx < Object.keys(byPdv).length - 1 ? `1px solid ${T.border}` : 'none' }}>
              {/* Fila principal (clickable) */}
              <button
                onClick={() => setExpanded(isOpen ? null : pdvId)}
                style={{
                  width: '100%', padding: '13px 18px', border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                }}
                className="row-link"
              >
                {/* Indicador de duración */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: durationColor(avgSec),
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pdvInfo?.name || pdvId}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.textMed, marginTop: 2 }}>
                    {pdvSurveys.length} levantamiento{pdvSurveys.length > 1 ? 's' : ''}
                    {pdvInfo && ` · ${getCountry(pdvInfo.country).flag} ${pdvInfo.country}`}
                  </div>
                </div>

                {/* Tiempo promedio en esta tienda */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800, color: durationColor(avgSec),
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtSeconds(avgSec)}
                  </div>
                  <div style={{ fontSize: 10, color: T.textLow }}>promedio</div>
                </div>

                {isOpen ? <ChevronUp size={16} color={T.textLow} /> : <ChevronDown size={16} color={T.textLow} />}
              </button>

              {/* Acordeón: detalle de cada levantamiento */}
              {isOpen && (
                <div className="fade" style={{
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg,
                  padding: '4px 0 8px',
                }}>
                  {/* Sub-cabecera */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px',
                    padding: '7px 18px', gap: 8,
                    fontSize: 10, fontWeight: 800, color: T.textLow, letterSpacing: '.3px',
                  }}>
                    {['Tipo', 'GVM', 'Inicio', 'Duración'].map(h => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>

                  {pdvSurveys
                    .slice()
                    .sort((a, b) => new Date(b.started_at || b.created_at) - new Date(a.started_at || a.created_at))
                    .map(s => {
                      const gvm  = users.find(u => u.id === s.created_by);
                      const sec  = s.duration_seconds;
                      const col  = durationColor(sec);
                      const when = s.started_at
                        ? new Date(s.started_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })
                        : '—';
                      return (
                        <div key={s.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px',
                          padding: '9px 18px', gap: 8, alignItems: 'center',
                          borderTop: `1px solid ${T.border}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {(() => {
                              const meta = SURVEY_KINDS.find(k => k.key === s.kind);
                              if (!meta) return null;
                              const Icon = meta.icon;
                              return <Icon size={12} color={meta.color} />;
                            })()}
                            <span style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>
                              {kindLabel[s.kind] || s.kind}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {gvm && (
                              <span style={{
                                width: 20, height: 20, borderRadius: 5, background: gvm.color + '22',
                                color: gvm.color, fontSize: 8.5, fontWeight: 800,
                                display: 'grid', placeItems: 'center', flexShrink: 0,
                              }}>{gvm.initials}</span>
                            )}
                            <span style={{ fontSize: 11, color: T.textMed, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {gvm?.name?.split(' ')[0] || '—'}
                            </span>
                          </div>

                          <div style={{ fontSize: 11, color: T.textMed, fontVariantNumeric: 'tabular-nums' }}>
                            {when}
                          </div>

                          <div style={{
                            fontSize: 13, fontWeight: 800, color: col,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {fmtSeconds(sec)}
                            <DurationBadge sec={sec} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(byPdv).length === 0 && (
          <div style={{ padding: 28, textAlign: 'center', color: T.textMed, fontSize: 13 }}>
            No hay levantamientos con tiempo registrado para los filtros actuales.
          </div>
        )}
      </div>

      {/* Leyenda de colores */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
        marginTop: 14, padding: '10px 0',
      }}>
        {[
          [T.success, '< 10 min — Rápido'],
          [T.warn,    '10-25 min — Normal'],
          ['#E07B2A', '25-45 min — Lento'],
          [T.danger,  '> 45 min — Muy lento'],
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: T.textMed }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimeStatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14,
      borderTop: `3px solid ${color}`,
    }} className="rise">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>
          {label.toUpperCase()}
        </span>
        <Icon size={14} color={color} />
      </div>
      <div style={{
        fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700,
        color: T.ink, marginTop: 6, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.textLow, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function DurationBadge({ sec }) {
  if (!sec) return null;
  if (sec < 600)  return null; // rápido → sin badge
  if (sec < 1500) return <span style={{ display: 'block', fontSize: 9, color: T.warn, fontWeight: 700 }}>Normal</span>;
  if (sec < 2700) return <span style={{ display: 'block', fontSize: 9, color: '#E07B2A', fontWeight: 700 }}>Lento</span>;
  return <span style={{ display: 'block', fontSize: 9, color: T.danger, fontWeight: 700 }}>Revisar</span>;
}
