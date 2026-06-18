/**
 * PriceSurvey — Levantamiento de precios
 *
 * Flujo principal: Foto(s) → IA lee precios → GVM revisa/ajusta → Guardar
 * - Min 1 foto requerida para guardar
 * - Múltiples fotos permiten mayor cobertura del anaquel
 * - La IA detecta precios automáticamente (badge ✨)
 * - El GVM puede editar cualquier precio detectado o agregar los no detectados
 * - Sin entrada manual como método primario
 */
import { useState, useContext, useMemo } from 'react';
import { T, FONT, DISPLAY, getProductsForCountry, getProductImage } from '../../../lib/constants.jsx';
import { useToast } from '../../Toaster.jsx';
import {
  ChevronLeft, Camera, Loader2, Sparkles, CheckCircle2, X, Filter,
  AlertCircle, ImageIcon,
} from 'lucide-react';
import { CameraContext }                         from '../../../hooks/useCamera.js';
import { analyzePricePhotos, uploadPhoto }       from '../../../lib/supabase.js';
import * as data                                 from '../../../lib/data.js';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function priceDelta(found, psv) {
  if (!found || !psv) return null;
  return ((found - psv) / psv) * 100;
}

function TrafficLight({ found, psv }) {
  const delta = priceDelta(found, psv);
  if (delta === null) return <span style={{ color: T.textLow, fontSize: 11 }}>—</span>;
  const abs = Math.abs(delta);
  const color = abs <= 5 ? T.success : abs <= 15 ? T.warn : T.danger;
  const sign  = delta >= 0 ? '+' : '';
  return (
    <span style={{
      background: color + '20', color, border: `1px solid ${color}40`,
      padding: '2px 6px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
    }}>
      {sign}{delta.toFixed(0)}%
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PriceSurvey({ pdv, user, onBack, onComplete, startedAt }) {
  const toast          = useToast();
  const camApi         = useContext(CameraContext);
  const countryProducts = useMemo(() => getProductsForCountry(pdv.country), [pdv.country]);

  /* ── Estado de filas ─────────────────────────────────────────────────── */
  const [rows, setRows] = useState(() =>
    countryProducts.map(p => ({
      ...p,
      price_found: '',   // precio final (string para input)
      aiPrice:     null, // precio detectado por IA (number)
    }))
  );

  /* ── Fotos ───────────────────────────────────────────────────────────── */
  const [photos,    setPhotos]    = useState([]); // [{ file, url }]
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDone,    setAiDone]    = useState(false);
  const [aiCount,   setAiCount]   = useState(0);

  /* ── UI ──────────────────────────────────────────────────────────────── */
  const [filterGroup, setFilterGroup] = useState('todos');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [done,        setDone]        = useState(false);

  /* ── Cámara ──────────────────────────────────────────────────────────── */
  const addPhoto = () => {
    camApi.open({
      onCapture: (file) => {
        setPhotos(prev => [...prev, { file, url: URL.createObjectURL(file) }]);
        setAiDone(false);
      },
    });
  };

  const removePhoto = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
    setAiDone(false);
  };

  /* ── Análisis IA ─────────────────────────────────────────────────────── */
  const runAI = async () => {
    if (!photos.length || analyzing) return;
    setAnalyzing(true);
    try {
      const suggestions = await analyzePricePhotos(photos.map(p => p.file));
      if (!suggestions.length) {
        toast.warn('La IA no detectó precios legibles. Revisa que las etiquetas sean visibles.');
        return;
      }

      let detected = 0;
      setRows(prev => prev.map(row => {
        // Buscar coincidencia exacta por SKU primero
        let match = suggestions.find(s => s.sku === row.sku);
        // Si no hay exacta, buscar por nombre parcial
        if (!match) {
          match = suggestions.find(s =>
            s.sku.toLowerCase().includes(row.name.toLowerCase().split(' ')[0].toLowerCase()) ||
            row.sku.toLowerCase().includes((s.sku || '').toLowerCase().split(' ')[0].toLowerCase())
          );
        }
        if (!match || !match.price || match.price <= 0) return row;
        detected++;
        return {
          ...row,
          aiPrice:     match.price,
          price_found: String(match.price.toFixed(2)),
        };
      }));

      setAiDone(true);
      setAiCount(detected);
      toast.success(`✨ IA detectó ${detected} precios en ${photos.length} foto${photos.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(`Error de análisis: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Edición manual ──────────────────────────────────────────────────── */
  const updatePrice = (sku, val) => {
    setRows(prev => prev.map(r =>
      r.sku !== sku ? r : { ...r, price_found: val }
    ));
  };

  const clearAiPrice = (sku) => {
    setRows(prev => prev.map(r =>
      r.sku !== sku ? r : { ...r, aiPrice: null, price_found: '' }
    ));
  };

  /* ── Vistas filtradas ────────────────────────────────────────────────── */
  const aiRows    = rows.filter(r => r.aiPrice !== null);
  const filledRows = rows.filter(r => r.price_found !== '');

  const visibleRows = useMemo(() => {
    if (filterGroup === 'etx')          return rows.filter(r => r.abi);
    if (filterGroup === 'competencia')  return rows.filter(r => !r.abi);
    if (filterGroup === 'ia')           return rows.filter(r => r.aiPrice !== null);
    if (filterGroup === 'pendientes')   return rows.filter(r => r.price_found === '');
    return rows;
  }, [rows, filterGroup]);

  const groups = useMemo(() => {
    const map = {};
    visibleRows.forEach(r => {
      if (!map[r.brand]) map[r.brand] = [];
      map[r.brand].push(r);
    });
    return map;
  }, [visibleRows]);

  /* ── Guardar ─────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.warn('⚠️ Toma al menos una foto del anaquel para registrar precios.');
      return;
    }

    setSaving(true);
    try {
      const completedAt     = new Date().toISOString();
      const durationSeconds = startedAt
        ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null;

      const surveyNotes = [
        notes || null,
        aiDone ? `IA analizó ${photos.length} foto(s) · ${aiCount} precios detectados` : null,
      ].filter(Boolean).join(' | ');

      const survey = await data.createSurvey({
        pdv_id: pdv.id, kind: 'precios', country: pdv.country,
        created_by: user.id, status: 'done',
        notes: surveyNotes || null,
        started_at: startedAt || null,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
      });

      const filled = rows.filter(r => r.price_found !== '');
      if (filled.length > 0) {
        await data.createSurveyItems(filled.map(r => ({
          survey_id:   survey.id,
          sku:         r.sku,
          price_found: parseFloat(r.price_found) || null,
          psv:         r.psv,
          abi:         r.abi,
          brand:       r.brand,
        })));
      }

      for (const p of photos) {
        const { url } = await uploadPhoto(p.file, `${pdv.id}-precio-${Date.now()}`, 'precios');
        await data.createSurveyPhoto({ survey_id: survey.id, url });
      }

      setDone(true);
      setTimeout(() => onComplete('precios'), 1200);
    } catch (e) {
      toast.error(`Error al guardar: ${e.message}`);
      setSaving(false);
    }
  };

  /* ── Done ────────────────────────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: FONT }}>
        <CheckCircle2 size={48} color={T.success} style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.ink, fontWeight: 600 }}>
          ¡Precios guardados!
        </div>
        <div style={{ fontSize: 13, color: T.textMed, marginTop: 8 }}>
          {filledRows.length} precios · {photos.length} foto{photos.length > 1 ? 's' : ''}
          {aiDone && ` · ✨ ${aiCount} detectados por IA`}
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  const missingPhoto = photos.length === 0;

  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      <Header title="Precios" subtitle={pdv.name} onBack={onBack} disabled={saving} />

      {/* ── BLOQUE DE FOTOS ────────────────────────────────────────────── */}
      <div style={{
        background: T.surface,
        border: `1.5px solid ${missingPhoto ? T.danger : aiDone ? T.success : T.border}`,
        borderRadius: 14, padding: 14, marginBottom: 14,
        transition: 'border-color .25s ease',
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ImageIcon size={14} color={missingPhoto ? T.danger : T.textMed} />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.ink, letterSpacing: '.2px' }}>
              FOTOS DEL ANAQUEL
            </span>
            <span style={{
              fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
              background: missingPhoto ? T.dangerSoft : T.successSoft,
              color: missingPhoto ? T.danger : T.success,
            }}>
              {missingPhoto ? 'OBLIGATORIA' : `${photos.length} foto${photos.length > 1 ? 's' : ''}`}
            </span>
          </div>
          {aiDone && (
            <span style={{ fontSize: 10.5, color: T.success, fontWeight: 700 }}>
              ✨ {aiCount} precios detectados
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: T.textMed, marginBottom: 12, lineHeight: 1.5 }}>
          Captura las etiquetas de precios del anaquel. Puedes tomar varias fotos para mayor cobertura.
        </div>

        {/* Miniaturas */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {photos.map((p, idx) => (
            <div key={idx} style={{
              position: 'relative', width: 72, height: 72,
              borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            }}>
              <img src={p.url} alt={`foto-${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => removePhoto(idx)} style={{
                position: 'absolute', top: 3, right: 3, width: 18, height: 18,
                borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.65)',
                color: '#FFF', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0,
              }}>
                <X size={10} />
              </button>
              <div style={{
                position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,0,0,.6)',
                color: '#FFF', fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 4,
              }}>
                {idx + 1}
              </div>
            </div>
          ))}

          {/* Añadir foto */}
          {photos.length < 6 && (
            <button onClick={addPhoto} style={{
              width: 72, height: 72, borderRadius: 10,
              border: `2px dashed ${missingPhoto ? T.danger : T.border}`,
              background: missingPhoto ? T.dangerSoft : T.bg,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'border-color .2s, background .2s',
            }}>
              <Camera size={20} color={missingPhoto ? T.danger : T.textMed} />
              <span style={{ fontSize: 9, fontWeight: 700, color: missingPhoto ? T.danger : T.textLow }}>
                {photos.length === 0 ? 'Tomar foto' : '+ Otra'}
              </span>
            </button>
          )}
        </div>

        {/* Botón analizar */}
        <button
          onClick={runAI}
          disabled={photos.length === 0 || analyzing}
          className="press"
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
            background: photos.length === 0 ? T.surfaceAlt
              : analyzing ? '#7C3AED'
              : aiDone    ? T.success
              : '#7C3AED',
            color: photos.length === 0 ? T.textLow : T.white,
            fontWeight: 800, fontSize: 13, cursor: photos.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: photos.length === 0 ? 0.5 : 1,
            transition: 'background .25s ease',
          }}
        >
          {analyzing
            ? <><Loader2 size={15} style={{ animation: 'spin .85s linear infinite' }} /> Leyendo precios…</>
            : <><Sparkles size={15} />
              {aiDone
                ? `✓ ${aiCount} precios leídos · Re-analizar`
                : photos.length === 0
                  ? 'Toma fotos para leer precios'
                  : `Leer precios de ${photos.length} foto${photos.length > 1 ? 's' : ''} con IA`}
            </>}
        </button>

        {aiDone && (
          <div style={{
            marginTop: 8, padding: '7px 10px', background: '#F3F0FF', borderRadius: 8,
            fontSize: 11, color: '#7C3AED', fontWeight: 600, lineHeight: 1.4,
          }}>
            ✨ Precios en morado fueron leídos por la IA. Toca cualquier precio para corregirlo.
          </div>
        )}
      </div>

      {/* Alerta sin foto */}
      {missingPhoto && (
        <div style={{
          background: T.dangerSoft, border: `1px solid ${T.danger}30`,
          borderRadius: 10, padding: '9px 13px', marginBottom: 14,
          fontSize: 12, color: T.danger, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={14} />
          Toma al menos una foto del anaquel para poder guardar el levantamiento de precios.
        </div>
      )}

      {/* ── FILTROS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={13} color={T.textLow} />
        {[
          ['todos',       `Todos (${rows.length})`],
          ['etx',         `ETX (${rows.filter(r => r.abi).length})`],
          ['competencia', `Comp. (${rows.filter(r => !r.abi).length})`],
          ...(aiRows.length > 0   ? [['ia',        `✨ IA (${aiRows.length})`]]              : []),
          ...(filledRows.length < rows.length ? [['pendientes', `Sin precio (${rows.filter(r => r.price_found === '').length})`]] : []),
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilterGroup(v)} className="press" style={{
            padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${filterGroup === v ? (v === 'ia' ? '#8B5CF6' : T.primary) : T.border}`,
            background: filterGroup === v ? (v === 'ia' ? '#F3F0FF' : T.primarySoft) : T.surface,
            color:      filterGroup === v ? (v === 'ia' ? '#7C3AED'  : T.primaryDim)  : T.textMed,
          }}>{l}</button>
        ))}
      </div>

      {/* ── TABLA ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Cabecera */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 56px 80px 52px',
          padding: '9px 14px', background: T.surfaceAlt, gap: 8,
          borderBottom: `1px solid ${T.border}`,
        }}>
          {['SKU', 'PSV', 'Precio $', 'Δ'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>{h}</div>
          ))}
        </div>

        {Object.keys(groups).length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.textLow, fontSize: 12 }}>
            No hay productos con ese filtro
          </div>
        )}

        {Object.entries(groups).map(([brand, products]) => (
          <div key={brand}>
            {/* Marca */}
            <div style={{
              padding: '6px 14px', background: T.bg,
              borderBottom: `1px solid ${T.border}`, borderTop: `1px solid ${T.border}`,
              fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.4px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: products[0].abi ? T.primary : T.textLow }} />
              {brand.toUpperCase()}
              {products[0].abi && (
                <span style={{ background: T.primarySoft, color: T.primaryDim, fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>ETX</span>
              )}
            </div>

            {products.map((row, idx) => {
              const isAI  = row.aiPrice !== null;
              const delta = priceDelta(parseFloat(row.price_found), row.psv);
              return (
                <div key={row.sku} style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 56px 80px 52px',
                  padding: '9px 14px', gap: 8, alignItems: 'center',
                  borderBottom: idx < products.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: isAI ? '#FAFAFF' : row.price_found ? T.successSoft + '30' : 'transparent',
                }}>

                  {/* Producto */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getProductImage(row.sku)
                      ? <img src={getProductImage(row.sku)} alt={row.name}
                          style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 7, background: T.bg, flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: 30, height: 30, borderRadius: 7, background: T.surfaceAlt, flexShrink: 0 }} />
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, color: T.ink, fontWeight: 600, lineHeight: 1.3 }}>
                          {row.name}
                        </span>
                        {isAI && (
                          <button
                            onClick={() => clearAiPrice(row.sku)}
                            title="Limpiar sugerencia IA"
                            style={{
                              fontSize: 8.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                              background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE',
                              cursor: 'pointer',
                            }}
                          >✨ IA</button>
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: T.textLow, marginTop: 1 }}>{row.pack} · {row.size}ml</div>
                    </div>
                  </div>

                  {/* PSV referencia */}
                  <div style={{ fontSize: 11, color: T.textMed }}>
                    ${row.psv?.toFixed(2) ?? '—'}
                  </div>

                  {/* Input de precio */}
                  <input
                    type="number" step="0.01" min="0"
                    placeholder={isAI ? `$${row.aiPrice?.toFixed(2)}` : '0.00'}
                    value={row.price_found}
                    onChange={e => updatePrice(row.sku, e.target.value)}
                    style={{
                      width: '100%', padding: '5px 8px',
                      border: `1.5px solid ${
                        isAI && row.price_found !== '' ? '#8B5CF6'
                          : row.price_found !== '' ? T.primary
                          : T.border
                      }`,
                      borderRadius: 8, fontSize: 12, fontWeight: 700,
                      color: isAI && row.price_found !== '' ? '#7C3AED' : T.ink,
                      background: isAI ? '#FAFAFF' : T.white,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />

                  {/* Semáforo */}
                  <TrafficLight found={parseFloat(row.price_found)} psv={row.psv} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Alerta de desviaciones grandes */}
      {(() => {
        const alerts = rows.filter(r => {
          const d = priceDelta(parseFloat(r.price_found), r.psv);
          return d !== null && Math.abs(d) > 15;
        });
        if (!alerts.length) return null;
        return (
          <div style={{
            background: T.dangerSoft, border: `1px solid ${T.danger}30`,
            borderRadius: 10, padding: '9px 13px', marginBottom: 14,
            fontSize: 12, color: T.danger,
          }}>
            <strong>{alerts.length} SKU(s) con desviación &gt;15% del PSV:</strong>{' '}
            {alerts.slice(0, 3).map(r => r.name).join(', ')}{alerts.length > 3 ? ` +${alerts.length - 3}` : ''}
          </div>
        );
      })()}

      {/* Notas */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMed, letterSpacing: '.3px', display: 'block', marginBottom: 6 }}>
          OBSERVACIONES
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Condiciones del anaquel, promos activas, observaciones…"
          style={{
            width: '100%', padding: 10, border: `1px solid ${T.border}`, borderRadius: 10,
            fontSize: 12, color: T.ink, resize: 'vertical', fontFamily: FONT,
            boxSizing: 'border-box', background: T.surface, outline: 'none',
          }} />
      </div>

      {/* Guardar */}
      <button onClick={handleSubmit} disabled={saving} className="press" style={{
        width: '100%', padding: 13, borderRadius: 11, border: 'none',
        background: saving ? T.textLow : missingPhoto ? T.textLow : T.primary,
        color: T.white, fontWeight: 700, fontSize: 13,
        cursor: saving || missingPhoto ? 'default' : 'pointer',
        opacity: saving ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: (!saving && !missingPhoto) ? `0 10px 24px -12px rgba(198,138,18,.6)` : 'none',
      }}>
        {saving
          ? <><Loader2 size={15} className="spin" /> Guardando…</>
          : <><CheckCircle2 size={15} /> Guardar precios ({filledRows.length} de {rows.length})</>}
      </button>

      <div style={{ fontSize: 10.5, color: T.textLow, textAlign: 'center', marginTop: 8 }}>
        {photos.length === 0
          ? '⚠️ Necesitas al menos 1 foto para guardar'
          : `${filledRows.length} precios completados · ${rows.length - filledRows.length} pendientes`}
      </div>
    </div>
  );
}

/* ── Componentes auxiliares ──────────────────────────────────────────────── */
function Header({ title, subtitle, onBack, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <button onClick={onBack} disabled={disabled} className="press back-btn" style={{
        width: 40, height: 40, borderRadius: 10, background: T.surface,
        border: `1px solid ${T.border}`, cursor: disabled ? 'default' : 'pointer',
        display: 'grid', placeItems: 'center', color: T.ink,
      }}>
        <ChevronLeft size={18} />
      </button>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: T.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}
