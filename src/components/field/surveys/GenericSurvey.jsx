import { useState, useContext } from 'react';
import { T, FONT, DISPLAY, SURVEY_KINDS } from '../../../lib/constants.jsx';
import { useToast } from '../../Toaster.jsx';
import { ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { CameraContext } from '../../../hooks/useCamera.js';
import PhotoSection from './PhotoSection.jsx';
import { uploadPhoto } from '../../../lib/supabase.js';
import * as data from '../../../lib/data.js';

export default function GenericSurvey({ kind, pdv, user, onBack, onComplete, startedAt }) {
  const toast = useToast();
  const surveyMeta = SURVEY_KINDS.find(s => s.key === kind) || SURVEY_KINDS[0];
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]); // [{file, url}]
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const camApi = useContext(CameraContext);

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.warn('⚠️ Agrega al menos una foto antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      const durationSeconds = startedAt
        ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null;
      const survey = await data.createSurvey({
        pdv_id: pdv.id,
        kind,
        country: pdv.country,
        created_by: user.id,
        status: 'done',
        notes: notes || null,
        started_at: startedAt || null,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
      });

      for (const p of photos) {
        const tempId = `${pdv.id}-${Date.now()}`;
        const { url } = await uploadPhoto(p.file, tempId, kind);
        await data.createSurveyPhoto({ survey_id: survey.id, url });
      }

      setDone(true);
      setTimeout(() => onComplete(kind), 1200);
    } catch (e) {
      toast.error(`Error al guardar: ${e.message}`);
      setSaving(false);
    }
  };

  const Icon = surveyMeta.icon;

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: FONT }}>
        <CheckCircle2 size={48} color={T.success} style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.ink, fontWeight: 600 }}>
          ¡Levantamiento guardado!
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      <Header title={surveyMeta.label} subtitle={pdv.name} onBack={onBack} disabled={saving} />

      {/* Kind badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: surveyMeta.color + '18', border: `1px solid ${surveyMeta.color}30`,
        padding: '5px 12px', borderRadius: 8, marginBottom: 20,
      }}>
        <Icon size={13} color={surveyMeta.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: surveyMeta.color }}>
          {surveyMeta.label}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <PhotoSection
          photos={photos}
          setPhotos={setPhotos}
          required={true}
          max={6}
          label={`FOTOS · ${surveyMeta.label.toUpperCase()}`}
          hint="Mínimo 1 foto obligatoria."
        />

        {/* Notes */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 10,
          }}>
            OBSERVACIONES
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            placeholder={placeholderFor(kind)}
            style={{
              width: '100%', padding: 10, border: `1px solid ${T.border}`, borderRadius: 10,
              fontSize: 12, color: T.ink, resize: 'vertical', fontFamily: FONT,
              boxSizing: 'border-box', background: T.white, outline: 'none', lineHeight: 1.6,
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="press"
          style={{
            width: '100%', padding: 13, borderRadius: 11, border: 'none',
            background: saving ? T.textLow : T.primary,
            color: T.white, fontWeight: 700, fontSize: 13,
            cursor: saving ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <><Loader2 size={15} className="spin" /> Guardando...</>
          ) : (
            <><CheckCircle2 size={15} /> Guardar {surveyMeta.label.toLowerCase()}</>
          )}
        </button>
      </div>
    </div>
  );
}

function placeholderFor(kind) {
  if (kind === 'gondolas')    return 'Descripción de la gondola, posición, facing, estado...';
  if (kind === 'pop')         return 'Material POP instalado, estado, ubicación...';
  if (kind === 'competencia') return 'Productos de competencia observados, precios, activaciones...';
  return 'Observaciones...';
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
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: T.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}
