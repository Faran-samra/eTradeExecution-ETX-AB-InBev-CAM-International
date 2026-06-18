import { useState, useContext } from 'react';
import { T, FONT, DISPLAY, haversine } from '../../lib/constants.jsx';
import { ChevronLeft, MapPin, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { CameraContext } from '../../hooks/useCamera.js';
import { useToast } from '../Toaster.jsx';
import * as data from '../../lib/data.js';
import { uploadPhoto } from '../../lib/supabase.js';

const GEOFENCE_TOLERANCE = 50;

export default function CheckinScreen({ pdv, onBack, onComplete, setCatalog }) {
  const toast = useToast();
  const [step, setStep] = useState('location');
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [geoWarning, setGeoWarning] = useState(false);
  const camApi = useContext(CameraContext);
  const [animating, setAnimating] = useState(false);

  const handleGetLocation = () => {
    setLoading(true); setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no disponible en tu navegador');
      setLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = haversine(loc, { lat: pdv.lat, lng: pdv.lng });
        setLocation(loc); setDistance(dist);
        if (dist > GEOFENCE_TOLERANCE) setGeoWarning(true);
        setStep('photo'); setLoading(false);
      },
      (err) => { setLocationError(`Error: ${err.message}`); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenCamera = () => {
    camApi.open({
      pdvId: pdv.id, kind: 'checkin',
      onCapture: async (file) => {
        try {
          setLoading(true);
          if (!navigator.onLine) { setPhotoUrl(null); setStep('summary'); return; }
          const { url } = await uploadPhoto(file, pdv.id, 'checkin');
          setPhotoUrl(url); setStep('summary');
        } catch (e) {
          if (!navigator.onLine) { setPhotoUrl(null); setStep('summary'); }
          else toast.error(`Error cargando foto: ${e.message}`);
        } finally { setLoading(false); }
      },
    });
  };

  /* ── Confirmar: regresa INMEDIATAMENTE al itinerario y procesa en background ── */
  const handleConfirm = () => {
    const checkinData = {
      pdvId: pdv.id,
      lat: location.lat,
      lng: location.lng,
      distanceMeters: distance,
      photoUrl,
    };
    const backgroundWork = async () => {
      await data.createCheckin(checkinData);
      setCatalog(prev => prev.map(p =>
        p.id === pdv.id ? { ...p, status: 'in_progress' } : p
      ));
    };
    // Animación morphing antes de navegar
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      onComplete(backgroundWork);
    }, 650);
  };

  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} disabled={loading} style={{
          width: 40, height: 40, borderRadius: 10, background: T.surface,
          border: `1px solid ${T.border}`, cursor: loading ? 'default' : 'pointer',
          display: 'grid', placeItems: 'center', color: T.ink,
        }} className="press back-btn">
          <ChevronLeft size={18} />
        </button>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: T.ink }}>Check-in</div>
          <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>{pdv.name}</div>
        </div>
      </div>

      {/* Aviso geofence */}
      {geoWarning && (
        <div style={{
          background: T.warnSoft, border: `1px solid ${T.warn}80`, borderRadius: 10,
          padding: 12, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start',
        }} className="expand">
          <AlertCircle size={16} color={T.warn} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: T.warn, lineHeight: 1.5 }}>
            <strong>Fuera del radio ({GEOFENCE_TOLERANCE}m):</strong> estás a {distance}m del PDV.
            El supervisor será notificado, pero puedes continuar.
          </div>
        </div>
      )}

      {/* Step 1: Ubicación */}
      {step === 'location' && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: 20, textAlign: 'center', marginBottom: 16,
        }}>
          <MapPin size={40} color={T.primary} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
            Obtener ubicación GPS
          </div>
          <div style={{ fontSize: 12, color: T.textMed, lineHeight: 1.6, marginBottom: 16 }}>
            Tu posición se validará contra las coordenadas del PDV.
          </div>
          {locationError && (
            <div style={{
              background: T.dangerSoft, color: T.danger, padding: 10, borderRadius: 8,
              fontSize: 12, marginBottom: 12, border: `1px solid ${T.danger}30`,
            }}>{locationError}</div>
          )}
          <button onClick={handleGetLocation} disabled={loading} className="press" style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: loading ? T.textLow : `linear-gradient(135deg,${T.primary},${T.primaryDim})`,
            color: T.white, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <><Loader2 size={14} className="spin" /> Obteniendo ubicación…</> : 'Obtener mi ubicación'}
          </button>
        </div>
      )}

      {/* Step 2: Foto */}
      {step === 'photo' && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: 20, textAlign: 'center', marginBottom: 16,
        }}>
          <CheckCircle2 size={40} color={T.success} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
            Ubicación válida · {distance}m
          </div>
          <div style={{ fontSize: 12, color: T.textMed, lineHeight: 1.6, marginBottom: 16 }}>
            Captura la foto de fachada para completar el check-in.
          </div>
          <button onClick={handleOpenCamera} disabled={loading} className="press" style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: loading ? T.textLow : `linear-gradient(135deg,${T.primary},${T.primaryDim})`,
            color: T.white, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <><Loader2 size={14} className="spin" /> Capturando…</> : '📷 Capturar foto de fachada'}
          </button>
        </div>
      )}

      {/* Step 3: Confirmar */}
      {step === 'summary' && (
        <div>
          {photoUrl && (
            <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, border: `1px solid ${T.border}` }}>
              <img src={photoUrl} alt="Fachada" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}
          <div style={{
            background: T.infoSoft, border: `1px solid ${T.info}30`, borderRadius: 12,
            padding: '11px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start',
            fontSize: 12, color: T.info, fontWeight: 600, lineHeight: 1.5,
          }}>
            <Loader2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            Al confirmar, el check-in se procesará en segundo plano. Podrás continuar con otros PDVs inmediatamente.
          </div>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 16,
          }}>
            <CheckinRow label="PDV"       value={pdv.name} />
            <CheckinRow label="Distancia" value={`${distance}m del PDV`} />
            <CheckinRow label="Foto"      value={photoUrl ? '✓ Capturada' : '— Sin foto (sin conexión)'} />
          </div>
          <button
            onClick={handleConfirm}
            disabled={animating}
            className="press"
            style={{
              width: '100%', padding: 14, border: 'none',
              background: `linear-gradient(135deg, ${T.success}, #1E8B52)`,
              color: T.white, fontWeight: 800, fontSize: 14.5,
              cursor: animating ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 12px 26px -12px rgba(44,157,99,.6)',
              animation: animating ? 'morphCheckin .65s cubic-bezier(.22,1,.36,1) both' : 'none',
              borderRadius: 12,
            }}
          >
            {animating
              ? <><svg style={{animation:'spin .8s linear infinite'}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Registrando…</>
              : <><CheckCircle2 size={18} /> Confirmar y continuar</>}
          </button>
        </div>
      )}
    </div>
  );
}

function CheckinRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 10, marginBottom: 10,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.textMed }}>{label}</span>
      <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
