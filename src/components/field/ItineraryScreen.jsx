import { useState, useEffect } from 'react';
import { T, FONT, DISPLAY, getCountry } from '../../lib/constants.jsx';
import { ChevronRight, MapPin, Loader2, CheckCircle2, Plus, Pencil, Check, ArrowUp, ArrowDown } from 'lucide-react';

const orderKey = (userId) => `etx-itinerary-order-${userId}`;

function loadSavedOrder(userId) {
  try { return JSON.parse(localStorage.getItem(orderKey(userId))) || null; } catch { return null; }
}
function saveOrder(userId, ids) {
  try { localStorage.setItem(orderKey(userId), JSON.stringify(ids)); } catch {}
}

export default function ItineraryScreen({ user, catalog, checkedIn = {}, onSelectPdv, onCheckinPdv, onPoolClick, onNewPdv }) {
  const basePdvs = catalog
    .filter(p => p.assigned_to === user.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const country = getCountry(user.country);

  const [editMode,    setEditMode]    = useState(false);
  const [orderedIds,  setOrderedIds]  = useState(() => {
    const saved = loadSavedOrder(user.id);
    if (saved) return saved;
    return basePdvs.map(p => p.id);
  });

  // Keep orderedIds in sync when catalog loads / changes
  useEffect(() => {
    setOrderedIds(prev => {
      const prevSet  = new Set(prev);
      const baseIds  = basePdvs.map(p => p.id);
      const newIds   = baseIds.filter(id => !prevSet.has(id));
      const filtered = prev.filter(id => baseIds.includes(id));
      return [...filtered, ...newIds];
    });
  }, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  const myPdvs = orderedIds
    .map(id => basePdvs.find(p => p.id === id))
    .filter(Boolean);

  const stats = {
    visited:  myPdvs.filter(p => p.status === 'done').length,
    planned:  myPdvs.length,
    coverage: myPdvs.length > 0
      ? Math.round((myPdvs.filter(p => p.status === 'done').length / myPdvs.length) * 100)
      : 0,
  };

  const move = (idx, dir) => {
    const next = [...orderedIds];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrderedIds(next);
    saveOrder(user.id, next);
  };

  const exitEdit = () => setEditMode(false);

  if (catalog.length === 0) return <FullSkeleton user={user} country={country} />;

  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
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

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <StatBox label="Visitados" value={stats.visited}         color={T.success} />
        <StatBox label="Planeados" value={stats.planned}         color={T.info} />
        <StatBox label="Cobertura" value={`${stats.coverage}%`} color={T.primary} />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
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

      {/* ── Itinerary list ──────────────────────────────────────────────── */}
      <div style={{
        background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
        overflow: 'hidden', boxShadow: '0 20px 60px -30px rgba(38,48,58,.3)',
      }}>
        {/* List header */}
        <div style={{
          padding: '12px 16px', background: T.bg, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>
            MI ITINERARIO ({myPdvs.length})
          </span>
          {myPdvs.length > 1 && (
            editMode ? (
              <button onClick={exitEdit} className="press" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: 'none', background: T.successSoft, color: T.success,
                padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
              }}>
                <Check size={12} /> Listo
              </button>
            ) : (
              <button onClick={() => setEditMode(true)} className="press" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: 'none', background: T.primarySoft, color: T.primaryDim,
                padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              }}>
                <Pencil size={11} /> Ordenar
              </button>
            )
          )}
        </div>

        {myPdvs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.textMed, fontSize: 13 }}>
            No tienes PDVs asignados. Selecciona del pool o registra un nuevo cliente.
          </div>
        ) : (
          <div>
            {myPdvs.map((pdv, idx) => (
              <PdvRow
                key={pdv.id}
                pdv={pdv}
                idx={idx}
                isLast={idx === myPdvs.length - 1}
                checkedInStatus={checkedIn[pdv.id] || null}
                editMode={editMode}
                isFirst={idx === 0}
                isLastItem={idx === myPdvs.length - 1}
                onClick={() => onSelectPdv(pdv)}
                onCheckin={() => onCheckinPdv?.(pdv)}
                onMoveUp={() => move(idx, -1)}
                onMoveDown={() => move(idx, 1)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PDV row ─────────────────────────────────────────────────────────────── */
function PdvRow({ pdv, idx, isLast, checkedInStatus, editMode, isFirst, isLastItem, onClick, onCheckin, onMoveUp, onMoveDown }) {
  const statusColor   = pdv.status === 'done' ? T.success : pdv.status === 'in_progress' ? T.warn : T.textLow;
  const statusIcon    = pdv.status === 'done' ? '✓' : pdv.status === 'in_progress' ? '◐' : '○';
  const isProcessing  = checkedInStatus === 'processing';
  const isCheckedDone = checkedInStatus === 'done';
  const canCheckin    = pdv.status === 'pending' && !checkedInStatus;

  return (
    <div style={{
      borderBottom: !isLast ? `1px solid ${T.border}` : 'none',
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Main row — click → PdvDetail */}
      <button onClick={onClick} style={{
        flex: 1, padding: '12px 14px', textAlign: 'left', border: 'none',
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }} className="row-link">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
            {idx + 1}. {pdv.name}
          </div>
          <div style={{ fontSize: 11, color: T.textMed, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <MapPin size={12} /> {pdv.addr}
          </div>

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

        {!editMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 2 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: statusColor + '20',
              color: statusColor, fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center',
            }}>
              {statusIcon}
            </div>
            <ChevronRight size={16} color={T.textLow} />
          </div>
        )}
      </button>

      {/* Check-In button — visible on pending rows when NOT in edit mode */}
      {!editMode && canCheckin && (
        <button
          onClick={(e) => { e.stopPropagation(); onCheckin(); }}
          className="press"
          style={{
            flexShrink: 0, border: 'none', borderLeft: `1px solid ${T.border}`,
            background: T.primarySoft, color: T.primaryDim,
            padding: '0 14px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            fontSize: 9.5, fontWeight: 800, letterSpacing: '.3px',
          }}
        >
          <MapPin size={13} color={T.primary} />
          CHECK-IN
        </button>
      )}

      {/* Reorder controls — visible only in edit mode */}
      {editMode && (
        <div style={{
          flexShrink: 0, borderLeft: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <button onClick={onMoveUp} disabled={isFirst} className="press" style={{
            flex: 1, border: 'none', background: 'transparent', cursor: isFirst ? 'default' : 'pointer',
            padding: '0 14px', display: 'grid', placeItems: 'center',
            opacity: isFirst ? 0.25 : 1,
          }}>
            <ArrowUp size={14} color={T.textMed} />
          </button>
          <div style={{ height: 1, background: T.border }} />
          <button onClick={onMoveDown} disabled={isLastItem} className="press" style={{
            flex: 1, border: 'none', background: 'transparent', cursor: isLastItem ? 'default' : 'pointer',
            padding: '0 14px', display: 'grid', placeItems: 'center',
            opacity: isLastItem ? 0.25 : 1,
          }}>
            <ArrowDown size={14} color={T.textMed} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Stat box ────────────────────────────────────────────────────────────── */
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

/* ── Skeletons ───────────────────────────────────────────────────────────── */
function FullSkeleton({ user, country }) {
  return (
    <div style={{ width: '100%', maxWidth: 700, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
          color: T.white, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18,
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[T.success, T.info, T.primary].map((color, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, borderTop: `3px solid ${color}` }}>
            <div className="shimmer" style={{ height: 9, width: '60%', borderRadius: 4, marginBottom: 10 }} />
            <div className="shimmer" style={{ height: 26, width: '70%', borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="shimmer" style={{ flex: 1, height: 46, borderRadius: 12 }} />
        <div className="shimmer" style={{ width: 130, height: 46, borderRadius: 12, flexShrink: 0 }} />
      </div>
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          <div className="shimmer" style={{ height: 8, width: '35%', borderRadius: 4 }} />
        </div>
        {[78, 65, 85, 70].map((w, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ height: 11, width: `${w}%`, borderRadius: 5, marginBottom: 7 }} />
              <div className="shimmer" style={{ height: 9, width: '42%', borderRadius: 4 }} />
            </div>
            <div className="shimmer" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
