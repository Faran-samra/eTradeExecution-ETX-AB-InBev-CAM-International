import { useState, useContext } from 'react';
import { T, FONT, DISPLAY } from '../../../lib/constants.jsx';
import { useToast } from '../../Toaster.jsx';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { CameraContext } from '../../../hooks/useCamera.js';
import { uploadPhoto } from '../../../lib/supabase.js';
import * as data from '../../../lib/data.js';
import PhotoSection from './PhotoSection.jsx';

const CONDITIONS = [
  { key: 'excelente', label: 'Excelente ⭐', color: T.success },
  { key: 'buena',     label: 'Buena',        color: T.info },
  { key: 'regular',   label: 'Regular',      color: T.warn },
  { key: 'mala',      label: 'Mala',         color: T.danger },
];

function YesNo({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => onChange(v)} className="press" style={{
          flex: 1, padding: '8px 0', borderRadius: 9,
          border: `1.5px solid ${value === v ? T.primary : T.border}`,
          background: value === v ? T.primarySoft : T.surface,
          color: value === v ? T.primary : T.textMed,
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
        }}>{v ? 'Sí' : 'No'}</button>
      ))}
    </div>
  );
}

export default function CoolerSurvey({ pdv, user, onBack, onComplete, startedAt }) {
  const toast   = useToast();
  const camApi  = useContext(CameraContext);

  const [equipId,   setEquipId]   = useState('');
  const [condition, setCondition] = useState(null);
  const [share,     setShare]     = useState(50);
  const [planogram, setPlanogram] = useState(null);
  const [branding,  setBranding]  = useState(null);
  const [photos,    setPhotos]    = useState([]); // [{ file, url }]
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);

  const handleSubmit = async () => {
    if (!condition)        { toast.warn('Selecciona la condición de la nevera.'); return; }
    if (photos.length === 0) { toast.warn('⚠️ Agrega al menos una foto de la nevera.'); return; }

    setSaving(true);
    try {
      const surveyNotes = [
        `Equipo: ${equipId || 'N/A'}`,
        `Condición: ${condition}`,
        `Share nevera: ${share}%`,
        `Planograma: ${planogram === true ? 'Sí' : planogram === false ? 'No' : 'N/A'}`,
        `Branding: ${branding === true ? 'Sí' : branding === false ? 'No' : 'N/A'}`,
        notes,
      ].filter(Boolean).join(' | ');

      const completedAt      = new Date().toISOString();
      const durationSeconds  = startedAt
        ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null;

      const survey = await data.createSurvey({
        pdv_id: pdv.id, kind: 'neveras', country: pdv.country,
        created_by: user.id, status: 'done', notes: surveyNotes,
        started_at: startedAt || null, completed_at: completedAt, duration_seconds: durationSeconds,
      });

      await data.createSurveyItems([{
        survey_id: survey.id, sku: equipId || 'N/A',
        qty: share, oos: false, price_found: null, psv: null,
      }]);

      // Subir todas las fotos
      for (const p of photos) {
        const { url } = await uploadPhoto(p.file, `${pdv.id}-${Date.now()}`, 'neveras');
        await data.createSurveyPhoto({ survey_id: survey.id, url });
      }

      setDone(true);
      setTimeout(() => onComplete('neveras'), 1200);
    } catch (e) {
      toast.error(`Error al guardar: ${e.message}`);
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: FONT }}>
        <CheckCircle2 size={48} color={T.success} style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.ink, fontWeight: 600 }}>
          ¡Nevera registrada!
        </div>
        <div style={{ fontSize: 13, color: T.textMed, marginTop: 6 }}>
          {photos.length} foto{photos.length > 1 ? 's' : ''} adjuntada{photos.length > 1 ? 's' : ''}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      <Header title="Neveras" subtitle={pdv.name} onBack={onBack} disabled={saving} />

      <div style={{ display: 'grid', gap: 14 }}>

        {/* ── Fotos obligatorias (primero, más visible) ── */}
        <PhotoSection
          photos={photos}
          setPhotos={setPhotos}
          required={true}
          max={4}
          label="FOTOS DE LA NEVERA"
          hint="Captura frente, interior y etiquetas. Mínimo 1 foto obligatoria."
        />

        {/* ID equipo */}
        <Card>
          <Label>ID EQUIPO (OPCIONAL)</Label>
          <input type="text" value={equipId} onChange={e => setEquipId(e.target.value)}
            placeholder="Ej: NV-2024-0012" style={inp()} />
        </Card>

        {/* Condición */}
        <Card>
          <Label>CONDICIÓN DE LA NEVERA</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CONDITIONS.map(c => (
              <button key={c.key} onClick={() => setCondition(c.key)} className="press" style={{
                padding: '9px 0', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                border: `1.5px solid ${condition === c.key ? c.color : T.border}`,
                background: condition === c.key ? c.color + '20' : T.surface,
                color: condition === c.key ? c.color : T.textMed,
              }}>{c.label}</button>
            ))}
          </div>
        </Card>

        {/* Share slider */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Label style={{ margin: 0 }}>SHARE DE NEVERA</Label>
            <span style={{ background: T.primarySoft, color: T.primary, fontWeight: 800, fontSize: 14, padding: '2px 10px', borderRadius: 7 }}>
              {share}%
            </span>
          </div>
          <input type="range" min={0} max={100} step={5} value={share}
            onChange={e => setShare(Number(e.target.value))}
            style={{ width: '100%', accentColor: T.primary }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: T.textLow }}>0%</span>
            <span style={{ fontSize: 10, color: T.textLow }}>100%</span>
          </div>
        </Card>

        {/* Planograma + Branding */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card>
            <Label>PLANOGRAMA</Label>
            <YesNo value={planogram} onChange={setPlanogram} />
          </Card>
          <Card>
            <Label>BRANDING</Label>
            <YesNo value={branding} onChange={setBranding} />
          </Card>
        </div>

        {/* Notas */}
        <Card>
          <Label>OBSERVACIONES</Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Temperatura, fallas, observaciones…"
            style={{
              width: '100%', padding: 10, border: `1px solid ${T.border}`, borderRadius: 10,
              fontSize: 12, color: T.ink, resize: 'vertical', fontFamily: FONT,
              boxSizing: 'border-box', background: T.surface, outline: 'none',
            }} />
        </Card>

        {/* Guardar */}
        <button onClick={handleSubmit} disabled={saving} className="press" style={{
          width: '100%', padding: 13, borderRadius: 11, border: 'none',
          background: saving ? T.textLow : T.primary,
          color: T.white, fontWeight: 700, fontSize: 13,
          cursor: saving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: saving ? 0.6 : 1,
        }}>
          {saving
            ? <><Loader2 size={15} className="spin" /> Guardando…</>
            : <><CheckCircle2 size={15} /> Guardar nevera ({photos.length} foto{photos.length !== 1 ? 's' : ''})</>}
        </button>
      </div>
    </div>
  );
}

const Card = ({ children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
    {children}
  </div>
);
const Label = ({ children, style }) => (
  <div style={{ fontSize: 10, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 10, ...style }}>
    {children}
  </div>
);
const inp = () => ({
  width: '100%', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 9,
  fontSize: 13, color: T.ink, background: T.white, outline: 'none',
  boxSizing: 'border-box', fontFamily: FONT,
});

function Header({ title, subtitle, onBack, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <button onClick={onBack} disabled={disabled} className="press back-btn" style={{
        width: 40, height: 40, borderRadius: 10, background: T.surface,
        border: `1px solid ${T.border}`, cursor: disabled ? 'default' : 'pointer',
        display: 'grid', placeItems: 'center', color: T.ink,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 600, color: T.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}
