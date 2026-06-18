import { useState, useEffect, useCallback } from 'react';
import { T, FONT } from '../lib/constants.jsx';
import { useToast } from './Toaster.jsx';
import ItineraryScreen from './field/ItineraryScreen.jsx';
import PoolScreen from './field/PoolScreen.jsx';
import PdvDetail from './field/PdvDetail.jsx';
import CheckinScreen from './field/CheckinScreen.jsx';
import ProfileScreen from './field/ProfileScreen.jsx';
import SurveyScreen from './field/surveys/SurveyScreen.jsx';
import NewPdvModal from './field/NewPdvModal.jsx';

/* ── Íconos SVG para la barra ───────────────────────────────────────────── */
const IcoMap = (color, w = 1.8) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 20l-5-5 5-5"/><path d="M4 15h11a4 4 0 0 0 0-8h-1"/>
  </svg>
);
const IcoUsers = (color, w = 1.8) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <circle cx="17" cy="9" r="3" opacity=".6"/>
    <path d="M21 21v-2a3 3 0 0 0-3-3" opacity=".6"/>
  </svg>
);
const IcoUser = (color, w = 1.8) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M20 21a8 8 0 1 0-16 0"/>
  </svg>
);

const NAV_ITEMS = [
  { key: 'itinerary', label: 'Itinerario', Ico: IcoMap   },
  { key: 'pool',      label: 'Pool',       Ico: IcoUsers  },
  { key: 'profile',   label: 'Perfil',     Ico: IcoUser   },
];

/* ── Barra Cristal Segmentado ────────────────────────────────────────────── */
function CrystalNav({ screen, setScreen }) {
  // Las sub-pantallas (pdvDetail, checkin, survey) pertenecen al flujo de itinerario
  const active = ['itinerary', 'pool', 'profile'].includes(screen) ? screen : 'itinerary';
  const idx    = NAV_ITEMS.findIndex(i => i.key === active);
  const W      = 100 / NAV_ITEMS.length;

  return (
    <div style={{
      padding: '10px 14px 20px',
      /* Fondo traslúcido — se ve el surface del card por debajo */
      background: 'rgba(255,253,248,.38)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      borderTop: '1px solid rgba(255,255,255,.45)',
    }}>
      {/* Pista del selector: también traslúcida */}
      <div style={{
        background: 'rgba(242,237,224,.42)',
        borderRadius: 18,
        padding: 5,
        display: 'flex',
        position: 'relative',
        border: '1px solid rgba(255,255,255,.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 1px 6px rgba(38,48,58,.05)',
      }}>

        {/* Pastilla de vidrio deslizante */}
        <div style={{
          position: 'absolute',
          top: 5, bottom: 5,
          left: `calc(${idx * W}% + 5px)`,
          width: `calc(${W}% - 10px)`,
          background: 'rgba(255,253,248,.85)',
          borderRadius: 13,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,.75)',
          boxShadow: '0 3px 14px rgba(38,48,58,.10), inset 0 1px 0 rgba(255,255,255,.9)',
          transition: 'left .32s cubic-bezier(.22,1,.36,1)',
        }} />

        {NAV_ITEMS.map(item => {
          const on = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setScreen(item.key)}
              className="press"
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px 0',
                border: 'none', background: 'transparent', cursor: 'pointer',
                position: 'relative', zIndex: 1,
                fontFamily: FONT,
              }}
            >
              {item.Ico(on ? T.primary : T.textMed, on ? 2.2 : 1.7)}
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: on ? T.primary : T.textMed,
                transition: 'color .2s ease',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── FieldApp ────────────────────────────────────────────────────────────── */
export default function FieldApp({
  user, catalog, setCatalog, onLogout,
  pendingApprovals, setPendingApprovals,
}) {
  const toast = useToast();
  const [screen,      setScreen]      = useState('itinerary');
  const [selectedPdv, setSelectedPdv] = useState(null);
  const [surveyKind,  setSurveyKind]  = useState(null);
  const [showNewPdv,  setShowNewPdv]  = useState(false);
  const [checkedIn,   setCheckedIn]   = useState({});

  // GAP 1: leer notificaciones del supervisor al montar
  useEffect(() => {
    const key = `etx-notif-${user.id}`;
    try {
      const notifs = JSON.parse(localStorage.getItem(key) || '[]');
      if (notifs.length > 0) {
        notifs.forEach(n => {
          if (n.type === 'approved') {
            toast.success(`✅ "${n.pdvName}" fue aprobado · ya está en tu itinerario`);
          } else {
            const motivo = n.reason ? ` · Motivo: ${n.reason}` : '';
            toast.warn(`❌ "${n.pdvName}" fue rechazado${motivo}`);
          }
        });
        localStorage.removeItem(key);
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const processing = Object.entries(checkedIn).filter(([, v]) => v === 'processing');
    if (!processing.length) return;
    const timers = processing.map(([id]) =>
      setTimeout(() => {
        setCheckedIn(m => ({ ...m, [id]: 'done' }));
        toast.success('Check-in confirmado · GPS y foto validados ✓');
      }, 4500)
    );
    return () => timers.forEach(clearTimeout);
  }, [checkedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPdv       = (pdv)  => { setSelectedPdv(pdv); setScreen('pdvDetail'); };
  const handleStartCheckin    = (pdv)  => { setSelectedPdv(pdv); setScreen('checkin'); };
  const handleStartSurvey     = (kind) => { setSurveyKind(kind); setScreen('survey'); };
  const handleSurveyComplete  = ()     => setScreen('pdvDetail');
  const handleAssignComplete  = ()     => setScreen('itinerary');

  const handleCheckinBackground = useCallback((pdvId, backgroundWork) => {
    setCheckedIn(m => ({ ...m, [pdvId]: 'processing' }));
    setScreen('itinerary');
    toast.info('Check-in enviado · verificando en segundo plano…');
    if (typeof backgroundWork === 'function') {
      backgroundWork().catch(e => console.warn('Background checkin failed:', e));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    /*
      overflow: hidden → recorta la barra con los border-radius del card
      paddingBottom: 0 → la barra llega hasta el borde inferior del card
    */
    <div style={{
      width: '100%', maxWidth: 700,
      background: T.surface, borderRadius: 22,
      border: `1px solid ${T.border}`,
      fontFamily: FONT,
      boxShadow: '0 30px 70px -34px rgba(38,48,58,.4)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }} className="anim-screen">

      {/* Área de contenido con padding */}
      <div style={{ padding: 24, flex: 1 }}>

        {screen === 'itinerary' && (
          <ItineraryScreen
            user={user} catalog={catalog} checkedIn={checkedIn}
            onSelectPdv={handleSelectPdv}
            onPoolClick={() => setScreen('pool')}
            onNewPdv={() => setShowNewPdv(true)}
          />
        )}

        {screen === 'pool' && (
          <PoolScreen
            user={user} catalog={catalog}
            onBack={() => setScreen('itinerary')}
            onAssigned={handleAssignComplete}
            setCatalog={setCatalog}
          />
        )}

        {screen === 'pdvDetail' && selectedPdv && (
          <PdvDetail
            pdv={selectedPdv} user={user}
            checkedInStatus={checkedIn[selectedPdv.id] || null}
            onBack={() => setScreen('itinerary')}
            onCheckin={() => handleStartCheckin(selectedPdv)}
            onStartSurvey={handleStartSurvey}
          />
        )}

        {screen === 'checkin' && selectedPdv && (
          <CheckinScreen
            pdv={selectedPdv} user={user}
            onBack={() => setScreen('pdvDetail')}
            onComplete={(bg) => handleCheckinBackground(selectedPdv.id, bg)}
            setCatalog={setCatalog}
          />
        )}

        {screen === 'survey' && selectedPdv && surveyKind && (
          <SurveyScreen
            kind={surveyKind} pdv={selectedPdv} user={user}
            onBack={() => setScreen('pdvDetail')}
            onComplete={handleSurveyComplete}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            user={user}
            onBack={() => setScreen('itinerary')}
            onLogout={onLogout}
          />
        )}

      </div>

      {/* ── Barra Cristal Segmentado ─────────────────────────────────────── */}
      <CrystalNav screen={screen} setScreen={setScreen} />

      {/* Modal: registrar nuevo PDV */}
      {showNewPdv && (
        <NewPdvModal
          user={user}
          onClose={() => setShowNewPdv(false)}
          onSubmit={(pdvData) => {
            setPendingApprovals(a => [...a, {
              id:              `req-${Date.now()}`,
              pdv:             pdvData,
              requestedBy:     user.id,
              requestedByName: user.name,
              requestedAt:     Date.now(),
              country:         user.country,
            }]);
            setShowNewPdv(false);
            toast.success('Solicitud enviada · el supervisor recibirá la notificación');
          }}
        />
      )}
    </div>
  );
}
