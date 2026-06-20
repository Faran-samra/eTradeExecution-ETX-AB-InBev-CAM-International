import { useState, useEffect, useMemo } from 'react';
import { supabase, signIn, signOut } from './lib/supabase.js';
import * as data from './lib/data.js';
import { saveCatalog, loadCachedCatalog, getPendingQueue, removeQueueItem } from './lib/offline.js';
import LoginScreen from './components/LoginScreen.jsx';
import FieldApp from './components/FieldApp.jsx';
import SupervisorDashboard from './components/SupervisorDashboard.jsx';
import UserChip from './components/UserChip.jsx';
import CameraHost from './components/CameraHost.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider, useToast } from './components/Toaster.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import { CameraContext } from './hooks/useCamera.js';
import { ETXLogo } from './lib/constants.jsx';
import { Loader2 } from 'lucide-react';

const APPROVALS_KEY = 'etx-pending-approvals-v1';

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </ToastProvider>
  );
}

function AppInner() {
  const toast = useToast();
  const [user,       setUser]       = useState(null);
  const [loginExit,  setLoginExit]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [reloading,  setReloading]  = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [users,      setUsers]      = useState([]);
  const [catalog,    setCatalog]    = useState([]);
  const [desktop,    setDesktop]    = useState(window.innerWidth >= 960);
  const [cameraReq,  setCameraReq]  = useState(null);

  // Solicitudes de nuevos PDVs pendientes de aprobación
  const [pendingApprovals, setPendingApprovals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(APPROVALS_KEY)) || []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(APPROVALS_KEY, JSON.stringify(pendingApprovals)); } catch {}
  }, [pendingApprovals]);

  const camApi = useMemo(() => ({
    open:  (req) => setCameraReq(req),
    close: ()    => setCameraReq(null),
  }), []);

  // ── Resize listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setDesktop(window.innerWidth >= 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Offline queue counter ──────────────────────────────────────────────────
  useEffect(() => {
    async function refreshCount() {
      const q = await getPendingQueue();
      setPendingCount(q.length);
    }
    refreshCount();
    window.addEventListener('offline-queued', refreshCount);
    return () => window.removeEventListener('offline-queued', refreshCount);
  }, []);

  // ── Auto-sync when reconnected ─────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => syncQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth boot ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await loadProfile(session.user.id);
      } catch (e) {
        console.error('Error cargando sesión:', e);
        toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setUsers([]); setCatalog([]); setLoginExit(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile(userId) {
    const { data: profile, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (error) { toast.error('No se pudo cargar tu perfil.'); return; }
    setUser(profile);
    await loadInitialData(profile);
  }

  async function loadInitialData(profile) {
    try {
      let pdvFilter = {};
      if (profile.role === 'supervisor') pdvFilter.country = profile.country;
      if (profile.role === 'gvm')        pdvFilter.country = profile.country;
      const pdvs = await data.fetchPdvs(pdvFilter);
      setCatalog(pdvs);
      saveCatalog(pdvs).catch(() => {});
      if (profile.role !== 'gvm') {
        const allUsers = await data.fetchProfiles(
          profile.role === 'supervisor' ? { country: profile.country } : {}
        );
        setUsers(allUsers);
      }
    } catch (e) {
      if (!navigator.onLine) {
        const cached = await loadCachedCatalog();
        if (cached.length > 0) { setCatalog(cached); toast.warn('Sin conexión — mostrando datos guardados.'); return; }
      }
      toast.error(`Error cargando datos: ${e.message}`);
    }
  }

  async function syncQueue() {
    const queue = await getPendingQueue();
    if (!queue.length) return;
    setSyncing(true);
    let synced = 0;
    for (const op of queue) {
      try {
        if (op.type === 'survey') {
          const { data: saved, error } = await supabase
            .from('surveys').insert(op.survey).select().single();
          if (!error && op.items?.length)
            await supabase.from('survey_items').insert(op.items.map(i => ({ ...i, survey_id: saved.id })));
          await removeQueueItem(op._qid); synced++;
        } else if (op.type === 'checkin') {
          await supabase.from('checkins').insert({
            pdv_id: op.data.pdvId, lat: op.data.lat, lng: op.data.lng,
            distance_meters: op.data.distanceMeters,
          });
          await removeQueueItem(op._qid); synced++;
        }
      } catch (e) { console.warn('Sync failed', op._qid, e); }
    }
    setSyncing(false);
    if (synced > 0) {
      setPendingCount(prev => Math.max(0, prev - synced));
      toast.success(`${synced} operación${synced !== 1 ? 'es' : ''} sincronizada${synced !== 1 ? 's' : ''}.`);
      if (user) await loadInitialData(user);
    }
  }

  async function handleReload() {
    if (!user) return;
    setReloading(true);
    try { await loadInitialData(user); } finally { setReloading(false); }
  }

  async function handleLogin(emailOrUsername, password) {
    await signIn(emailOrUsername, password);
    setLoginExit(true);
  }

  async function handleLogout() {
    try { await signOut(); } catch { toast.error('Error al cerrar sesión.'); }
  }

  // ── Boot spinner ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: 'radial-gradient(125% 80% at 50% 0%, #FFFEFA 0%, var(--bg) 52%, #F0E9D8 100%)',
      }}>
        <div className="rise" style={{ textAlign: 'center' }}>
          <ETXLogo size={52} />
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Loader2 size={14} className="spin" color="var(--text-med)" />
            <span style={{ fontSize: 13, color: 'var(--text-med)', fontWeight: 700 }}>Cargando…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <CameraContext.Provider value={camApi}>
        <div style={{ position:'fixed', inset:0, zIndex:1, animation: loginExit ? 'etx-zoom-away .6s cubic-bezier(.22,1,.36,1) both' : 'none' }}>
          <LoginScreen onLogin={handleLogin} />
        </div>
      </CameraContext.Provider>
    );
  }

  const isGvm = user.role === 'gvm';

  // ── Shell autenticado ─────────────────────────────────────────────────────
  return (
    <CameraContext.Provider value={camApi}>
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(125% 80% at 50% 0%, #FFFEFA 0%, var(--bg) 52%, #F0E9D8 100%)',
        paddingTop: desktop ? 28 : 16,
        paddingLeft: desktop ? 24 : 12,
        paddingRight: desktop ? 24 : 12,
        paddingBottom: pendingCount > 0 ? (desktop ? 68 : 60) : (desktop ? 28 : 16),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Top bar */}
        <div style={{
          width: '100%', maxWidth: 1200, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: desktop ? 22 : 14,
          flexWrap: 'wrap', gap: 12,
        }} className="fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'linear-gradient(145deg, var(--primary-soft), var(--white))',
              border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 14px rgba(198,138,18,.14)',
            }}>
              <ETXLogo size={26} />
            </div>
            <div className="brand-grad" style={{
              fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700,
              fontSize: 17, lineHeight: 1,
            }}>
              eTradeExecution
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {reloading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-med)' }}>
                <Loader2 size={13} className="spin" /> Actualizando…
              </div>
            )}
            <UserChip user={user} onLogout={handleLogout} />
          </div>
        </div>

        {/* Contenido principal */}
        <div key={user.id} className="anim-screen" style={{ animation:"etx-zoom-in .6s cubic-bezier(.22,1,.36,1) both", width: '100%', display: 'flex', justifyContent: 'center' }}>
          <ErrorBoundary>
            {isGvm ? (
              <FieldApp
                user={user}
                catalog={catalog}
                setCatalog={setCatalog}
                onLogout={handleLogout}
                pendingApprovals={pendingApprovals}
                setPendingApprovals={setPendingApprovals}
              />
            ) : (
              <SupervisorDashboard
                desktop={desktop}
                user={user}
                users={users}
                setUsers={setUsers}
                catalog={catalog}
                setCatalog={setCatalog}
                onReload={handleReload}
                pendingApprovals={pendingApprovals}
                setPendingApprovals={setPendingApprovals}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>

      <OfflineBanner pendingCount={pendingCount} syncing={syncing} onSync={syncQueue} />
      {cameraReq && <CameraHost request={cameraReq} onClose={() => setCameraReq(null)} />}
    </CameraContext.Provider>
  );
}
