/**
 * PhotoSection — sección de fotos reutilizable para todos los surveys.
 * Obligatoria por defecto: muestra error si se intenta guardar sin foto.
 *
 * Props:
 *   photos      — [{ file, url }]
 *   setPhotos   — setter
 *   required    — boolean (default true)
 *   max         — máximo de fotos (default 4)
 *   label       — etiqueta personalizada
 *   hint        — texto de ayuda bajo la etiqueta
 */
import { useContext } from 'react';
import { T, FONT } from '../../../lib/constants.jsx';
import { Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CameraContext } from '../../../hooks/useCamera.js';

export default function PhotoSection({
  photos,
  setPhotos,
  required = true,
  max = 4,
  label = 'FOTOS',
  hint = null,
}) {
  const camApi = useContext(CameraContext);
  const missing = required && photos.length === 0;

  const openCamera = () => {
    camApi.open({
      onCapture: (file) => {
        setPhotos(prev => [...prev, { file, url: URL.createObjectURL(file) }]);
      },
    });
  };

  const remove = (idx) => {
    setPhotos(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].url);
      next.splice(idx, 1);
      return next;
    });
  };

  return (
    <div style={{
      background: T.surface,
      border: `1.5px solid ${missing ? T.danger : photos.length > 0 ? T.success : T.border}`,
      borderRadius: 14, padding: 14,
      transition: 'border-color .2s ease',
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>
            {label} {photos.length > 0 && `· ${photos.length}/${max}`}
          </span>
          {/* Badge de estado */}
          {required && (
            <span style={{
              fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
              color: missing ? T.danger : T.success,
              background: missing ? T.dangerSoft : T.successSoft,
            }}>
              {missing ? 'OBLIGATORIA' : '✓ OK'}
            </span>
          )}
        </div>

        {missing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.danger, fontWeight: 700 }}>
            <AlertCircle size={12} /> Mín. 1 foto
          </div>
        )}
        {!missing && photos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.success, fontWeight: 700 }}>
            <CheckCircle2 size={12} /> Adjuntada
          </div>
        )}
      </div>

      {hint && (
        <div style={{ fontSize: 11, color: T.textLow, marginBottom: 10, lineHeight: 1.4 }}>{hint}</div>
      )}

      {/* Grid de fotos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {photos.map((p, idx) => (
          <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 9, overflow: 'hidden' }}>
            <img src={p.url} alt={`foto-${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button onClick={() => remove(idx)} style={{
              position: 'absolute', top: 3, right: 3, width: 20, height: 20,
              borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)',
              color: '#FFF', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0,
            }}>
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Botón añadir */}
        {photos.length < max && (
          <button onClick={openCamera} style={{
            aspectRatio: '1', borderRadius: 9,
            border: `2px dashed ${missing ? T.danger : T.border}`,
            background: missing ? T.dangerSoft : T.bg,
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'border-color .2s ease, background .2s ease',
          }}>
            <Camera size={18} color={missing ? T.danger : T.textMed} />
            {photos.length === 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: missing ? T.danger : T.textLow }}>
                {required ? 'Agregar*' : 'Agregar'}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
