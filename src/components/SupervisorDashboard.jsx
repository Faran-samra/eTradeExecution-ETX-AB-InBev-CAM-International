import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from './Toaster.jsx';
import * as XLSX from 'xlsx';
import {
  Trash2, Upload, Loader2, Plus, Edit2,
  Search, ChevronLeft, ChevronRight, X, CheckCircle2,
  Globe, Shield, User,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar,
} from 'recharts';
import SolicitudesTab  from './SolicitudesTab.jsx';
import TimingsPanel    from './TimingsPanel.jsx';
import { T, FONT, DISPLAY, COUNTRIES, getCountry, ETXLogo } from '../lib/constants.jsx';
import * as data from '../lib/data.js';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

const MGMT_TABS = [
  { key: 'overview',    label: 'Resumen',     icon: '📊' },
  { key: 'catalog',     label: 'Catálogo',    icon: '🗂️' },
  { key: 'users',       label: 'Usuarios',    icon: '👥' },
  { key: 'solicitudes', label: 'Solicitudes', icon: '🔔' },
  { key: 'tiempos',     label: 'Tiempos',     icon: '⏱️' },
];

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default function SupervisorDashboard({ desktop, user, users, setUsers, catalog, setCatalog, onReload, pendingApprovals, setPendingApprovals }) {
  const [tab, setTab] = useState('overview');
  const isAdmin = user.role === 'admin';
  const myApprovals = (pendingApprovals || []).filter(a => isAdmin || a.country === user.country);

  const country = getCountry(user.country);
  const done  = catalog.filter(p => p.status === 'done' && (isAdmin || p.country === user.country)).length;
  const total = catalog.filter(p => isAdmin || p.country === user.country).length;
  const weekLabel = `Sem. ${getWeekNumber(new Date())} · ${new Date().toLocaleDateString('es', { month: 'short', year: 'numeric' })}`;

  return (
    <div style={{
      width: '100%', maxWidth: 1200, background: T.surface, borderRadius: 22,
      border: `1px solid ${T.border}`, fontFamily: FONT,
      boxShadow: '0 30px 70px -34px rgba(38,48,58,.4)', overflow: 'hidden',
    }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: `1px solid ${T.border}`,
        background: T.surface, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(145deg, var(--primary-soft), var(--white))',
            border: `1px solid ${T.border}`, display: 'grid', placeItems: 'center',
          }}>
            <ETXLogo size={22} />
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>
              eTradeExecution
            </div>
            <div style={{ fontSize: 11, color: T.textMed, marginTop: 1 }}>
              Dashboard · {isAdmin ? 'CAM Internacional' : `${country.flag} ${country.name}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {myApprovals.length > 0 && (
            <button onClick={() => setTab('solicitudes')} className="press" style={{
              background: '#FBEFD4', border: '1px solid #EFDAAD', borderRadius: 20,
              padding: '5px 12px', fontSize: 11.5, fontWeight: 800, color: '#B8720A',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              🔔 {myApprovals.length} pendiente{myApprovals.length > 1 ? 's' : ''}
            </button>
          )}
          <div style={{
            background: `${T.primary}18`, border: `1px solid ${T.primary}40`,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 800,
            color: T.primary,
          }}>
            {done}/{total} PDVs Auditados
          </div>
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            color: T.textMed,
          }}>
            {weekLabel}
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${T.border}`,
        background: T.surface, paddingLeft: 12,
        overflowX: 'auto',
      }}>
        {MGMT_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="press" style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: '13px 18px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? T.primary : T.textMed,
            borderBottom: tab === t.key ? `2.5px solid ${T.primary}` : '2.5px solid transparent',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            transition: 'color .15s ease',
          }}>
            <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
            {t.key === 'solicitudes' && myApprovals.length > 0 && (
              <span style={{
                background: '#D5443D', color: '#fff', fontSize: 9, fontWeight: 800,
                minWidth: 15, height: 15, borderRadius: 8, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>{myApprovals.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ padding: desktop ? '24px 28px' : '16px' }}>
        {tab === 'overview'    && <OverviewTab user={user} users={users} catalog={catalog} isAdmin={isAdmin} />}
        {tab === 'catalog'     && <CatalogTab  user={user} users={users} catalog={catalog} setCatalog={setCatalog} onReload={onReload} />}
        {tab === 'users'       && <UsersTab    user={user} users={users} setUsers={setUsers} onReload={onReload} />}
        {tab === 'solicitudes' && <SolicitudesTab approvals={myApprovals} setPendingApprovals={setPendingApprovals} catalog={catalog} setCatalog={setCatalog} user={user} />}
        {tab === 'tiempos'     && <TimingsPanel user={user} users={users} catalog={catalog} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB — Analytics Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const ANALYTICS_TABS = [
  { key: 'overview',    label: 'Overview',         emoji: '📊' },
  { key: 'precios',     label: 'Precios',           emoji: '🏷️' },
  { key: 'gondola',     label: 'Góndola & Nevera',  emoji: '🧊' },
  { key: 'competencia', label: 'Competencia',       emoji: '🔍' },
  { key: 'inventario',  label: 'Inventario',        emoji: '📦' },
];

const DONUT_DATA = [
  { name: 'Corona',       value: 22, color: '#D4A017', abi: true  },
  { name: 'Modelo',       value: 11, color: '#1E3A5F', abi: true  },
  { name: 'Stella Artois',value:  7, color: '#D43F3F', abi: true  },
  { name: 'Regional',     value:  9, color: '#E87722', abi: false },
  { name: 'Heineken',     value:  2, color: '#2D7D1A', abi: false },
  { name: 'Coronita',     value:  8, color: '#D4B017', abi: true  },
  { name: 'Presidente',   value: 14, color: '#1A4C8B', abi: false },
  { name: 'Polar',        value: 24, color: '#3B82C4', abi: false },
  { name: 'Brahma',       value:  3, color: '#8B4513', abi: true  },
];

const TREND_DATA = [
  { week: 'S1', abi: 53, comp: 47 },
  { week: 'S2', abi: 55, comp: 45 },
  { week: 'S3', abi: 54, comp: 43 },
  { week: 'S4', abi: 57, comp: 41 },
  { week: 'S5', abi: 56, comp: 40 },
  { week: 'S6', abi: 60, comp: 37 },
];

const RADAR_DATA = [
  { subject: 'Share Góndola',  value: 72 },
  { subject: 'Precio',         value: 85 },
  { subject: 'Neveras',        value: 60 },
  { subject: 'Material POP',   value: 78 },
  { subject: 'Disponibilidad', value: 87 },
  { subject: 'Exclusividad',   value: 50 },
];

function OverviewTab({ user, users, catalog, isAdmin }) {
  const isMobile = useIsMobile();
  const [analyticsTab, setAnalyticsTab] = useState('overview');
  const [selectedPdv, setSelectedPdv]   = useState(null);

  const myCatalog = isAdmin ? catalog : catalog.filter(p => p.country === user.country);
  const assignedPdvs = myCatalog.filter(p => p.assigned_to);
  const filteredCatalog = selectedPdv ? myCatalog.filter(p => p.id === selectedPdv) : myCatalog;

  const done        = filteredCatalog.filter(p => p.status === 'done').length;
  const inProgress  = filteredCatalog.filter(p => p.status === 'in_progress').length;
  const total       = filteredCatalog.length;
  const coveragePct = total > 0 ? Math.round((done / total) * 100) : 0;

  const gvms = users.filter(u => u.role === 'gvm' && (isAdmin || u.country === user.country));
  const gvmStats = gvms.map(g => {
    const pdvs = filteredCatalog.filter(p => p.assigned_to === g.id);
    const gdone = pdvs.filter(p => p.status === 'done').length;
    return { ...g, done: gdone, total: pdvs.length, pct: pdvs.length > 0 ? Math.round((gdone / pdvs.length) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  // Share-of-shelf per PDV (based on real done count as proxy)
  const shelfData = assignedPdvs.slice(0, 6).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name,
    value: p.status === 'done' ? Math.min(95, 50 + (p.order || 0) * 3) : Math.min(60, 20 + (p.order || 0) * 2),
  }));

  const kpis = [
    { label: 'MARKET SHARE ABI', emoji: '🍺', value: '62%',          sub: 'Volumen total',           trend: '+3.4% vs sem. ant.', up: true,  accent: '#C6881A' },
    { label: 'SHARE OF SHELF',   emoji: '📐', value: '59.5%',        sub: 'Promedio PDVs',           trend: '+2.1% vs sem. ant.', up: true,  accent: '#1E3A5F' },
    { label: 'PDVS SOBRE PRECIO',emoji: '💰', value: `${done} / ${total}`, sub: 'SKUs por encima sugerido', trend: '-1% vs sem. ant.',   up: false, accent: '#D43F3F' },
    { label: 'NEVERAS EXCLUSIVA', emoji: '🧊', value: `${coveragePct}%`, sub: `${done} de ${total} PDVs`, trend: '+4% vs sem. ant.',   up: true,  accent: '#2D7D1A' },
    { label: 'DISPONIBILIDAD',   emoji: '📦', value: '87%',          sub: 'Sin agotados críticos',   trend: '+4% vs sem. ant.',   up: true,  accent: '#8B4513' },
    { label: 'ACCIONES COMP.',   emoji: '⚡', value: '27',           sub: 'Alertas registradas',     trend: '-5% vs sem. ant.',   up: false, accent: '#7C3AED' },
  ];

  return (
    <div className="fade">
      {/* Analytics sub-tab bar */}
      <div style={{ borderBottom: `1px solid ${T.border}`, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {ANALYTICS_TABS.map(t => (
            <button key={t.key} onClick={() => setAnalyticsTab(t.key)} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              padding: isMobile ? '10px 14px' : '11px 18px',
              fontSize: isMobile ? 12 : 13,
              fontWeight: analyticsTab === t.key ? 700 : 500,
              color: analyticsTab === t.key ? T.primary : T.textMed,
              borderBottom: analyticsTab === t.key ? `2.5px solid ${T.primary}` : '2.5px solid transparent',
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              transition: 'color .15s ease', fontFamily: FONT,
            }}>
              <span style={{ fontSize: 14 }}>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* PDV filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        <PdvPill label="Todos los PDV" active={selectedPdv === null} onClick={() => setSelectedPdv(null)} />
        {assignedPdvs.slice(0, 7).map(p => (
          <PdvPill key={p.id} label={p.name} active={selectedPdv === p.id} onClick={() => setSelectedPdv(p.id)} />
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: isMobile ? 10 : 12, marginBottom: 22,
      }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts row 1: Donut + Line */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.9fr', gap: 16, marginBottom: 16 }}>
        {/* Donut chart */}
        <ChartCard title="MARKET SHARE VOLUMEN">
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 0 }}>
            <div style={{ position: 'relative', width: isMobile ? 130 : 200, height: isMobile ? 130 : 200, flexShrink: 0 }}>
              <ResponsiveContainer width={isMobile ? 130 : 200} height={isMobile ? 130 : 200}>
                <PieChart>
                  <Pie
                    data={DONUT_DATA}
                    cx="50%" cy="50%"
                    innerRadius={isMobile ? 38 : 62} outerRadius={isMobile ? 58 : 92}
                    dataKey="value" startAngle={90} endAngle={-270}
                    strokeWidth={2} stroke={T.surface}
                  >
                    {DONUT_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 18 : 28, fontWeight: 700, color: T.primary }}>62%</div>
                <div style={{ fontSize: isMobile ? 9 : 10, color: T.textMed, fontWeight: 600 }}>ABI Total</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3px', marginTop: isMobile ? 0 : 8, flex: 1, width: isMobile ? 'auto' : '100%' }}>
              {DONUT_DATA.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: T.textMed }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.ink }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Line chart */}
        <ChartCard title="TENDENCIA SHARE ABI VS COMPETENCIA (6 SEMANAS)">
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 16, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: T.textMed }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 75]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.textMed }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => [`${v}%`, n === 'abi' ? 'ABI Portfolio' : 'Competencia']} />
              <Line type="monotone" dataKey="abi"  stroke={T.primary} strokeWidth={2.5} dot={{ r: 3, fill: T.primary }} name="ABI Portfolio" />
              <Line type="monotone" dataKey="comp" stroke={T.textLow} strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Competencia" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 18, marginTop: 6 }}>
            <LegendDot color={T.primary} label="ABI Portfolio" solid />
            <LegendDot color={T.textLow} label="Competencia" dashed />
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2: Bar + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.9fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Horizontal bar chart */}
        <ChartCard title="SHARE OF SHELF POR PDV">
          {shelfData.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.textLow, fontSize: 12 }}>
              Sin PDVs asignados aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, shelfData.length * 44)}>
              <BarChart data={shelfData} layout="vertical" margin={{ top: 0, right: 30, left: isMobile ? 4 : 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.textMed }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={isMobile ? 90 : 110} tick={{ fontSize: isMobile ? 10 : 11, fill: T.ink }} axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                <Tooltip formatter={v => [`${v}%`, 'Share']} />
                <Bar dataKey="value" fill={T.primary} radius={[0, 4, 4, 0]} background={{ fill: `${T.primary}15`, radius: [0, 4, 4, 0] }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Radar chart */}
        <ChartCard title="SCORECARD EJECUCIÓN">
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 220}>
            <RadarChart data={RADAR_DATA} margin={{ top: 16, right: 36, left: 36, bottom: 16 }}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 10, fill: T.textMed }} />
              <Radar dataKey="value" stroke={T.primary} fill={T.primary} fillOpacity={0.22} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* GVM compliance table */}
      {gvmStats.length > 0 && (
        <ChartCard title="CUMPLIMIENTO POR GVM">
          <div style={{ display: 'grid', gap: 10 }}>
            {gvmStats.map(g => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={g.initials} color={g.color} size={26} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: T.textMed }}>{getCountry(g.country).flag} {getCountry(g.country).code}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: g.pct >= 85 ? T.success : g.pct >= 50 ? T.warn : T.danger }}>
                      {g.pct}%
                    </span>
                    <div style={{ fontSize: 10, color: T.textMed }}>{g.done}/{g.total} PDVs</div>
                  </div>
                </div>
                <ProgressBar value={g.pct} color={g.pct >= 85 ? T.success : g.pct >= 50 ? T.warn : T.danger} height={6} />
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, emoji, value, sub, trend, up, accent }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '12px 14px', borderBottom: `3px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
    }} className="rise">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 16, flexShrink: 0, marginLeft: 4 }}>{emoji}</span>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textMed }}>{sub}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: up ? T.success : T.danger, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
        <span>{up ? '▲' : '▼'}</span> {trend}
      </div>
    </div>
  );
}

/* ── Chart Card wrapper ───────────────────────────────────────────────────── */
function ChartCard({ title, children }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 18px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 14, background: T.primary, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.textMed, letterSpacing: '.4px' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ── PDV filter pill ─────────────────────────────────────────────────────── */
function PdvPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="press" style={{
      border: `1.5px solid ${active ? T.primary : T.border}`,
      background: active ? T.primary : T.surface,
      color: active ? T.white : T.ink,
      borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: active ? 700 : 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  );
}

function downloadSheet(rows, sheetName, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG TAB
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

function CatalogTab({ user, users, catalog, setCatalog }) {
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [page, setPage]           = useState(0);
  const [assigningId, setAssigningId] = useState(null);
  const [assignTarget, setAssignTarget] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const gvms = users.filter(u => u.role === 'gvm');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalog.filter(p => {
      if (q && !p.name?.toLowerCase().includes(q) && !p.id?.toLowerCase().includes(q) && !p.addr?.toLowerCase().includes(q)) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterCountry && p.country !== filterCountry) return false;
      return true;
    });
  }, [catalog, search, filterStatus, filterCountry]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetPage = () => setPage(0);

  const handleAssign = async (pdvId) => {
    if (!assignTarget) return;
    setLoadingAction(pdvId);
    try {
      const maxOrder = catalog.filter(p => p.assigned_to === assignTarget).length;
      await data.assignPdv(pdvId, assignTarget, maxOrder + 1);
      setCatalog(prev => prev.map(p => p.id === pdvId ? { ...p, assigned_to: assignTarget } : p));
      setAssigningId(null);
      setAssignTarget('');
      toast.success('PDV asignado correctamente.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRelease = async (pdvId) => {
    if (!await toast.confirm('¿Liberar este PDV al pool?')) return;
    setLoadingAction(pdvId);
    try {
      await data.unassignPdv(pdvId);
      setCatalog(prev => prev.map(p => p.id === pdvId ? { ...p, assigned_to: null } : p));
      toast.success('PDV liberado al pool.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (pdv) => {
    if (!await toast.confirm(`¿Eliminar "${pdv.name}"? Esta acción no se puede deshacer.`)) return;
    setLoadingAction(pdv.id);
    try {
      await data.deletePdv(pdv.id);
      setCatalog(prev => prev.filter(p => p.id !== pdv.id));
      toast.success(`"${pdv.name}" eliminado.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const statusColors = { done: T.success, in_progress: T.warn, pending: T.textLow };
  const statusLabels = { done: 'Listo', in_progress: 'En curso', pending: 'Pendiente' };

  return (
    <div className="fade">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={13} color={T.textLow} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Buscar PDV..."
            style={{
              width: '100%', padding: '8px 10px 8px 30px', border: `1px solid ${T.border}`,
              borderRadius: 9, fontSize: 12, color: T.ink, background: T.surface,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); resetPage(); }}
          style={selectStyle()}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En curso</option>
          <option value="done">Completado</option>
        </select>

        {isAdmin && (
          <select
            value={filterCountry}
            onChange={e => { setFilterCountry(e.target.value); resetPage(); }}
            style={selectStyle()}
          >
            <option value="">Todos los países</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        )}

        <button
          onClick={() => setShowImport(true)}
          className="press"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9, border: 'none',
            background: `linear-gradient(135deg,${T.primary},${T.primaryDim})`,
            color: T.white, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}
        >
          <Upload size={13} /> Importar
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: T.textMed, marginBottom: 10 }}>
        {filtered.length} PDVs · página {page + 1} de {Math.max(1, totalPages)}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 12,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {['ID', 'Nombre', 'Dirección', 'Cat.', 'Estado', 'País', 'Asignado a', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 12px', fontWeight: 800,
                  fontSize: 10, color: T.textMed, letterSpacing: '.4px',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: T.textLow, fontSize: 12 }}>
                  No se encontraron PDVs con los filtros actuales.
                </td>
              </tr>
            )}
            {pageData.map((p, i) => {
              const c   = getCountry(p.country);
              const gvm = users.find(u => u.id === p.assigned_to);
              const sc  = statusColors[p.status] || T.textLow;
              const isLoading = loadingAction === p.id;
              const isAssigning = assigningId === p.id;
              const rowGvms = gvms.filter(g => g.country === p.country);

              return (
                <tr key={p.id} style={{
                  background: i % 2 ? T.bg : T.surface,
                  borderTop: `1px solid ${T.border}`,
                  opacity: isLoading ? 0.5 : 1,
                }}>
                  <td style={{ padding: '9px 12px', color: T.textMed, fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                    {p.id}
                  </td>
                  <td style={{ padding: '9px 12px', color: T.ink, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '9px 12px', color: T.textMed, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.addr}
                  </td>
                  <td style={{ padding: '9px 12px', color: T.textMed, whiteSpace: 'nowrap' }}>
                    {p.cat}
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: sc + '18', color: sc, border: `1px solid ${sc}30`,
                      padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                    }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                    {c.flag} {c.code}
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                    {isAssigning ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          value={assignTarget}
                          onChange={e => setAssignTarget(e.target.value)}
                          style={{ ...selectStyle(), padding: '4px 8px', fontSize: 11 }}
                          autoFocus
                        >
                          <option value="">Seleccionar GVM</option>
                          {rowGvms.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(p.id)}
                          disabled={!assignTarget}
                          className="press"
                          style={{
                            border: 'none', background: T.success, color: T.white,
                            padding: '4px 10px', borderRadius: 6, fontSize: 11,
                            fontWeight: 700, cursor: assignTarget ? 'pointer' : 'default',
                            opacity: assignTarget ? 1 : 0.4,
                          }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => { setAssigningId(null); setAssignTarget(''); }}
                          className="press"
                          style={{
                            border: 'none', background: T.border, color: T.textMed,
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      gvm
                        ? <span style={{ color: T.success, fontWeight: 700 }}>{gvm.name}</span>
                        : <span style={{ color: T.textLow, fontStyle: 'italic' }}>Pool</span>
                    )}
                  </td>
                  <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                    {isLoading ? (
                      <Loader2 size={14} className="spin" color={T.textLow} />
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isAssigning && (
                          <ActionBtn
                            onClick={() => { setAssigningId(p.id); setAssignTarget(''); }}
                            title="Asignar"
                            color={T.info}
                          >
                            <User size={12} />
                          </ActionBtn>
                        )}
                        {p.assigned_to && (
                          <ActionBtn onClick={() => handleRelease(p.id)} title="Liberar" color={T.warn}>
                            <X size={12} />
                          </ActionBtn>
                        )}
                        <ActionBtn onClick={() => handleDelete(p)} title="Eliminar" color={T.danger}>
                          <Trash2 size={12} />
                        </ActionBtn>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="press"
            style={pageBtn(page === 0)}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i;
            return (
              <button key={pg} onClick={() => setPage(pg)} className="press" style={{
                ...pageBtn(false),
                background: pg === page ? T.primary : T.surface,
                color: pg === page ? T.white : T.textMed,
                border: `1px solid ${pg === page ? T.primary : T.border}`,
              }}>
                {pg + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="press"
            style={pageBtn(page >= totalPages - 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          user={user}
          catalog={catalog}
          setCatalog={setCatalog}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT MODAL (CSV / Excel)
// ─────────────────────────────────────────────────────────────────────────────
function ImportModal({ user, catalog, setCatalog, onClose }) {
  const isAdmin = user.role === 'admin';
  const [country, setCountry] = useState(isAdmin ? '' : user.country);
  const [rows, setRows]       = useState(null);
  const [preview, setPreview] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const mapped = parsed.map((r, idx) => ({
          id:      String(r.id || r.ID || '').trim() || `PDV-${country}-${String(idx + 1).padStart(3, '0')}`,
          name:    String(r.name || r.nombre || r.Nombre || '').trim(),
          addr:    String(r.addr || r.address || r.direccion || r.Direccion || '').trim(),
          cat:     String(r.cat || r.categoria || r.Categoria || 'General').trim(),
          channel: String(r.channel || r.canal || r.Canal || 'Off-trade').trim(),
          dist:    String(r.dist || r.distribuidor || r.Distribuidor || '').trim(),
          lat:     parseFloat(r.lat || r.latitude || 0) || 0,
          lng:     parseFloat(r.lng || r.longitude || r.lon || 0) || 0,
          status:  'pending',
          order:   parseInt(r.order || r.orden || idx + 1) || idx + 1,
          country: country,
          assigned_to: null,
        })).filter(r => r.name);
        setRows(mapped);
        setPreview(mapped.slice(0, 5));
        setError(null);
      } catch (err) {
        setError('No se pudo leer el archivo. Asegúrate de que sea CSV o Excel (.xlsx).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!rows || rows.length === 0 || !country) return;
    setSaving(true);
    try {
      await data.bulkUpsertPdvs(rows);
      setCatalog(prev => {
        const ids = new Set(rows.map(r => r.id));
        return [...prev.filter(p => !ids.has(p.id)), ...rows];
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 16 }}>
        Importar PDVs
      </div>

      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle2 size={40} color={T.success} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
            {rows.length} PDVs importados correctamente
          </div>
          <button onClick={onClose} className="press" style={{ ...primaryBtnStyle(), marginTop: 16 }}>
            Cerrar
          </button>
        </div>
      ) : (
        <>
          {/* Step 1: Country */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>1. PAÍS DESTINO</FieldLabel>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setRows(null); setPreview([]); }}
              disabled={!isAdmin}
              style={selectStyle()}
            >
              <option value="">Seleccionar país…</option>
              {(isAdmin ? COUNTRIES : COUNTRIES.filter(c => c.code === user.country)).map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: File */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>2. ARCHIVO CSV o EXCEL</FieldLabel>
            <div style={{ fontSize: 10.5, color: T.textMed, marginBottom: 8, lineHeight: 1.5 }}>
              Columnas esperadas: <code style={{ background: T.surfaceAlt, padding: '1px 5px', borderRadius: 4 }}>name, addr, lat, lng</code> (obligatorias) +{' '}
              <code style={{ background: T.surfaceAlt, padding: '1px 5px', borderRadius: 4 }}>id, cat, channel, dist, order</code> (opcionales)
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!country}
              className="press"
              style={{
                width: '100%', padding: 12, border: `2px dashed ${T.border}`,
                borderRadius: 10, background: country ? T.bg : T.surfaceAlt,
                cursor: country ? 'pointer' : 'not-allowed', color: T.textMed,
                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              <Upload size={15} /> {rows ? `${rows.length} filas cargadas ✓` : 'Seleccionar archivo'}
            </button>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>VISTA PREVIA (primeras {preview.length} filas)</FieldLabel>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      {['ID', 'Nombre', 'Dirección', 'Lat', 'Lng'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 800, color: T.textMed, fontSize: 10, letterSpacing: '.3px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.surface }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 10 }}>{r.id}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: T.ink }}>{r.name}</td>
                        <td style={{ padding: '7px 10px', color: T.textMed, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.addr}</td>
                        <td style={{ padding: '7px 10px', color: T.textMed }}>{r.lat.toFixed(4)}</td>
                        <td style={{ padding: '7px 10px', color: T.textMed }}>{r.lng.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <div style={{ fontSize: 10, color: T.textMed, marginTop: 6, textAlign: 'center' }}>
                  … y {rows.length - 5} filas más
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              background: T.dangerSoft, border: `1px solid ${T.danger}30`,
              borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: T.danger,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="press" style={cancelBtnStyle()}>Cancelar</button>
            <button
              onClick={handleImport}
              disabled={!rows || rows.length === 0 || !country || saving}
              className="press"
              style={{
                ...primaryBtnStyle(),
                opacity: (!rows || !country || saving) ? 0.5 : 1,
                cursor: (!rows || !country || saving) ? 'default' : 'pointer',
              }}
            >
              {saving ? (
                <><Loader2 size={13} className="spin" /> Importando…</>
              ) : (
                `Importar ${rows ? rows.length : 0} PDVs`
              )}
            </button>
          </div>
        </>
      )}
    </ModalBackdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab({ user, users, onReload }) {
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [modal, setModal]           = useState(null); // null | 'create' | editUser
  const [deleting, setDeleting]     = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (q && !u.name?.toLowerCase().includes(q) && !u.username?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
      if (filterRole    && u.role    !== filterRole)    return false;
      if (filterCountry && u.country !== filterCountry) return false;
      return true;
    });
  }, [users, search, filterRole, filterCountry]);

  const handleDeleteUser = async (u) => {
    if (u.id === user.id) { toast.warn('No puedes eliminar tu propia cuenta.'); return; }
    if (!await toast.confirm(`¿Eliminar a ${u.name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(u.id);
    try {
      await data.deleteUserAccount(u.id);
      toast.success(`${u.name} eliminado.`);
      if (onReload) onReload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const roleColors = { admin: T.navy, supervisor: T.info, gvm: T.primary };
  const roleIcons  = { admin: Shield, supervisor: Globe, gvm: User };

  return (
    <div className="fade">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={13} color={T.textLow} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario…"
            style={{
              width: '100%', padding: '8px 10px 8px 30px', border: `1px solid ${T.border}`,
              borderRadius: 9, fontSize: 12, color: T.ink, background: T.surface,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={selectStyle()}>
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="gvm">GVM</option>
        </select>

        {isAdmin && (
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={selectStyle()}>
            <option value="">Todos los países</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        )}

        <button onClick={() => setModal('create')} className="press" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 9, border: 'none',
          background: `linear-gradient(135deg,${T.primary},${T.primaryDim})`,
          color: T.white, fontWeight: 700, fontSize: 12, cursor: 'pointer',
        }}>
          <Plus size={13} /> Crear usuario
        </button>
      </div>

      <div style={{ fontSize: 11, color: T.textMed, marginBottom: 10 }}>
        {filtered.length} de {users.length} usuarios
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 12,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {['Usuario', 'Nombre', 'Email', 'Rol', 'País', 'Stats', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 12px', fontWeight: 800,
                  fontSize: 10, color: T.textMed, letterSpacing: '.4px',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: T.textLow, fontSize: 12 }}>
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
            {filtered.map((u, i) => {
              const c    = u.country ? getCountry(u.country) : null;
              const rc   = roleColors[u.role] || T.textMed;
              const RoleIcon = roleIcons[u.role] || User;
              const isDeleting = deleting === u.id;
              return (
                <tr key={u.id} style={{
                  background: i % 2 ? T.bg : T.surface,
                  borderTop: `1px solid ${T.border}`,
                  opacity: isDeleting ? 0.5 : 1,
                }}>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={u.initials || '??'} color={u.color || T.textMed} size={30} />
                      <div>
                        <div style={{ fontWeight: 700, color: T.ink, fontSize: 12 }}>
                          {u.username}
                          {u.id === user.id && <span style={{ marginLeft: 6, fontSize: 9.5, color: T.primaryDim, fontWeight: 800, background: T.primarySoft, padding: '1px 5px', borderRadius: 4 }}>tú</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.textLow, fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: T.ink }}>{u.name}</td>
                  <td style={{ padding: '9px 12px', color: T.textMed, fontSize: 11 }}>{u.email}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: rc + '18', color: rc, border: `1px solid ${rc}30`,
                      padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                    }}>
                      <RoleIcon size={10} /> {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    {c ? `${c.flag} ${c.code}` : <span style={{ color: T.textLow }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    {u.role === 'gvm' && (
                      <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
                        <span style={{ color: T.success, fontWeight: 700 }}>{u.visited || 0} vis</span>
                        <span style={{ color: T.textLow }}>/{u.planned || 0}</span>
                        {(u.oos || 0) > 0 && <span style={{ color: T.danger, fontWeight: 700 }}>{u.oos} OOS</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    {isDeleting ? (
                      <Loader2 size={14} className="spin" color={T.textLow} />
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <ActionBtn onClick={() => setModal(u)} title="Editar" color={T.info}>
                          <Edit2 size={12} />
                        </ActionBtn>
                        {u.id !== user.id && (
                          <ActionBtn onClick={() => handleDeleteUser(u)} title="Eliminar" color={T.danger}>
                            <Trash2 size={12} />
                          </ActionBtn>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <UserFormModal
          user={user}
          editing={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); if (onReload) onReload(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER FORM MODAL (Create + Edit)
// ─────────────────────────────────────────────────────────────────────────────
function UserFormModal({ user, editing, onClose, onSaved }) {
  const isAdmin   = user.role === 'admin';
  const isEditing = !!editing;

  const [form, setForm] = useState({
    name:     editing?.name     || '',
    username: editing?.username || '',
    email:    editing?.email    || '',
    password: '',
    role:     editing?.role     || 'gvm',
    country:  editing?.country  || (isAdmin ? 'VE' : user.country),
  });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())     { setError('El nombre es obligatorio.');        return; }
    if (!form.username.trim()) { setError('El usuario es obligatorio.');       return; }
    if (!form.email.trim())    { setError('El email es obligatorio.');         return; }
    if (!isEditing && !form.password) { setError('La contraseña es obligatoria.'); return; }

    setError(null);
    setLoading(true);
    try {
      const initials = form.name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || '??';
      const colors   = { admin: T.navy, supervisor: T.info, gvm: T.primary };

      if (isEditing) {
        await data.updateProfile(editing.id, {
          name:     form.name.trim(),
          username: form.username.trim().toLowerCase(),
          role:     form.role,
          country:  form.role === 'admin' ? null : form.country,
          initials,
          color:    colors[form.role],
        });
      } else {
        await data.createUserAccount({
          email:    form.email.trim(),
          password: form.password,
          profile: {
            username: form.username.trim().toLowerCase(),
            name:     form.name.trim(),
            role:     form.role,
            country:  form.role === 'admin' ? null : form.country,
            initials,
            color:    colors[form.role],
          },
        });
      }
      onSaved();
    } catch (e) {
      setError(e?.message || 'Error al guardar usuario');
      setLoading(false);
    }
  };

  const creatableRoles = isAdmin ? ['admin', 'supervisor', 'gvm'] : ['gvm'];

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 16 }}>
        {isEditing ? `Editar: ${editing.name}` : 'Crear usuario'}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {[
          { key: 'name',     label: 'NOMBRE COMPLETO', type: 'text' },
          { key: 'username', label: 'USUARIO',          type: 'text' },
          { key: 'email',    label: 'EMAIL',            type: 'email', disabled: isEditing },
          ...(!isEditing ? [{ key: 'password', label: 'CONTRASEÑA', type: 'password' }] : []),
        ].map(({ key, label, type, disabled }) => (
          <label key={key}>
            <FieldLabel>{label}</FieldLabel>
            <input
              type={type}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              disabled={disabled}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, fontSize: 13, color: T.ink,
                background: disabled ? T.surfaceAlt : T.bg, outline: 'none',
                fontFamily: FONT, boxSizing: 'border-box',
              }}
            />
          </label>
        ))}

        <label>
          <FieldLabel>ROL</FieldLabel>
          <select
            value={form.role}
            onChange={e => set('role', e.target.value)}
            style={{ ...selectStyle(), width: '100%', padding: '10px 12px' }}
          >
            {creatableRoles.map(r => (
              <option key={r} value={r}>
                {{ admin: 'Administrador', supervisor: 'Supervisor', gvm: 'GVM' }[r]}
              </option>
            ))}
          </select>
        </label>

        {form.role !== 'admin' && (
          <label>
            <FieldLabel>PAÍS</FieldLabel>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              disabled={!isAdmin}
              style={{ ...selectStyle(), width: '100%', padding: '10px 12px' }}
            >
              {(isAdmin ? COUNTRIES : COUNTRIES.filter(c => c.code === user.country)).map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <div style={{
          background: T.dangerSoft, border: `1px solid ${T.danger}30`,
          borderRadius: 8, padding: 10, marginTop: 12, fontSize: 12, color: T.danger,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} className="press" style={cancelBtnStyle()}>Cancelar</button>
        <button onClick={handleSave} disabled={loading} className="press" style={{
          ...primaryBtnStyle(), opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? <><Loader2 size={13} className="spin" /> Guardando…</> : isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, tone, sub }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: 14, borderTop: `3px solid ${tone}`,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: T.ink, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.textLow, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color, height = 8 }) {
  return (
    <div style={{ background: T.border, borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`, height: '100%',
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: 99, transition: 'width .5s ease',
      }} />
    </div>
  );
}

function Avatar({ initials, color, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: color + '22', color,
      display: 'grid', placeItems: 'center',
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
      border: `1.5px solid ${color}40`,
    }}>
      {initials}
    </div>
  );
}

function CountryChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="press" style={{
      border: `1px solid ${active ? T.primary : T.border}`,
      background: active ? T.primarySoft : T.surface,
      color: active ? T.primary : T.textMed,
      padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    }}>
      {label}
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10.5, color: T.textMed }}>{label}</span>
    </div>
  );
}

function ActionBtn({ onClick, title, color, children }) {
  return (
    <button onClick={onClick} title={title} className="press" style={{
      width: 28, height: 28, border: `1px solid ${color}30`, background: color + '15',
      borderRadius: 7, cursor: 'pointer', display: 'grid', placeItems: 'center',
      color,
    }}>
      {children}
    </button>
  );
}

function ModalBackdrop({ children, onClose }) {
  return (
    <div className="fade" style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,38,.6)',
      zIndex: 9000, display: 'grid', placeItems: 'center', padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pop" style={{
        background: T.surface, borderRadius: 18, width: '100%', maxWidth: 440,
        border: `1px solid ${T.border}`, padding: 22,
        boxShadow: '0 24px 60px rgba(0,0,0,.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: T.textMed,
      letterSpacing: '.4px', marginBottom: 5,
    }}>
      {children}
    </div>
  );
}

function selectStyle() {
  return {
    padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 9,
    fontSize: 12, color: T.ink, background: T.surface, outline: 'none',
    cursor: 'pointer', fontFamily: FONT,
  };
}

function pageBtn(disabled) {
  return {
    width: 32, height: 32, border: `1px solid ${T.border}`, borderRadius: 7,
    background: T.surface, color: disabled ? T.textLow : T.ink, cursor: disabled ? 'default' : 'pointer',
    display: 'grid', placeItems: 'center', opacity: disabled ? 0.4 : 1,
  };
}

function primaryBtnStyle() {
  return {
    flex: 1, border: 'none', padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 800,
    cursor: 'pointer', color: T.white, fontFamily: FONT,
    background: `linear-gradient(135deg,${T.primary},${T.primaryDim})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
}

function cancelBtnStyle() {
  return {
    flex: 1, border: `1px solid ${T.border}`, background: T.surface, padding: 11,
    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: T.inkSoft,
    fontFamily: FONT,
  };
}

/* ── Skeleton del supervisor ─────────────────────────────────────────────── */
function OverviewSkeleton() {
  return (
    <div className="fade" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* KPI row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {['#2C9D63','#3D83C2','#C68A12','#2C4256'].map((c, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, borderTop: `3px solid ${c}` }}>
            <div className="shimmer" style={{ height: 8, width: '55%', borderRadius: 4, marginBottom: 10 }} />
            <div className="shimmer" style={{ height: 24, width: '65%', borderRadius: 6, marginBottom: 6 }} />
            <div className="shimmer" style={{ height: 7, width: '45%', borderRadius: 3 }} />
          </div>
        ))}
      </div>

      {/* Tabla skeleton */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Cabecera */}
        <div style={{ padding: '13px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <div className="shimmer" style={{ height: 8, width: '25%', borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 8, width: '15%', borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 8, width: '15%', borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 8, width: '20%', borderRadius: 4 }} />
        </div>
        {/* Filas */}
        {[80, 65, 72, 88, 60].map((w, i) => (
          <div key={i} style={{
            padding: '14px 18px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div className="shimmer" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ height: 10, width: `${w}%`, borderRadius: 5, marginBottom: 7 }} />
              <div className="shimmer" style={{ height: 8, width: '40%', borderRadius: 4 }} />
            </div>
            <div className="shimmer" style={{ width: 60, height: 22, borderRadius: 8, flexShrink: 0 }} />
            <div className="shimmer" style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
