import { useState, useMemo, useRef } from 'react';
import { useToast } from './Toaster.jsx';
import * as XLSX from 'xlsx';
import {
  BarChart3, Database, UserRound, Plus, Trash2, Upload, Loader2,
  Search, ChevronLeft, ChevronRight, X, CheckCircle2,
  AlertCircle, Edit2, Globe, Shield, User, Download, Bell, Timer,
} from 'lucide-react';
import SolicitudesTab  from './SolicitudesTab.jsx';
import TimingsPanel    from './TimingsPanel.jsx';
import { T, FONT, DISPLAY, COUNTRIES, getCountry } from '../lib/constants.jsx';
import * as data from '../lib/data.js';

export default function SupervisorDashboard({ desktop, user, users, setUsers, catalog, setCatalog, onReload, pendingApprovals, setPendingApprovals }) {
  const [tab, setTab] = useState('overview');
  const isAdmin = user.role === 'admin';

  const myApprovals = (pendingApprovals || []).filter(a => isAdmin || a.country === user.country);
  const tabs = [
    ['overview',    'Resumen',     BarChart3],
    ['catalog',     'Catálogo',    Database],
    ['users',       'Usuarios',    UserRound],
    ['solicitudes', 'Solicitudes', Bell],
    ['tiempos',     'Tiempos',     Timer],
  ];

  return (
    <div style={{
      width: '100%', maxWidth: 1180, background: T.surface, borderRadius: 22,
      border: `1px solid ${T.border}`, padding: desktop ? 26 : 16, fontFamily: FONT,
      boxShadow: '0 30px 70px -34px rgba(38,48,58,.4)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 22, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: desktop ? 25 : 20, fontWeight: 600, color: T.ink }}>
            {tab === 'tiempos'
            ? 'Tiempos de levantamiento'
            : isAdmin ? 'Panel de Administración' : `Panel · ${getCountry(user.country).flag} ${getCountry(user.country).name}`}
          </div>
          <div style={{ fontSize: 12, color: T.textMed, marginTop: 2 }}>
            {isAdmin ? 'Vista global · CAM Internacional' : `Supervisor · ${getCountry(user.country).name}`}
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 4, background: T.bg, padding: 4,
          borderRadius: 11, border: `1px solid ${T.border}`,
        }}>
          {tabs.map(([k, l, Ic]) => (
            <button key={k} onClick={() => setTab(k)} className="press" style={{
              border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12,
              fontWeight: 700, cursor: 'pointer',
              color: tab === k ? T.white : T.textMed,
              background: tab === k ? `linear-gradient(135deg,${T.primary},${T.primaryDim})` : 'transparent',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Ic size={13} /> {l}
              {k === 'solicitudes' && myApprovals.length > 0 && (
                <span style={{ background: '#D5443D', color: '#FFFEFB', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', marginLeft: 1 }}>
                  {myApprovals.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview'    && <OverviewTab user={user} users={users} catalog={catalog} pendingCount={myApprovals.length} onViewSolicitudes={() => setTab('solicitudes')} />}
      {tab === 'catalog'     && <CatalogTab  user={user} users={users} catalog={catalog} setCatalog={setCatalog} onReload={onReload} />}
      {tab === 'users'       && <UsersTab    user={user} users={users} setUsers={setUsers} onReload={onReload} />}
      {tab === 'solicitudes' && <SolicitudesTab approvals={myApprovals} setPendingApprovals={setPendingApprovals} catalog={catalog} setCatalog={setCatalog} user={user} />}
      {tab === 'tiempos'     && <TimingsPanel user={user} users={users} catalog={catalog} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ user, users, catalog, pendingCount = 0, onViewSolicitudes }) {
  if (catalog.length === 0) return <OverviewSkeleton />;
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const [filterCountry, setFilterCountry] = useState('');
  const [exporting, setExporting] = useState(null);

  const filteredCatalog = filterCountry
    ? catalog.filter(p => p.country === filterCountry)
    : catalog;

  const filteredUsers = filterCountry
    ? users.filter(u => u.country === filterCountry)
    : users;

  const gvms = filteredUsers.filter(u => u.role === 'gvm');
  const totalPdvs  = filteredCatalog.length;
  const done       = filteredCatalog.filter(p => p.status === 'done').length;
  const inProgress = filteredCatalog.filter(p => p.status === 'in_progress').length;
  const pending    = filteredCatalog.filter(p => p.status === 'pending').length;
  const poolCount  = filteredCatalog.filter(p => !p.assigned_to).length;
  const coveragePct = totalPdvs > 0 ? Math.round((done / totalPdvs) * 100) : 0;

  const gvmStats = gvms.map(g => {
    const pdvs  = filteredCatalog.filter(p => p.assigned_to === g.id);
    const gdone = pdvs.filter(p => p.status === 'done').length;
    const total = pdvs.length;
    return { ...g, done: gdone, total, pct: total > 0 ? Math.round((gdone / total) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const oosTotal = filteredUsers.reduce((s, u) => s + (u.oos || 0), 0);

  return (
    <div className="fade">
      {pendingCount > 0 && (
        <div className="rise" style={{
          background: '#FBEFD4', border: '1px solid #EFDAAD', borderRadius: 14,
          padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Bell size={18} color="#DD9426" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#26303A' }}>
              {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} de nuevo PDV pendiente{pendingCount > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 11, color: '#5C6770' }}>GVMs registraron nuevos clientes que esperan tu aprobación</div>
          </div>
          <button onClick={onViewSolicitudes} className="press" style={{
            border: 'none', background: '#DD9426', color: '#FFFEFB',
            padding: '8px 14px', borderRadius: 9, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
          }}>Ver solicitudes</button>
        </div>
      )}
      {/* Country filter (admin only) */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Globe size={14} color={T.textMed} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <CountryChip code="" label="Todos" active={filterCountry === ''} onClick={() => setFilterCountry('')} />
            {COUNTRIES.map(c => (
              <CountryChip key={c.code} code={c.code} label={`${c.flag} ${c.code}`} active={filterCountry === c.code} onClick={() => setFilterCountry(c.code)} />
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        <StatCard label="GVMs activos"  value={gvms.length}    tone={T.primary} sub="en campo" />
        <StatCard label="PDVs totales"  value={totalPdvs}      tone={T.navy}    sub="en catálogo" />
        <StatCard label="Completados"   value={done}           tone={T.success} sub={`${coveragePct}% cobertura`} />
        <StatCard label="En progreso"   value={inProgress}     tone={T.warn}    sub="con check-in" />
        <StatCard label="Pendientes"    value={pending}        tone={T.textLow} sub="sin visitar" />
        <StatCard label="Pool (libre)"  value={poolCount}      tone={T.info}    sub="sin asignar" />
      </div>

      {/* Coverage progress bar */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px' }}>
            COBERTURA GENERAL
          </span>
          <span style={{
            fontFamily: DISPLAY, fontSize: 22, fontWeight: 700,
            color: coveragePct >= 85 ? T.success : coveragePct >= 50 ? T.warn : T.danger,
          }}>
            {coveragePct}%
          </span>
        </div>
        <ProgressBar value={coveragePct} color={coveragePct >= 85 ? T.success : coveragePct >= 50 ? T.warn : T.danger} />
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <LegendDot color={T.success} label={`${done} completados`} />
          <LegendDot color={T.warn}    label={`${inProgress} en progreso`} />
          <LegendDot color={T.textLow} label={`${pending} pendientes`} />
        </div>
      </div>

      {/* GVM Compliance Bars */}
      {gvmStats.length > 0 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 14 }}>
            CUMPLIMIENTO POR GVM
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {gvmStats.map(g => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={g.initials} color={g.color} size={28} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: T.textMed }}>
                        {getCountry(g.country).flag} {getCountry(g.country).code}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800,
                      color: g.pct >= 85 ? T.success : g.pct >= 50 ? T.warn : T.danger,
                    }}>
                      {g.pct}%
                    </div>
                    <div style={{ fontSize: 10, color: T.textMed }}>{g.done}/{g.total} PDVs</div>
                  </div>
                </div>
                <ProgressBar
                  value={g.pct}
                  color={g.pct >= 85 ? T.success : g.pct >= 50 ? T.warn : T.danger}
                  height={6}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OOS Alerts */}
      {oosTotal > 0 && (
        <div style={{
          background: T.dangerSoft, border: `1px solid ${T.danger}30`, borderRadius: 14,
          padding: 14, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <AlertCircle size={16} color={T.danger} />
            <span style={{ fontSize: 12, fontWeight: 800, color: T.danger }}>ALERTAS OOS</span>
          </div>
          <div style={{ fontSize: 12, color: T.danger }}>
            {oosTotal} producto(s) sin stock reportados en los últimos levantamientos.
          </div>
        </div>
      )}

      {/* Reports export */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.textMed, letterSpacing: '.3px', marginBottom: 14 }}>
          EXPORTAR REPORTES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { key: 'coverage',  label: 'Cobertura PDVs',      desc: 'Estado de todos los PDVs',           color: T.primary },
            { key: 'surveys',   label: 'Levantamientos',      desc: 'Resumen de encuestas realizadas',    color: T.navy },
            { key: 'oos',       label: 'Alertas OOS',         desc: 'Productos sin stock detectados',     color: T.danger },
            { key: 'gvms',      label: 'Performance GVMs',    desc: 'Cumplimiento por gestor de campo',   color: T.success },
          ].map(({ key, label, desc, color }) => (
            <button
              key={key}
              onClick={() => handleExport(key)}
              disabled={exporting !== null}
              className="press"
              style={{
                padding: '12px 14px', borderRadius: 10, border: `1px solid ${color}30`,
                background: exporting === key ? color + '15' : T.bg,
                cursor: exporting !== null ? 'default' : 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                opacity: exporting !== null && exporting !== key ? 0.5 : 1,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: color + '18',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {exporting === key
                  ? <Loader2 size={14} color={color} className="spin" />
                  : <Download size={14} color={color} />
                }
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{label}</div>
                <div style={{ fontSize: 10, color: T.textMed, marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  async function handleExport(type) {
    setExporting(type);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const gvmMap = Object.fromEntries(
        filteredUsers.filter(u => u.role === 'gvm').map(u => [u.id, u.name])
      );

      if (type === 'coverage') {
        const rows = filteredCatalog.map(p => ({
          'ID PDV': p.id,
          'Nombre': p.name,
          'Dirección': p.addr || '',
          'País': p.country || '',
          'Estado': p.status || '',
          'GVM Asignado': p.assigned_to ? (gvmMap[p.assigned_to] || 'Desconocido') : 'Sin asignar',
          'Orden': p.order ?? '',
        }));
        downloadSheet(rows, 'Cobertura', `reporte-cobertura-${dateStr}.xlsx`);

      } else if (type === 'gvms') {
        const gvms = filteredUsers.filter(u => u.role === 'gvm');
        const rows = gvms.map(g => {
          const pdvs = filteredCatalog.filter(p => p.assigned_to === g.id);
          const done = pdvs.filter(p => p.status === 'done').length;
          const total = pdvs.length;
          return {
            'GVM': g.name,
            'País': g.country || '',
            'PDVs Asignados': total,
            'Completados': done,
            'En Progreso': pdvs.filter(p => p.status === 'in_progress').length,
            'Pendientes': pdvs.filter(p => p.status === 'pending').length,
            'Cumplimiento %': total > 0 ? Math.round((done / total) * 100) : 0,
          };
        }).sort((a, b) => b['Cumplimiento %'] - a['Cumplimiento %']);
        downloadSheet(rows, 'GVMs', `reporte-gvms-${dateStr}.xlsx`);

      } else if (type === 'surveys') {
        const surveys = await data.fetchSurveys(filterCountry ? { country: filterCountry } : {});
        const pdvMap = Object.fromEntries(filteredCatalog.map(p => [p.id, p.name]));
        const rows = surveys.map(s => ({
          'ID Levantamiento': s.id,
          'PDV': pdvMap[s.pdv_id] || s.pdv_id,
          'País': s.country || '',
          'Tipo': s.kind || '',
          'Estado': s.status || '',
          'GVM': gvmMap[s.created_by] || s.created_by || '',
          'Fecha': new Date(s.created_at).toLocaleDateString('es'),
          'Notas': s.notes || '',
        }));
        downloadSheet(rows, 'Levantamientos', `reporte-levantamientos-${dateStr}.xlsx`);

      } else if (type === 'oos') {
        const surveys = await data.fetchSurveys(filterCountry ? { country: filterCountry } : {});
        const pdvMap = Object.fromEntries(filteredCatalog.map(p => [p.id, p.name]));
        const rows = [];
        for (const s of surveys) {
          for (const item of (s.items || [])) {
            if (item.oos) {
              rows.push({
                'PDV': pdvMap[s.pdv_id] || s.pdv_id,
                'País': s.country || '',
                'GVM': gvmMap[s.created_by] || s.created_by || '',
                'SKU': item.sku || '',
                'Fecha': new Date(s.created_at).toLocaleDateString('es'),
              });
            }
          }
        }
        if (rows.length === 0) {
          toast.info('No hay alertas OOS registradas para el período seleccionado.');
          return;
        }
        downloadSheet(rows, 'OOS', `reporte-oos-${dateStr}.xlsx`);
      }

      toast.success('Reporte descargado correctamente.');
    } catch (e) {
      toast.error(`Error generando reporte: ${e.message}`);
    } finally {
      setExporting(null);
    }
  }
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
