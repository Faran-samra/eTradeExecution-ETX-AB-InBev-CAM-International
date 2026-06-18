import { T, FONT, DISPLAY, getCountry } from '../../lib/constants.jsx';
import { ChevronRight, MapPin, Loader2, CheckCircle2, Plus } from 'lucide-react';

export default function ItineraryScreen({ user, catalog, checkedIn = {}, onSelectPdv, onPoolClick, onNewPdv }) {
  const myPdvs = catalog
    .filter(p => p.assigned_to === user.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const country = getCountry(user.country);

  const stats = {
    visited:  myPdvs.filter(p => p.status === 'done').length,
    planned:  myPdvs.length,
    coverage: myPdvs.length > 0
      ? Math.round((myPdvs.filter(p => p.status === 'done').length / myPdvs.length) * 100)
      : 0,
  };

  if (catalog.length === 0) return <FullSkeleton user={user} country={country} />;

  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>
      {/* Encabezado personal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
          color: T.white, display: 'grid', placeItems: 'center',
          fontWeight: 800, fontSize: 18,
          boxShadow: `0 8px 20px -8px ${user.color}`,
        }}>{user.initials}</div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: T.ink }}>
            ¡Hola, {user.name.split(' ')[0]}!
          </div>
          <div style={{ fontSize: 12, color: T.textMed, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span>{country.flag}</span> {country.name}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatBox label="Visitados" value={stats.visited}           color={T.success} />
        <StatBox label="Planeados" value={stats.planned}           color={T.info} />
        <StatBox label="Cobertura" value={`${stats.coverage}%`}   color={T.primary} />
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <button onClick={onPoolClick} className="press" style={{
          flex: 1, padding: 13, borderRadius: 12,
          background: T.primarySoft, border: `1px solid ${T.border}`,
          color: T.primaryDim, fontWeight: 700, fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          + Asignarme PDVs del Pool
        </button>
        <button onClick={onNewPdv} className="press" style={{
          padding: '13px 16px', borderRadius: 12,
          background: T.successSoft, border: `1px solid ${T.success}40`,
          color: T.success, fontWeight: 800, fontSize: 12.5,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <Plus size={14} /> Nuevo cliente
        </button>
      </div>

      {/* Lista de itinerario */}
      <div style={{
        background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
        overflow: 'hidden', boxShadow: '0 20px 60px -30px rgba(38,48,58,.3)',
      }}>
        <div style={{
          padding: '14px 16px', background: T.bg, borderBottom: `1px solid ${T.border}`,
          fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.3px',
        }}>
          MI ITINERARIO ({myPdvs.length})
        </div>

        {catalog.length === 0 ? (
          <SkeletonList />
        ) : myPdvs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.textMed, fontSize: 13 }}>
            No tienes PDVs asignados. Selecciona del pool o registra un nuevo cliente.
          </div>
        ) : (
          <div>
            {myPdvs.map((pdv, idx) => (
              <PdvRow
                key={pdv.id}
                pdv={pdv}
                isLast={idx === myPdvs.length - 1}
                checkedInStatus={checkedIn[pdv.id] || null}
                onClick={() => onSelectPdv(pdv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 14, borderTop: `3px solid ${color}`,
    }} className="rise">
      <div style={{ fontSize: 10.5, fontWeight: 800, color: T.textMed, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 700, color: T.ink }}>
        {value}
      </div>
    </div>
  );
}

function PdvRow({ pdv, isLast, checkedInStatus, onClick }) {
  const statusColor = pdv.status === 'done' ? T.success : pdv.status === 'in_progress' ? T.warn : T.textLow;
  const statusIcon  = pdv.status === 'done' ? '✓' : pdv.status === 'in_progress' ? '◐' : '○';
  const isProcessing = checkedInStatus === 'processing';
  const isCheckedDone = checkedInStatus === 'done';

  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 14, textAlign: 'left', border: 'none',
      borderBottom: !isLast ? `1px solid ${T.border}` : 'none',
      background: 'transparent', cursor: 'pointer', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
    }} className="row-link">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
          {pdv.order ? `${pdv.order}. ` : ''}{pdv.name}
        </div>
        <div style={{ fontSize: 11, color: T.textMed, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <MapPin size={12} /> {pdv.addr}
        </div>

        {/* Badges de estado de check-in */}
        {isProcessing && (
          <div style={{
            marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 5,
            background: T.infoSoft, color: T.info,
            padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 800,
          }}>
            <Loader2 size={11} className="spin" /> Verificando GPS…
          </div>
        )}
        {isCheckedDone && pdv.status !== 'done' && (
          <div style={{
            marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 5,
            background: T.successSoft, color: T.success,
            padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 800,
          }}>
            <CheckCircle2 size={11} /> Check-in ✓
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingTop: 2 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: statusColor + '20',
          color: statusColor, fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center',
        }}>
          {statusIcon}
        </div>
        <ChevronRight size={16} color={T.textLow} />
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SKELETON DE CARGA — Animación #1: Shimmer
   ══════════════════════════════════════════════════════════════════════════ */

/* Skeleton completo mientras carga el catálogo */
function FullSkeleton({ user, country }) {
  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
          color: T.white, display: 'grid', placeItems: 'center',
          fontWeight: 800, fontSize: 18,
        }}>{user.initials}</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 600, color: T.ink }}>
            ¡Hola, {user.name.split(' ')[0]}!
          </div>
          <div style={{ fontSize: 12, color: T.textMed, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span>{country.flag}</span> {country.name}
          </div>
        </div>
      </div>

      {/* KPI skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[T.success, T.info, T.primary].map((color, i) => (
          <div key={i} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 14, borderTop: `3px solid ${color}`,
          }}>
            <div className="shimmer" style={{ height: 9, width: '60%', borderRadius: 4, marginBottom: 10 }} />
            <div className="shimmer" style={{ height: 26, width: '70%', borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Botones skeleton */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div className="shimmer" style={{ flex: 1, height: 46, borderRadius: 12 }} />
        <div className="shimmer" style={{ width: 130, height: 46, borderRadius: 12, flexShrink: 0 }} />
      </div>

      {/* Lista skeleton */}
      <div style={{
        background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
        overflow: 'hidden', boxShadow: '0 20px 60px -30px rgba(38,48,58,.3)',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '14px 16px', background: T.bg, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div className="shimmer" style={{ height: 8, width: '35%', borderRadius: 4 }} />
        </div>

        {/* Filas */}
        {[78, 65, 85, 70].map((w, i) => (
          <div key={i} style={{
            padding: '14px 16px',
            borderBottom: i < 3 ? `1px solid ${T.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Ícono skeleton */}
            <div className="shimmer" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
            {/* Texto */}
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ height: 11, width: `${w}%`, borderRadius: 5, marginBottom: 7 }} />
              <div className="shimmer" style={{ height: 9, width: '42%', borderRadius: 4 }} />
            </div>
            {/* Chevron skeleton */}
            <div className="shimmer" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Skeleton solo para la lista (catálogo cargado pero sin PDVs asignados) */
function SkeletonList() {
  return (
    <div style={{ padding: '8px 0' }}>
      {[78, 65, 85, 70].map((w, i) => (
        <div key={i} style={{
          padding: '14px 16px',
          borderBottom: i < 3 ? `1px solid ${T.border}` : 'none',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div className="shimmer" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="shimmer" style={{ height: 11, width: `${w}%`, borderRadius: 5, marginBottom: 7 }} />
            <div className="shimmer" style={{ height: 9, width: '40%', borderRadius: 4 }} />
          </div>
          <div className="shimmer" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
