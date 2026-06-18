import { useState, useMemo, useContext } from 'react';
import { T, FONT, DISPLAY, getProductsForCountry, getProductImage } from '../../../lib/constants.jsx';
import { useToast } from '../../Toaster.jsx';
import { ChevronLeft, Plus, Minus, CheckCircle2, Loader2, Filter, Camera, Sparkles, X } from 'lucide-react';
import { CameraContext } from '../../../hooks/useCamera.js';
import { uploadPhoto, analyzeInventoryPhotos } from '../../../lib/supabase.js';
import * as data from '../../../lib/data.js';

/* ══════════════════════════════════════════════════════════════════════════
   InventorySurvey
   - Fotos OPCIONALES para análisis IA
   - Múltiples fotos permitidas
   - IA estima unidades y pre-llena la tabla (con badge ✨)
   - GVM puede ajustar o ignorar las sugerencias
   ══════════════════════════════════════════════════════════════════════════ */
export default function InventorySurvey({ pdv, user, onBack, onComplete, startedAt }) {
  const toast          = useToast();
  const camApi         = useContext(CameraContext);
  const countryProducts = useMemo(() => getProductsForCountry(pdv.country), [pdv.country]);

  // Filas del inventario: qty manual + sugerencia IA separadas
  const [rows, setRows] = useState(() =>
    countryProducts.map(p => ({
      sku:      p.sku,
      brand:    p.brand,
      abi:      p.abi,
      qty:      0,       // cantidad final
      aiQty:    null,    // sugerencia IA (null = no hay)
      oos:      false,
    }))
  );

  // Fotos para análisis IA (opcionales)
  const [photos,    setPhotos]    = useState([]); // [{ file, url }]
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDone,    setAiDone]    = useState(false); // si ya corrió la IA

  const [filterGroup, setFilterGroup] = useState('todos');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [done,        setDone]        = useState(false);

  /* ── Cámara ─────────────────────────────────────────────────────────── */
  const addPhoto = () => {
    camApi.open({
      onCapture: (file) => {
        setPhotos(prev => [...prev, { file, url: URL.createObjectURL(file) }]);
        setAiDone(false); // nueva foto → análisis pendiente
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
    if (photos.length === 0) return;
    setAnalyzing(true);
    try {
      const suggestions = await analyzeInventoryPhotos(photos.map(p => p.file));
      if (!suggestions.length) {
        toast.warn('La IA no identificó productos. Intenta con una foto más clara.');
        return;
      }
      // Aplicar sugerencias IA a las filas
      setRows(prev => prev.map(row => {
        const s = suggestions.find(s => s.sku === row.sku);
        if (!s || s.qty <= 0) return row;
        return {
          ...row,
          aiQty: s.qty,
          qty:   s.qty,   // pre-llenar con la sugerencia
          oos:   false,
        };
      }));
      const found = suggestions.filter(s => s.qty > 0).length;
      setAiDone(true);
      toast.success(`✨ IA detectó ${found} SKUs en ${photos.length} foto${photos.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(`Error de análisis: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Tabla ───────────────────────────────────────────────────────────── */
  const setQty = (sku, delta) => {
    setRows(prev => prev.map(r => {
      if (r.sku !== sku) return r;
      const next = Math.max(0, r.qty + delta);
      return { ...r, qty: next, oos: next === 0 ? r.oos : false };
    }));
  };

  const toggleOos = (sku) => {
    setRows(prev => prev.map(r =>
      r.sku !== sku ? r : { ...r, oos: !r.oos, qty: !r.oos ? 0 : r.qty }
    ));
  };

  const clearAiSuggestion = (sku) => {
    setRows(prev => prev.map(r =>
      r.sku !== sku ? r : { ...r, aiQty: null }
    ));
  };

  /* ── Vistas filtradas ────────────────────────────────────────────────── */
  const visibleRows = useMemo(() => {
    if (filterGroup === 'etx')         return rows.filter(r => r.abi);
    if (filterGroup === 'competencia') return rows.filter(r => !r.abi);
    if (filterGroup === 'ia')          return rows.filter(r => r.aiQty !== null);
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

  const oosRows      = rows.filter(r => r.oos);
  const touchedRows  = rows.filter(r => r.qty > 0 || r.oos);
  const aiRows       = rows.filter(r => r.aiQty !== null);

  /* ── Guardar ─────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const completedAt     = new Date().toISOString();
      const durationSeconds = startedAt
        ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null;

      const surveyNotes = [
        notes || null,
        aiDone ? `IA analizó ${photos.length} foto(s) · ${aiRows.length} SKUs detectados` : null,
      ].filter(Boolean).join(' | ');

      const survey = await data.createSurvey({
        pdv_id: pdv.id, kind: 'inventario', country: pdv.country,
        created_by: user.id, status: 'done',
        notes: surveyNotes || null,
        started_at: startedAt || null,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
      });

      await data.createSurveyItems(rows.map(r => ({
        survey_id: survey.id, sku: r.sku, qty: r.qty, oos: r.oos,
      })));

      // Subir fotos si las hay
      for (const p of photos) {
        const { url } = await uploadPhoto(p.file, `${pdv.id}-inv-${Date.now()}`, 'inventario');
        await data.createSurveyPhoto({ survey_id: survey.id, url });
      }

      setDone(true);
      setTimeout(() => onComplete('inventario'), 1200);
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
          ¡Inventario guardado!
        </div>
        <div style={{ fontSize: 13, color: T.textMed, marginTop: 8 }}>
          {touchedRows.length} SKUs · {oosRows.length} OOS
          {aiDone && ` · ✨ ${aiRows.length} detectados por IA`}
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      <Header title="Inventario" subtitle={pdv.name} onBack={onBack} disabled={saving} />

      {/* KPIs rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <Stat label="Total SKUs"  value={rows.length}                       color={T.primary} />
        <Stat label="Con stock"   value={rows.filter(r => r.qty > 0).length} color={T.success} />
        <Stat label="OOS"         value={oosRows.length}  color={oosRows.length > 0 ? T.danger : T.textLow} />
      </div>

      {/* ── SECCIÓN IA ─────────────────────────────────────────────────── */}
      <div style={{
        background: T.surface,
        border: `1.5px solid ${aiDone ? '#8B5CF6' : T.border}`,
        borderRadius: 14, padding: 14, marginBottom: 14,
        transition: 'border-color .25s ease',
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={15} color="#8B5CF6" />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.ink, letterSpacing: '.2px' }}>
              ANÁLISIS IA
            </span>
            <span style={{
              fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
              background: '#F3F0FF', color: '#8B5CF6',
            }}>
              OPCIONAL
            </span>
          </div>
          {aiDone && (
            <span style={{ fontSize: 10.5, color: '#8B5CF6', fontWeight: 700 }}>
              ✨ {aiRows.length} SKUs detectados
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: T.textMed, marginBottom: 12, lineHeight: 1.5 }}>
          Toma fotos del anaquel o bodega y la IA contará las unidades por marca.
          Puedes ajustar los resultados antes de guardar.
        </div>

        {/* Grid de fotos */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {photos.map((p, idx) => (
            <div key={idx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              <img src={p.url} alt={`foto-${idx+1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => removePhoto(idx)} style={{
                position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.65)',
                color: '#FFF', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0,
              }}>
                <X size={10} />
              </button>
              <div style={{
                position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,.6)',
                color: '#FFF', fontSize: 8.5, fontWeight: 800, padding: '1px 4px', borderRadius: 4,
              }}>
                {idx + 1}
              </div>
            </div>
          ))}

          {/* Botón añadir foto */}
          <button onClick={addPhoto} style={{
            width: 64, height: 64, borderRadius: 10,
            border: `2px dashed ${T.border}`,
            background: T.bg, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            <Camera size={18} color={T.textMed} />
            <span style={{ fontSize: 8.5, fontWeight: 700, color: T.textLow }}>
              {photos.length === 0 ? 'Añadir' : '+Foto'}
            </span>
          </button>
        </div>

        {/* Botón analizar */}
        <button
          onClick={runAI}
          disabled={photos.length === 0 || analyzing}
          className="press"
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
            background: photos.length === 0
              ? T.surfaceAlt
              : analyzing
                ? '#7C3AED'
                : aiDone
                  ? '#059669'  // verde si ya analizó
                  : '#7C3AED', // morado si pendiente
            color: photos.length === 0 ? T.textLow : T.white,
            fontWeight: 800, fontSize: 13, cursor: photos.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .25s ease',
            opacity: photos.length === 0 ? 0.5 : 1,
          }}
        >
          {analyzing && (
            <Loader2 size={15} style={{ animation: 'spin .85s linear infinite' }} />
          )}
          {!analyzing && (
            <Sparkles size={15} />
          )}
          {analyzing
            ? `Analizando ${photos.length} foto${photos.length > 1 ? 's' : ''}…`
            : aiDone
              ? `✓ Analizado · ${aiRows.length} SKUs · Re-analizar`
              : photos.length === 0
                ? 'Toma fotos para analizar'
                : `Analizar ${photos.length} foto${photos.length > 1 ? 's' : ''} con IA`}
        </button>

        {/* Hint cuando la IA ya corrió */}
        {aiDone && (
          <div style={{
            marginTop: 8, padding: '7px 10px', background: '#F3F0FF', borderRadius: 8,
            fontSize: 11, color: '#7C3AED', fontWeight: 600, lineHeight: 1.4,
          }}>
            ✨ Las cantidades con el badge morado fueron detectadas por IA. Puedes ajustarlas con los botones + / −
          </div>
        )}
      </div>

      {/* OOS Alert */}
      {oosRows.length > 0 && (
        <div style={{
          background: T.dangerSoft, border: `1px solid ${T.danger}30`, borderRadius: 10,
          padding: '9px 12px', marginBottom: 14, fontSize: 12, color: T.danger,
        }}>
          <strong>{oosRows.length} sin stock:</strong>{' '}
          {oosRows.slice(0, 3).map(r => {
            const prod = countryProducts.find(p => p.sku === r.sku);
            return prod?.name || r.sku;
          }).join(', ')}{oosRows.length > 3 ? ` +${oosRows.length - 3}` : ''}
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={13} color={T.textLow} />
        {[
          ['todos',        `Todos (${rows.length})`],
          ['etx',          `ETX (${rows.filter(r => r.abi).length})`],
          ['competencia',  `Comp. (${rows.filter(r => !r.abi).length})`],
          ...(aiRows.length > 0 ? [['ia', `✨ IA (${aiRows.length})`]] : []),
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilterGroup(v)} className="press" style={{
            padding: '5px 11px', borderRadius: 8,
            border: `1px solid ${filterGroup === v ? (v === 'ia' ? '#8B5CF6' : T.primary) : T.border}`,
            background: filterGroup === v ? (v === 'ia' ? '#F3F0FF' : T.primarySoft) : T.surface,
            color: filterGroup === v ? (v === 'ia' ? '#7C3AED' : T.primaryDim) : T.textMed,
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Tabla de inventario ──────────────────────────────────────────── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Cabecera */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 120px 46px',
          padding: '9px 14px', background: T.surfaceAlt, gap: 8,
          borderBottom: `1px solid ${T.border}`,
        }}>
          {['SKU', 'Unidades', 'OOS'].map(h => (
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
            {/* Separador de marca */}
            <div style={{
              padding: '6px 14px', background: T.bg,
              borderBottom: `1px solid ${T.border}`, borderTop: `1px solid ${T.border}`,
              fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.4px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: products[0].abi ? T.primary : T.textLow,
              }} />
              {brand.toUpperCase()}
              {products[0].abi && (
                <span style={{ background: T.primarySoft, color: T.primaryDim, fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>ETX</span>
              )}
            </div>

            {products.map((row, idx) => {
              const prod    = countryProducts.find(p => p.sku === row.sku);
              const isAI    = row.aiQty !== null;
              return (
                <div key={row.sku} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 120px 46px',
                  padding: '9px 14px', gap: 8, alignItems: 'center',
                  borderBottom: idx < products.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: row.oos ? T.dangerSoft : isAI ? '#FAFAFF' : 'transparent',
                }}>

                  {/* SKU + imagen */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getProductImage(row.sku)
                      ? <img src={getProductImage(row.sku)} alt={prod?.name || row.sku}
                          style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 7, background: T.bg, flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: 32, height: 32, borderRadius: 7, background: T.surfaceAlt, flexShrink: 0 }} />
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, color: row.oos ? T.danger : T.ink, fontWeight: 600, lineHeight: 1.3 }}>
                          {prod?.name || row.sku}
                        </div>
                        {/* Badge IA */}
                        {isAI && (
                          <button onClick={() => clearAiSuggestion(row.sku)} title="Quitar sugerencia IA" style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            fontSize: 8.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                            background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE',
                            cursor: 'pointer',
                          }}>
                            ✨ IA
                          </button>
                        )}
                      </div>
                      {prod && (
                        <div style={{ fontSize: 10, color: T.textLow, marginTop: 1 }}>{prod.pack} · {prod.size}ml</div>
                      )}
                    </div>
                  </div>

                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => setQty(row.sku, -1)} disabled={row.oos || row.qty === 0}
                      className="press" style={stepBtn(row.oos || row.qty === 0)}>
                      <Minus size={11} />
                    </button>
                    <span style={{
                      minWidth: 30, textAlign: 'center', fontSize: 14, fontWeight: 800,
                      color: row.oos ? T.danger : isAI && row.qty > 0 ? '#7C3AED' : T.ink,
                    }}>
                      {row.oos ? '—' : row.qty}
                    </span>
                    <button onClick={() => setQty(row.sku, 1)} disabled={row.oos}
                      className="press" style={stepBtn(row.oos)}>
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* OOS toggle */}
                  <button onClick={() => toggleOos(row.sku)} className="press" style={{
                    width: 38, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: row.oos ? T.danger : T.border,
                    color: T.white, fontSize: 9, fontWeight: 800, letterSpacing: '.3px',
                  }}>
                    {row.oos ? 'OOS' : 'ok'}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Notas */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMed, letterSpacing: '.3px', display: 'block', marginBottom: 6 }}>
          OBSERVACIONES
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Observaciones del inventario…"
          style={{
            width: '100%', padding: 10, border: `1px solid ${T.border}`, borderRadius: 10,
            fontSize: 12, color: T.ink, resize: 'vertical', fontFamily: FONT,
            boxSizing: 'border-box', background: T.surface, outline: 'none',
          }} />
      </div>

      {/* Guardar */}
      <button onClick={handleSubmit} disabled={saving} className="press" style={{
        width: '100%', padding: 13, borderRadius: 11, border: 'none',
        background: saving ? T.textLow : T.primary,
        color: T.white, fontWeight: 700, fontSize: 13,
        cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: saving ? 'none' : `0 10px 24px -12px rgba(198,138,18,.6)`,
      }}>
        {saving
          ? <><Loader2 size={15} className="spin" /> Guardando…</>
          : <><CheckCircle2 size={15} /> Guardar inventario ({touchedRows.length} SKUs)</>}
      </button>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 12px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: T.textMed, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 700, color: T.ink }}>{value}</div>
    </div>
  );
}

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
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 600, color: T.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

const stepBtn = (disabled) => ({
  width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.border}`,
  background: disabled ? T.bg : T.surface, color: disabled ? T.textLow : T.ink,
  cursor: disabled ? 'default' : 'pointer', display: 'grid', placeItems: 'center', padding: 0,
});
