import { useState, useContext, useRef } from 'react';
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
  const [geoWarning, setGeoWarning] = useState(false);
  const camApi = useContext(CameraContext);
  // Store location in a ref so onCapture closure always has the latest value
  const locationRef = useRef(null);
  const distanceRef = useRef(null);

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
        locationRef.current = loc;
        distanceRef.current = dist;
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
        setLoading(true);
        let capturedUrl = null;
        try {
          if (navigator.onLine) {
            const { url } = await uploadPhoto(file, pdv.id, 'checkin');
            capturedUrl = url;
          }
        } catch (e) {
          if (navigator.onLine) {
            toast.error(`Error cargando foto: ${e.message}`);
            setLoading(false);
            return;
          }
        }
        // Auto-confirm immediately — no summary screen needed
        const loc  = locationRef.current;
        const dist = distanceRef.current;
        const backgroundWork = async () => {
          await data.createCheckin({
            pdvId: pdv.id,
            lat: loc.lat, lng: loc.lng,
            distanceMeters: dist,
            photoUrl: capturedUrl,
          });
          setCatalog(prev => prev.map(p =>
            p.id === pdv.id ? { ...p, status: 'in_progress' } : p
          ));
        };
        setLoading(false);
        onComplete(backgroundWork);
      },
    });
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

    </div>
  );
}
