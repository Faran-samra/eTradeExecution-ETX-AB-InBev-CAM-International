import { useState, useContext } from 'react';
import { T, FONT, DISPLAY, COUNTRIES, getCountry } from '../../lib/constants.jsx';
import { X, Loader2, Crosshair, Plus, Bell, TriangleAlert, Camera, CheckCircle2 } from 'lucide-react';
import { CameraContext } from '../../hooks/useCamera.js';
import { uploadPhoto } from '../../lib/supabase.js';

const CATEGORIES = [
  'Supermercado', 'Hipermercado', 'Bodegón / Market', 'Licorería',
  'Mini market', 'Bar / Cantina', 'Restaurante', 'Pulpería / Abasto', 'Mayorista', 'Otro',
];

export default function NewPdvModal({ user, onClose, onSubmit }) {
  const country = getCountry(user.country);
  const [name,     setName]     = useState('');
  const [cat,      setCat]      = useState('');
  const [channel,  setChannel]  = useState('Off-trade');
  const [addr,     setAddr]     = useState('');
  const [lat,      setLat]      = useState('');
  const [lng,      setLng]      = useState('');
  const [locating, setLocating] = useState(false);
  const [error,    setError]    = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const camApi = useContext(CameraContext);

  const capturePhoto = () => {
    camApi.open({
      onCapture: async (file) => {
        setPhotoLoading(true);
        try {
          if (!navigator.onLine) { setPhotoUrl(URL.createObjectURL(file)); return; }
          const { url } = await uploadPhoto(file, `pdv-req-${Date.now()}`, 'solicitudes');
          setPhotoUrl(url);
        } catch { setPhotoUrl(URL.createObjectURL(file)); }
        finally { setPhotoLoading(false); }
      },
    });
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocalización no disponible en este dispositivo.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setLocating(false); },
      () => { setError('No se pudo obtener la ubicación. Puedes introducirla manualmente.'); setLocating(false); }
    );
  };

  const submit = () => {
    setError(null);
    if (!name.trim()) { setError('El nombre del establecimiento es obligatorio.'); return; }
    if (!cat)         { setError('Selecciona una categoría.'); return; }
    if (!addr.trim()) { setError('La dirección es obligatoria.'); return; }
    onSubmit({
      id:          `PDV-${user.country}-NEW-${Date.now()}`,
      photoUrl:    photoUrl || null,
      name:        name.trim(),
      cat,
      channel,
      dist:        country.distributor,
      addr:        addr.trim(),
      lat:         parseFloat(lat) || 0,
      lng:         parseFloat(lng) || 0,
      status:      'pending',
      order:       0,
      country:     user.country,
      assigned_to: user.id,
    });
  };

  return (
    <div className="fade" style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,38,.65)',
      zIndex: 9000, display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div className="pop" style={{
        background: T.surface, borderRadius: 20, width: '100%', maxWidth: 440,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 30px 80px -20px rgba(38,48,58,.55)',
        border: `1px solid ${T.border}`,
      }}>
        {/* Cabecera sticky */}
        <div style={{
          padding: '15px 18px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `linear-gradient(135deg, ${T.cream}, ${T.surface})`,
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: T.ink }}>
              Registrar nuevo cliente
            </div>
            <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>
              {country.flag} {country.name} · requiere aprobación del supervisor
            </div>
          </div>
          <button onClick={onClose} className="press" style={{
            border: 'none', background: T.surfaceAlt, color: T.inkSoft,
            width: 32, height: 32, borderRadius: 9, cursor: 'pointer', display: 'grid', placeItems: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, fontFamily: FONT }}>
          <Field label="Nombre del establecimiento" value={name} onChange={setName} placeholder="Ej. Licorería El Palmar" />

          {/* Categoría */}
          <label style={{ display: 'block', marginBottom: 14 }}>
            <FieldLabel>CATEGORÍA</FieldLabel>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{
              width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 10, fontSize: 13,
              color: cat ? T.ink : T.textLow, outline: 'none', background: T.bg,
              border: `1.5px solid ${T.border}`, fontFamily: FONT, cursor: 'pointer',
            }}>
              <option value="">— Seleccionar categoría —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {/* Canal */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>CANAL</FieldLabel>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {['Off-trade', 'On-trade'].map(ch => (
                <button key={ch} onClick={() => setChannel(ch)} className="press" style={{
                  flex: 1, border: `1.5px solid ${channel === ch ? T.primary : T.border}`,
                  background: channel === ch ? T.primary : T.surface,
                  color: channel === ch ? T.white : T.inkSoft,
                  padding: '9px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  transition: 'background-color .2s ease',
                }}>{ch}</button>
              ))}
            </div>
          </div>

          <Field label="Dirección" value={addr} onChange={setAddr} placeholder="Av. Principal, Local 3, Caracas" />

          {/* Foto del local */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>FOTO DEL LOCAL (RECOMENDADO)</FieldLabel>
            {photoUrl ? (
              <div style={{ marginTop: 6, position: 'relative' }}>
                <img src={photoUrl} alt="Local" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:10, display:'block' }}/>
                <button onClick={()=>setPhotoUrl(null)} style={{ position:'absolute', top:6, right:6, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,.6)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'white' }}>
                  <X size={13}/>
                </button>
                <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(44,157,99,.9)', color:'white', fontSize:10.5, fontWeight:800, padding:'3px 9px', borderRadius:8, display:'flex', alignItems:'center', gap:4 }}>
                  <CheckCircle2 size={11}/> Foto adjunta
                </div>
              </div>
            ) : (
              <button onClick={capturePhoto} disabled={photoLoading} style={{
                width:'100%', marginTop:6, padding:'10px 0', borderRadius:10,
                border:`1.5px dashed ${T.border}`, background:T.bg, color:T.textMed,
                fontSize:12, fontWeight:700, cursor:photoLoading?'default':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              }}>
                {photoLoading ? <Loader2 size={14} className="spin"/> : <Camera size={14}/>}
                {photoLoading ? 'Subiendo foto…' : 'Capturar foto del local'}
              </button>
            )}
          </div>

          {/* GPS */}
          <div style={{ marginBottom: 8 }}>
            <FieldLabel>COORDENADAS GPS (OPCIONAL)</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <Field label="" value={lat} onChange={setLat} placeholder="Latitud" />
              <Field label="" value={lng} onChange={setLng} placeholder="Longitud" />
            </div>
          </div>
          <button onClick={getLocation} disabled={locating} className="press" style={{
            width: '100%', border: `1px solid ${T.border}`, background: T.surface, color: T.inkSoft,
            padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 800,
            cursor: locating ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 16,
          }}>
            {locating ? <Loader2 size={14} className="spin" /> : <Crosshair size={14} />}
            {locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
          </button>

          {error && (
            <div className="pop" style={{
              background: T.dangerSoft, border: '1px solid #F1C8C5', borderRadius: 10,
              padding: '9px 12px', marginBottom: 14, fontSize: 12, fontWeight: 700, color: T.danger,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <TriangleAlert size={14} /> {error}
            </div>
          )}

          {/* Nota informativa */}
          <div style={{
            background: T.infoSoft, border: `1px solid ${T.info}30`, borderRadius: 11,
            padding: '10px 13px', marginBottom: 18, fontSize: 11.5, color: T.info,
            fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5,
          }}>
            <Bell size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            El supervisor recibirá una notificación. Una vez aprobado, el PDV quedará asignado a ti.
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="press" style={{
              flex: 1, border: `1px solid ${T.border}`, background: T.surface, color: T.inkSoft,
              padding: 12, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={submit} className="press" style={{
              flex: 2, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
              padding: 12, borderRadius: 11, fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 8px 18px -10px rgba(198,138,18,.6)',
            }}>
              <Plus size={14} /> Enviar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: '.4px' }}>
      {children}
    </span>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <FieldLabel>{label.toUpperCase()}</FieldLabel>}
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', marginTop: label ? 4 : 0, padding: '10px 12px', borderRadius: 10, fontSize: 13,
          color: T.ink, outline: 'none', background: T.bg, border: `1.5px solid ${T.border}`,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", boxSizing: 'border-box',
          transition: 'border-color .15s ease',
        }}
        onFocus={e => e.target.style.borderColor = T.primary}
        onBlur={e  => e.target.style.borderColor = T.border}
      />
    </label>
  );
}
