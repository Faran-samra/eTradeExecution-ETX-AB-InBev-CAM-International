import { useState, useRef, useEffect } from 'react';
import { Loader2, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { T, FONT, DISPLAY, ETXLogo, COUNTRIES } from '../lib/constants.jsx';

/* ── Ola: 2 ciclos idénticos → translateX(-50%) = loop perfecto ───────────── */
function wavePath(yMid, amp) {
  return [
    `M0,${yMid}`,
    `C200,${yMid - amp} 300,${yMid - amp} 500,${yMid}`,
    `C700,${yMid + amp} 800,${yMid + amp} 1000,${yMid}`,
    `C1200,${yMid - amp} 1300,${yMid - amp} 1500,${yMid}`,
    `C1700,${yMid + amp} 1800,${yMid + amp} 2000,${yMid}`,
    'V200 H0 Z',
  ].join(' ');
}

const WAVES = [
  { fill: 'rgba(198,138,18,.07)', dur: '32s', delay: '0s',   yMid: 115, amp: 44 },
  { fill: 'rgba(198,138,18,.12)', dur: '26s', delay: '3s',   yMid: 98,  amp: 36 },
  { fill: 'rgba(162,112,11,.20)', dur: '21s', delay: '1.2s', yMid: 82,  amp: 28 },
  { fill: 'rgba(140,95,8,.30)',   dur: '17s', delay: '4s',   yMid: 66,  amp: 20 },
];

const inp = {
  width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13.5,
  color: T.ink, outline: 'none', fontFamily: FONT,
  background: 'rgba(251,248,241,.75)',
  border: `1.5px solid ${T.border}`,
  transition: 'border-color .18s ease, box-shadow .18s ease',
  boxSizing: 'border-box',
};

export default function LoginScreen({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showHint,   setShowHint]   = useState(false);
  const hintRef = useRef(null);

  useEffect(() => {
    if (showHint && hintRef.current) {
      hintRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showHint]);

  const submit = async () => {
    setError(null);
    if (!identifier || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true);
    try {
      await onLogin(identifier.trim(), password);
    } catch (e) {
      setError(e?.message?.includes('credentials')
        ? 'Usuario o contraseña incorrectos.'
        : `Error: ${e?.message || 'desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const focus = (e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(198,138,18,.12)`; };
  const blur  = (e) => { e.target.style.borderColor = T.border;  e.target.style.boxShadow = 'none'; };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflowX: 'hidden',
      background: 'linear-gradient(180deg, #FFFDF8 0%, #F0EAD8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: 'max(40px, 8vh)', paddingBottom: 220,
      paddingLeft: 20, paddingRight: 20,
    }}>

      {/* ── Olas en el fondo ─────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 250, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        {WAVES.map((w, i) => (
          <svg key={i}
            viewBox="0 0 2000 200" preserveAspectRatio="none" height="250"
            style={{
              position: 'absolute', bottom: 0, left: 0,
              width: '200%', display: 'block',
              animation: `etx-wave ${w.dur} linear ${w.delay} infinite`,
            }}
          >
            <path d={wavePath(w.yMid, w.amp)} fill={w.fill} />
          </svg>
        ))}
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo flotante */}
        <div className="logo-float" style={{ marginBottom: 18 }}>
          <ETXLogo size={66} />
        </div>

        {/* Nombre de marca con barrido */}
        <div className="brand-grad" style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, lineHeight: 1, marginBottom: 6 }}>
          eTradeExecution
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.2px', color: T.primaryDim, marginBottom: 22, opacity: .8 }}>
          ETX · INICIO DE SESIÓN
        </div>

        {/* Banderas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 26, opacity: .5 }}>
          {COUNTRIES.map(c => <span key={c.code} style={{ fontSize: 18 }} title={c.name}>{c.flag}</span>)}
        </div>

        {/* Tarjeta glassmorphism */}
        <div translate="no" style={{
          background: 'rgba(255,253,248,.93)',
          border: '1px solid rgba(232,224,207,.8)',
          borderRadius: 22, padding: '24px 22px',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 24px 70px -18px rgba(38,48,58,.22)',
          width: '100%',
        }}>

          {/* Usuario */}
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>
              USUARIO O EMAIL
            </span>
            <input type="text" autoComplete="username" value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="usuario@etx.com"
              style={inp} onFocus={focus} onBlur={blur}
            />
          </label>

          {/* Contraseña */}
          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textLow, letterSpacing: '.5px', display: 'block', marginBottom: 6 }}>
              CONTRASEÑA
            </span>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                style={{ ...inp, paddingRight: 42 }}
                onFocus={focus} onBlur={blur}
              />
              <button onClick={() => setShowPwd(s => !s)} type="button" style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: T.textLow, display: 'grid', placeItems: 'center', padding: 4,
              }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Error — stable wrapper keeps card's children list fixed so the browser
              cannot shift sibling nodes out from under React's fiber bookkeeping */}
          <div role="alert" aria-live="polite" aria-atomic="true">
            {error && (
              <div key={error} className="pop" style={{
                background: T.dangerSoft, border: '1px solid #F1C8C5', borderRadius: 11,
                padding: '10px 13px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: T.danger,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <TriangleAlert size={14} /><span> {error}</span>
              </div>
            )}
          </div>

          {/* Botón principal */}
          <button onClick={submit} disabled={loading} className={loading ? '' : 'press'} style={{
            width: '100%', border: 'none', cursor: loading ? 'default' : 'pointer',
            background: loading
              ? T.textLow
              : `linear-gradient(135deg, ${T.primary} 0%, #D4950D 50%, ${T.primaryDim} 100%)`,
            color: T.white, padding: '13px 0', borderRadius: 12, fontWeight: 800, fontSize: 14.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            boxShadow: loading ? 'none' : '0 12px 28px -10px rgba(198,138,18,.65)',
            fontFamily: FONT, transition: 'background .25s ease',
          }}>
            {loading ? <><Loader2 size={17} className="spin" /> Entrando…</> : 'Iniciar sesión'}
          </button>

          {/* Demo credentials */}
          <button onClick={() => setShowHint(s => !s)} style={{
            width: '100%', marginTop: 12,
            border: `1.5px dashed ${T.border}`, background: 'transparent',
            color: T.textMed, padding: '8px 12px', borderRadius: 10,
            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}>
            {showHint ? 'Ocultar credenciales de demo' : '🔑 Ver credenciales de demo'}
          </button>

          {showHint && (
            <div ref={hintRef} className="fade" style={{
              marginTop: 10, background: 'rgba(251,248,241,.85)', borderRadius: 10,
              padding: '12px 13px', border: `1px solid ${T.border}`,
              fontFamily: FONT, fontSize: 11.5, color: T.inkSoft,
            }}>
              {/* Primary accounts */}
              {[
                { user: 'admin',   pwd: 'admin', label: 'Administrador global' },
                { user: 'sup.ve',  pwd: '1234',  label: 'Supervisor 🇻🇪' },
                { user: 'eduardo', pwd: '1234',  label: 'GVM 🇻🇪' },
              ].map(({ user, pwd, label }) => (
                <div key={user} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px', lineHeight: 2 }}>
                  <code style={{ color: T.primaryDim, fontWeight: 700, background: T.primarySoft, padding: '0 5px', borderRadius: 4, fontSize: 11 }}>{user}</code>
                  <span style={{ color: T.textLow, fontSize: 10.5 }}>/ {pwd}</span>
                  <span style={{ color: T.inkSoft }}>→ {label}</span>
                </div>
              ))}

              {/* Secondary accounts */}
              <div style={{ marginTop: 8, paddingTop: 7, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textLow, marginBottom: 4, letterSpacing: '.4px' }}>+ SUPERVISORES · pwd: 1234</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[['sup.pa','🇵🇦'],['sup.cr','🇨🇷'],['sup.gt','🇬🇹'],['sup.hn','🇭🇳'],['sup.sv','🇸🇻']].map(([u, f]) => (
                    <code key={u} style={{ background: T.surfaceAlt, borderRadius: 4, padding: '1px 5px', fontSize: 10.5, color: T.inkSoft }}>{u} {f}</code>
                  ))}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textLow, marginTop: 8, marginBottom: 4, letterSpacing: '.4px' }}>+ GVMs · pwd: 1234</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[['carlos','🇵🇦'],['carla','🇨🇷'],['jose','🇬🇹'],['maria','🇭🇳'],['luis','🇸🇻']].map(([u, f]) => (
                    <code key={u} style={{ background: T.surfaceAlt, borderRadius: 4, padding: '1px 5px', fontSize: 10.5, color: T.inkSoft }}>{u} {f}</code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 10.5, color: T.textLow, textAlign: 'center', lineHeight: 1.5 }}>
          eTradeExecution Platform · CAM International
        </div>
      </div>
    </div>
  );
}
