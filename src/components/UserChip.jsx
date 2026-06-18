import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { T, getCountry } from '../lib/constants.jsx';

export default function UserChip({ user, onLogout }) {
  const c = user.country ? getCountry(user.country) : null;
  const roleLabel = user.role === 'admin'
    ? 'Administrador'
    : user.role === 'supervisor'
      ? `Supervisor · ${c?.flag} ${c?.name}`
      : `GVM · ${c?.flag} ${c?.name}`;
  const tone = user.role === 'admin' ? T.ink : user.role === 'supervisor' ? T.navy : T.primary;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, background: T.surface, padding: 5,
      borderRadius: 13, border: `1px solid ${T.border}`, boxShadow: '0 2px 10px rgba(38,48,58,.05)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, color: T.white, flexShrink: 0,
        background: `linear-gradient(135deg, ${user.color || tone}, ${tone})`,
        display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5,
      }}>{user.initials}</div>
      <div style={{ paddingRight: 4 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{user.name}</div>
        <div style={{ fontSize: 10.5, color: T.textMed, fontWeight: 600, marginTop: 2 }}>{roleLabel}</div>
      </div>
      <button onClick={onLogout} className="press" title="Cerrar sesión" style={{
        border: 'none', background: T.surfaceAlt, color: T.inkSoft,
        width: 32, height: 32, borderRadius: 9, cursor: 'pointer', display: 'grid', placeItems: 'center',
      }}>
        <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    </div>
  );
}
