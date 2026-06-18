import React from 'react';
import { T, FONT, DISPLAY, getCountry } from '../../lib/constants.jsx';
import { ChevronLeft, LogOut, User, MapPin, Mail, Shield } from 'lucide-react';

export default function ProfileScreen({ user, onBack, onLogout }) {
  const country = getCountry(user.country);
  const roleLabel = user.role === 'gvm' ? 'Supervisor de Campo' : user.role === 'supervisor' ? 'Supervisor Regional' : 'Administrador';

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
            Perfil
          </div>
          <div style={{ fontSize: 11, color: T.textMed, marginTop: 2 }}>
            Tu información
          </div>
        </div>
      </div>

      {/* Avatar & Name */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: 24, textAlign: 'center', marginBottom: 18,
      }} className="rise">
        <div style={{
          width: 80, height: 80, margin: '0 auto 16px', borderRadius: 20,
          background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
          color: T.white, display: 'grid', placeItems: 'center',
          fontWeight: 800, fontSize: 32,
          boxShadow: `0 12px 28px -8px ${user.color}`,
        }}>
          {user.initials}
        </div>
        <div style={{
          fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, color: T.ink, marginBottom: 4,
        }}>
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: T.primary, fontWeight: 700, letterSpacing: '.5px' }}>
          {roleLabel.toUpperCase()}
        </div>
      </div>

      {/* Details */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: 16, marginBottom: 18, display: 'grid', gap: 14,
      }} className="rise">
        <ProfileRow icon={User} label="Nombre" value={user.name} />
        <ProfileRow icon={Mail} label="Email" value={user.email} />
        <ProfileRow icon={MapPin} label="País" value={country.name} />
        <ProfileRow icon={Shield} label="Rol" value={roleLabel} />
      </div>

      {/* Account Info */}
      <div style={{
        background: T.primarySoft, border: `1px solid ${T.primary}30`, borderRadius: 12,
        padding: 14, marginBottom: 18, fontSize: 11, color: T.primaryDim,
        lineHeight: 1.6,
      }}>
        <strong>ID de Usuario:</strong> {user.id}
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: T.danger, color: T.white, fontWeight: 700, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        className="press"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
    }}>
      <Icon size={16} color={T.primary} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMed, letterSpacing: '.2px', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
