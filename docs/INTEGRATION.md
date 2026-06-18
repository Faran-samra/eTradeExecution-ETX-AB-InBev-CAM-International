# Guía de integración del prototipo a producción

Este documento explica cómo el equipo backend debe **migrar la UI completa del prototipo monolítico** (`ABInBev_TradeApp.prototype.jsx` en la raíz del ZIP) a la arquitectura Supabase del proyecto modular en `src/`.

---

## Contexto

El prototipo monolítico es un archivo único de ~2700 líneas que tiene **toda la UI funcional** del producto: animaciones, layouts responsivos, validaciones, captura de fotos en vivo, análisis IA, dashboard con tabs, etc. Sin embargo, persiste todo en `localStorage` (es un demo).

La arquitectura modular en `src/` tiene la estructura de producción correcta:
- `App.jsx` con auth de Supabase
- Capa de datos en `src/lib/data.js`
- Componentes esenciales: `LoginScreen`, `UserChip`, `CameraHost` (estos sí están completos)
- **Stubs** de `FieldApp.jsx` y `SupervisorDashboard.jsx` que muestran cómo conectar con Supabase pero no traen toda la UI

**Tu trabajo como equipo backend**: portar la UI completa del prototipo a los componentes modulares, reemplazando las llamadas a `setCatalog`/`setUsers` (localStorage) por las funciones de `src/lib/data.js` (Supabase).

---

## Mapeo de componentes

El prototipo contiene estos componentes internos que deben extraerse a `src/components/` propios:

| Componente del prototipo | Archivo destino sugerido | Función actual | Reemplazar por |
|---|---|---|---|
| `LoginScreen` | `src/components/LoginScreen.jsx` ✅ | findUserByLogin(users) | `signIn(email, pwd)` |
| `UserChip` | `src/components/UserChip.jsx` ✅ | — | — (ya migrado) |
| `CameraHost` | `src/components/CameraHost.jsx` ✅ | — | — (ya migrado) |
| `FieldApp` | `src/components/FieldApp.jsx` ⚠️ stub | Estado local de catálogo | Recibe `catalog` por prop |
| `DesktopAside` | `src/components/field/DesktopAside.jsx` | Lee constantes hardcoded | Recibe `gvm` y país por prop |
| `FieldHeader` | `src/components/field/FieldHeader.jsx` | — | — |
| `BottomTabs` | `src/components/field/BottomTabs.jsx` | — | — |
| `ItineraryScreen` | `src/components/field/ItineraryScreen.jsx` | Filtra catalog por GVM | Usa `fetchPdvs({assignedTo: user.id})` |
| `PoolScreen` | `src/components/field/PoolScreen.jsx` | Filtra catalog por pool | Usa `fetchPdvs({country, assignedTo: null})` |
| `PdvDetail` | `src/components/field/PdvDetail.jsx` | Lee del catalog | Recibe `pdv` por prop |
| `CheckinScreen` | `src/components/field/CheckinScreen.jsx` | setCheckedIn en state | `createCheckin({pdvId, lat, lng, photoUrl})` |
| `PriceSurvey` | `src/components/field/surveys/PriceSurvey.jsx` | analyzeShelf llama directo a api.anthropic | `analyzeShelfImage(file)` de lib/supabase.js |
| `CoolerSurvey` | `src/components/field/surveys/CoolerSurvey.jsx` | — | `createSurvey({kind:'neveras',...})` |
| `GenericSurvey` | `src/components/field/surveys/GenericSurvey.jsx` | — | `createSurvey(...)` |
| `KpiScreen` | `src/components/field/KpiScreen.jsx` | Datos hardcoded | Query a `surveys` agrupada |
| `ProfileScreen` | `src/components/field/ProfileScreen.jsx` | Datos del prop `gvm` | Igual, recibe `user` por prop |
| `SupervisorDashboard` | `src/components/SupervisorDashboard.jsx` ⚠️ stub | Tabs Resumen/Catálogo/Usuarios | Conecta cada tab con DAOs |
| `OverviewTab` | `src/components/dashboard/OverviewTab.jsx` | Métricas del prop `users` | Aggregate query a `surveys` |
| `CatalogTab` | `src/components/dashboard/CatalogTab.jsx` | Import a localStorage | `bulkUpsertPdvs(parsed)` |
| `UsersTab` | `src/components/dashboard/UsersTab.jsx` | setUsers a localStorage | `createUserAccount`, `deleteUserAccount` |
| `UserFormModal` | `src/components/dashboard/UserFormModal.jsx` | — | — (validación igual, action diferente) |

---

## Patrones de reemplazo (con ejemplos concretos)

### Patrón 1 · Cargar PDVs

**Antes (prototipo):**
```jsx
const [catalog, setCatalog] = useState(() => loadCatalog()); // localStorage
const pdvs = catalog.filter(p => p.assignedTo === gvm.id);
```

**Después (Supabase):**
```jsx
import * as data from '../lib/data.js';

const [pdvs, setPdvs] = useState([]);
useEffect(() => {
  data.fetchPdvs({ assignedTo: user.id }).then(setPdvs);
}, [user.id]);
```

### Patrón 2 · Auto-asignación de PDV del pool

**Antes:**
```jsx
const assignToMe = (id) => {
  const nextOrder = pdvs.length + 1;
  setCatalog(c => c.map(x => x.id === id ? { ...x, assignedTo: gvm.id, order: nextOrder } : x));
};
```

**Después:**
```jsx
const assignToMe = async (id) => {
  const nextOrder = pdvs.length + 1;
  try {
    await data.assignPdv(id, user.id, nextOrder);
    // Recargar PDVs (o usar optimistic update)
    const fresh = await data.fetchPdvs({ assignedTo: user.id });
    setPdvs(fresh);
  } catch (e) {
    showToast(e.message, 'error');
  }
};
```

### Patrón 3 · Check-in con foto

**Antes:**
```jsx
const handleCheckin = async (photoFile) => {
  setCheckedIn(s => ({ ...s, [pdv.id]: true }));
};
```

**Después:**
```jsx
const handleCheckin = async (photoFile, location) => {
  // 1) Subir foto
  const { url } = await uploadPhoto(photoFile, `checkin-${pdv.id}`, 'checkin');
  // 2) Crear registro
  await data.createCheckin({
    pdvId: pdv.id,
    lat: location.lat,
    lng: location.lng,
    distanceMeters: location.distance,
    photoUrl: url,
  });
  // 3) Actualizar estado local
  setCheckedIn(s => ({ ...s, [pdv.id]: true }));
};
```

### Patrón 4 · Análisis IA de góndola

**Antes (en el prototipo el código llama directo a Claude — INSEGURO en producción):**
```jsx
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': 'sk-ant-...' }, // ⚠️ NUNCA exponer
  ...
});
```

**Después (vía Edge Function):**
```jsx
import { analyzeShelfImage } from '../lib/supabase.js';

const result = await analyzeShelfImage(photoFile);
// result = { items: [...], facings_abi: N, facings_total: N }
```

### Patrón 5 · Crear levantamiento

```jsx
const handleSubmitSurvey = async (payload, photoFile) => {
  // 1) Crear survey
  const survey = await data.createSurvey({
    pdv_id: pdv.id,
    kind: 'precios',
    country: pdv.country,
    payload,
  });
  // 2) Subir foto y vincularla
  const { url, path } = await uploadPhoto(photoFile, survey.id, 'precios');
  await supabase.from('survey_photos').insert({
    survey_id: survey.id,
    url,
    storage_path: path,
    is_live: true,
  });
  // 3) Insertar items detectados/agregados
  if (payload.items?.length) {
    await supabase.from('survey_items').insert(
      payload.items.map(i => ({ survey_id: survey.id, ...i }))
    );
  }
  showToast('Levantamiento sincronizado');
};
```

### Patrón 6 · Crear usuario (con permisos)

**Antes:**
```jsx
const saveUser = (newUser) => {
  setUsers(us => [...us, newUser]);
};
```

**Después (la Edge Function valida permisos automáticamente):**
```jsx
const saveUser = async (form) => {
  try {
    await data.createUserAccount({
      email: form.email,
      password: form.password,
      profile: {
        username: form.username,
        name: form.name,
        role: form.role,
        country: form.role === 'admin' ? null : form.country,
        initials: form.initials,
        color: form.color,
      },
    });
    const fresh = await data.fetchProfiles();
    setUsers(fresh);
  } catch (e) {
    setError(e.message); // "Supervisor solo puede crear GVMs", etc.
  }
};
```

### Patrón 7 · Importación masiva CSV/Excel

```jsx
import * as XLSX from 'xlsx';

const handleFile = async (file, country) => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  // ... parseo igual que en el prototipo ...
  const parsed = rows.map((r, i) => ({
    id: r.id || `PDV-${country}-${Date.now()}-${i}`,
    name: r.nombre, cat: r.categoria, channel: r.canal,
    addr: r.direccion, lat: r.lat, lng: r.lng,
    country,
    assigned_to: null,  // ⚠️ snake_case en Supabase
    status: 'pending',
  }));
  await data.bulkUpsertPdvs(parsed);
  showToast(`${parsed.length} PDVs importados`);
};
```

⚠️ **Detalle importante**: en el prototipo los campos están en camelCase (`assignedTo`); en Supabase están en snake_case (`assigned_to`). Hay que normalizar al pasar entre capas. Recomendación: una función `normalizePdv()` en `src/lib/data.js` que haga la conversión bidireccional.

---

## Roadmap sugerido (orden de migración)

### Sprint 1: Autenticación y vista del GVM (2-3 días)
1. ✅ `LoginScreen` ya migrado
2. Migrar `FieldApp` con `ItineraryScreen` y `PoolScreen` usando `fetchPdvs`
3. Migrar `PdvDetail` y `CheckinScreen` usando `createCheckin`
4. Migrar `ProfileScreen` usando datos del prop `user`
5. **Probar**: login como GVM, ver itinerario, auto-asignar PDV del pool, hacer check-in

### Sprint 2: Levantamientos (3-4 días)
1. Migrar `PriceSurvey` usando `analyzeShelfImage` (Edge Function)
2. Migrar `CoolerSurvey` (selectores, sliders)
3. Migrar `GenericSurvey` (inventario, góndolas, POP, competencia)
4. Implementar `uploadPhoto` + `createSurvey` + insert en `survey_items`/`survey_photos`
5. **Probar**: completar los 6 levantamientos de un PDV y verlos en BD

### Sprint 3: Dashboard del supervisor (3-4 días)
1. Migrar `OverviewTab` con queries agregadas a `surveys`
2. Migrar `CatalogTab` con `bulkUpsertPdvs`, `assignPdv`, `unassignPdv`
3. Migrar `UsersTab` y `UserFormModal` con `createUserAccount` / `deleteUserAccount`
4. **Probar**: importar Excel, asignar PDV a GVM, crear y eliminar usuarios

### Sprint 4: Pulido y producción (2-3 días)
1. Manejo de errores robusto (toasts, retry, offline awareness)
2. Loading states en todas las queries
3. Optimistic updates donde tenga sentido
4. Tests end-to-end (Playwright o Cypress)
5. Reportes exportables (PDF/Excel) si están en scope

**Total estimado**: 10-14 días de trabajo de un dev senior + 1-2 días de QA.

---

## Mantener funcionando el prototipo durante la migración

Mientras migran, pueden seguir usando el archivo `ABInBev_TradeApp.prototype.jsx` como **fuente de verdad visual**. Recomiendo:

1. Hacer un `git branch prototype-reference` con el monolito intacto
2. Trabajar la migración en `main`
3. Cada vez que migran un componente, copiar el JSX de la rama referencia y solo cambiar la capa de datos

---

## Consultas SQL útiles para el dashboard

### Cobertura por país
```sql
select country,
       count(distinct created_by) as gvms_activos,
       count(distinct pdv_id) as pdvs_visitados,
       count(*) as levantamientos
from surveys
where created_at >= current_date
group by country;
```

### OOS detectados (de payload jsonb)
```sql
select s.country, p.name as pdv, s.created_at,
       jsonb_array_length(s.payload->'skus') as skus_revisados
from surveys s
join pdvs p on p.id = s.pdv_id
where s.kind = 'inventario'
  and s.payload @> '{"skus": [{"oos": true}]}'::jsonb
order by s.created_at desc;
```

### Top GVMs por cumplimiento
```sql
select pr.name, pr.country,
       count(distinct s.pdv_id) as pdvs_completados,
       pr.planned,
       round(100.0 * count(distinct s.pdv_id) / nullif(pr.planned, 0), 1) as pct
from profiles pr
left join surveys s on s.created_by = pr.id
where pr.role = 'gvm'
group by pr.id
order by pct desc nulls last;
```

---

## Preguntas frecuentes del equipo backend

**Q: ¿Por qué no usar Server Components / Next.js?**
A: Para este alcance (SPA con auth, queries directas a Supabase, captura de cámara nativa), Vite es más simple, builds más rápidos y el bundle final es más pequeño. Si el equipo prefiere Next.js es perfectamente compatible: solo hay que migrar las rutas, pero la capa de datos (`src/lib/`) funciona idéntica.

**Q: ¿Cómo manejar el modo offline?**
A: No está en MVP. Recomendación: añadir `idb-keyval` o Dexie para guardar la cola de mutaciones en IndexedDB y usar `window.online` event listener para sincronizar al recuperar conexión. Las mutaciones a Supabase ya devuelven errores claros si hay problemas de red.

**Q: ¿Cómo hacer reportes en PDF?**
A: Crear una Edge Function adicional que use `jsPDF` (o `pdfkit`) y reciba parámetros de fecha y país. Devolver el PDF como blob. El frontend lo descarga con `URL.createObjectURL`. Para Excel: usar el mismo `xlsx` que ya está en dependencias.

**Q: ¿Cómo escalar si crecemos a 10,000 PDVs?**
A: Las RLS policies y los índices ya están preparados. Lo que habrá que hacer:
1. Paginación en `fetchPdvs` (agregar `limit/offset` o cursor-based)
2. Virtualización de listas (`react-window`) en la UI
3. Considerar mover Storage a Cloudflare R2 o S3 si el egress de Supabase es costoso
