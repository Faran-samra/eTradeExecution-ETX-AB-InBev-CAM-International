import { useState } from 'react';
import { T, FONT, DISPLAY, getCountry } from '../../lib/constants.jsx';
import { ChevronLeft, MapPin, Plus, Loader2 } from 'lucide-react';
import { useToast } from '../Toaster.jsx';
import * as data from '../../lib/data.js';

export default function PoolScreen({ user, catalog, onBack, onAssigned, setCatalog }) {
  const toast = useToast();
  const [assigning, setAssigning] = useState(null);
  const country = getCountry(user.country);
  const pool = catalog.filter(p => p.country === user.country && !p.assigned_to);

  const handleAssign = async (pdvId) => {
    setAssigning(pdvId);
    try {
      const nextOrder = Math.max(...catalog.filter(p => p.assigned_to === user.id).map(p => p.order || 0)) + 1;
      await data.assignPdv(pdvId, user.id, nextOrder);

      // Update local catalog
      setCatalog(prev => prev.map(p =>
        p.id === pdvId ? { ...p, assigned_to: user.id, order: nextOrder } : p
      ));

      onAssigned();
    } catch (e) {
      console.error('Error asignando PDV:', e);
      toast.error(`Error al asignar: ${e.message}`);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div style={{
      width: '100%', maxWidth: 700, fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 40, height: 40, borderRadius: 10, background: T.surface,
            border: `1px solid ${T.border}`, cursor: 'pointer', display: 'grid',
            placeItems: 'center', color: T.ink,
          }}
          className="press back-btn"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: T.ink }}>
            Pool de PDVs
          </div>
          <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>
            {country.flag} {country.name}
          </div>
        </div>
      </div>

      {/* Pool List */}
      <div style={{
        background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
        overflow: 'hidden', boxShadow: '0 20px 60px -30px rgba(38,48,58,.3)',
      }}>
        <div style={{
          padding: '14px 16px', background: T.bg, borderBottom: `1px solid ${T.border}`,
          fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.3px',
        }}>
          DISPONIBLES ({pool.length})
        </div>

        {pool.length === 0 ? (
          <div style={{
            padding: 24, textAlign: 'center', color: T.textMed, fontSize: 13,
          }}>
            No hay PDVs disponibles en el pool.
          </div>
        ) : (
          <div>
            {pool.map((pdv, idx) => (
              <PoolRow
                key={pdv.id}
                pdv={pdv}
                isLast={idx === pool.length - 1}
                onAssign={() => handleAssign(pdv.id)}
                loading={assigning === pdv.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PoolRow({ pdv, isLast, onAssign, loading }) {
  return (
    <div
      style={{
        width: '100%', padding: 14, borderBottom: !isLast ? `1px solid ${T.border}` : 'none',
        background: 'transparent', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}
      className="rise"
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
          {pdv.name}
        </div>
        <div style={{
          fontSize: 11, color: T.textMed, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
        }}>
          <MapPin size={12} /> {pdv.addr}
        </div>
        <div style={{ fontSize: 10, color: T.textLow, marginTop: 4 }}>
          {pdv.cat} · {pdv.channel}
        </div>
      </div>
      <button
        onClick={onAssign}
        disabled={loading}
        style={{
          padding: '8px 12px', borderRadius: 8, border: 'none',
          background: loading ? T.textLow : T.success,
          color: T.white, fontWeight: 700, fontSize: 12,
          cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: loading ? 0.6 : 1,
        }}
        className="press"
      >
        {loading ? (
          <><Loader2 size={12} className="spin" /> Asignando...</>
        ) : (
          <><Plus size={12} /> Asignar</>
        )}
      </button>
    </div>
  );
}
