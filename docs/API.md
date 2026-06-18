# API Reference

Toda la API se expone a través de **Supabase**: REST autogenerado para las tablas + Edge Functions para lógica privilegiada.

Base URL: `https://TU-PROYECTO.supabase.co`

---

## Autenticación

Toda llamada (excepto `bootstrap-seed`) requiere un **JWT de sesión** en el header `Authorization: Bearer <token>`. El cliente JS de Supabase lo agrega automáticamente.

### POST /auth/v1/token?grant_type=password

```bash
curl -X POST 'https://TU-PROYECTO.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abinbev.local","password":"admin"}'
```

Respuesta: `{ access_token, refresh_token, user: {...} }`

### POST /auth/v1/logout
Invalida la sesión actual.

---

## Tablas REST (PostgREST)

Toda tabla con RLS habilitada se expone en `/rest/v1/<tabla>`. Las queries usan operadores estilo PostgREST: `eq`, `neq`, `gt`, `lt`, `like`, `in`, `is`, `order`, `limit`.

### GET /rest/v1/profiles
Lista perfiles visibles según RLS del caller.

```bash
curl 'https://TU-PROYECTO.supabase.co/rest/v1/profiles?select=*&order=name' \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer JWT"
```

| Quien consulta | Qué ve |
|---|---|
| Admin | Todos los perfiles |
| Supervisor | Su perfil + perfiles de su país |
| GVM | Solo su propio perfil |

### GET /rest/v1/pdvs

```bash
# Todos los PDVs (admin), solo los de mi país (supervisor),
# o solo asignados-a-mi + pool-de-mi-país (gvm)
curl 'https://TU-PROYECTO.supabase.co/rest/v1/pdvs?select=*&order=order'

# Filtrar por país
curl '...rest/v1/pdvs?country=eq.VE'

# Solo los del pool de mi país
curl '...rest/v1/pdvs?assigned_to=is.null&country=eq.PA'
```

### PATCH /rest/v1/pdvs
Asignar un PDV a un GVM (admin o supervisor del país).

```bash
curl -X PATCH 'https://TU-PROYECTO.supabase.co/rest/v1/pdvs?id=eq.PDV-CCS-001' \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer JWT" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to":"uuid-del-gvm","order":3}'
```

Auto-asignación por un GVM (RLS valida que sea de su país y esté en el pool):

```bash
curl -X PATCH '...?id=eq.PDV-CCS-001' -d '{"assigned_to":"<mi-uuid>"}'
```

### POST /rest/v1/pdvs
Insertar un PDV (admin global; supervisor solo en su país).

```bash
curl -X POST '...rest/v1/pdvs' -H "Prefer: return=representation" \
  -d '{"id":"PDV-PA-100","name":"Nuevo PDV","country":"PA","cat":"Bodegón"}'
```

### POST /rest/v1/checkins
Registrar un check-in (cualquier GVM autenticado, pero el `user_id` debe ser el suyo por RLS).

```bash
curl -X POST '...rest/v1/checkins' \
  -d '{"pdv_id":"PDV-CCS-001","lat":10.4737,"lng":-66.8623,"distance_meters":12,"photo_url":"https://..."}'
```

### POST /rest/v1/surveys
Crear un levantamiento.

```bash
curl -X POST '...rest/v1/surveys' \
  -d '{
    "pdv_id":"PDV-CCS-001",
    "kind":"precios",
    "country":"VE",
    "payload":{"facings_abi":12,"facings_total":28}
  }'
```

### GET /rest/v1/surveys (con joins)

```bash
# Surveys con sus fotos y items
curl '...rest/v1/surveys?select=*,photos:survey_photos(*),items:survey_items(*)&pdv_id=eq.PDV-CCS-001'
```

---

## Storage

Bucket: **`survey-photos`** (público para lectura, autenticado para escritura).

### Subir foto

```js
const { data, error } = await supabase.storage
  .from('survey-photos')
  .upload(`surveys/${surveyId}/precios-${Date.now()}.jpg`, file, {
    cacheControl: '3600',
    upsert: false
  });
```

URL pública: `https://TU-PROYECTO.supabase.co/storage/v1/object/public/survey-photos/<path>`

Restricciones:
- MIME types permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo por archivo: 5 MB
- La ruta debe empezar con `surveys/` (forzado por política RLS)

---

## Edge Functions

URL base: `https://TU-PROYECTO.supabase.co/functions/v1/<nombre>`

Headers requeridos:
```
apikey: <ANON_KEY>
Authorization: Bearer <JWT>   ← excepto en bootstrap-seed
Content-Type: application/json
```

### POST /functions/v1/analyze-shelf

Recibe una imagen en base64 y la envía a Claude para análisis de góndola.

**Body**:
```json
{
  "image": "<base64-sin-prefijo-data:>",
  "mimeType": "image/jpeg"
}
```

**Respuesta exitosa** (200):
```json
{
  "items": [
    { "brand": "Corona Extra 355ml", "pack": "Botella", "price": 2.10, "confidence": 91 },
    { "brand": "Stella Artois Lata", "pack": "Lata", "price": 1.95, "confidence": 85 }
  ],
  "facings_abi": 12,
  "facings_total": 28
}
```

**Errores**:
- `400` — falta el campo `image`
- `401` — JWT inválido
- `500` — `ANTHROPIC_API_KEY` no configurada
- `502` — Claude API devolvió error o JSON no parseable

### POST /functions/v1/create-user

Crea un nuevo usuario validando permisos del caller.

**Body**:
```json
{
  "email": "ana.lopez@abinbev.com",
  "password": "secreto1234",
  "profile": {
    "username": "ana",
    "name": "Ana López",
    "role": "gvm",
    "country": "PA",
    "initials": "AL",
    "color": "#C68A12"
  }
}
```

**Validación de permisos**:
- Admin: puede crear admin / supervisor / gvm de cualquier país
- Supervisor: solo puede crear `role=gvm` con `country` igual al suyo
- GVM: 403

**Respuesta exitosa** (201):
```json
{ "user": { "id": "uuid", "username": "ana", ... } }
```

### POST /functions/v1/delete-user

```json
{ "userId": "uuid-del-usuario" }
```

Mismas reglas de permisos que `create-user`. No se puede eliminar la propia cuenta. Cascada elimina el profile (por la FK con `ON DELETE CASCADE`).

### POST /functions/v1/bootstrap-seed

⚠️ **Solo ejecutable una vez**, cuando la tabla `profiles` está vacía. Crea las 13 cuentas demo.

```bash
curl -X POST 'https://TU-PROYECTO.supabase.co/functions/v1/bootstrap-seed' \
  -H "apikey: ANON_KEY"
```

Respuesta:
```json
{
  "created": [
    { "username": "admin", "ok": true, "id": "uuid" },
    { "username": "sup.ve", "ok": true, "id": "uuid" },
    ...
  ]
}
```

Si la tabla ya tiene usuarios devuelve `403` con error explicativo.

---

## Row Level Security (resumen)

Las políticas RLS están en la migración `20260610000000_init.sql`. Resumen de las reglas críticas:

### `profiles`
- Self: cada usuario ve su propio perfil
- Admin: ve todos
- Supervisor: ve perfiles de su país
- INSERT/DELETE: solo via Edge Function (service_role)

### `pdvs`
- Admin: ALL (sin restricción)
- Supervisor: SELECT/INSERT/UPDATE/DELETE limitado a `country = current_user_country()`
- GVM: SELECT limitado a (su país AND (asignados a él OR en pool))
- GVM auto-asignación: UPDATE limitado a (su país AND pool) con `assigned_to = auth.uid()`

### `checkins`, `surveys`
- Creator: ALL (own rows)
- Admin: SELECT all
- Supervisor: SELECT donde el PDV/survey es de su país

### `survey_photos`, `survey_items`
- Se hereda del survey padre (políticas via subquery)

### Helper functions
```sql
current_user_role() returns user_role
current_user_country() returns text
```

Ambas marcadas `SECURITY DEFINER STABLE` para que las políticas no entren en recursión infinita.

---

## Códigos de error comunes

| Código | Significado |
|---|---|
| `PGRST116` | No se encontró el recurso (single() con 0 filas) |
| `42501` | Permiso denegado por RLS |
| `23505` | Violación de constraint UNIQUE (username/email duplicado) |
| `23503` | Violación de FK (referencia inválida) |
| `23514` | Violación de CHECK constraint (ej. `role_country_check`) |

---

## Realtime (opcional, no en MVP)

Supabase soporta suscripciones en tiempo real. Para implementarlo:

```js
const channel = supabase
  .channel('pdvs-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'pdvs' },
    payload => console.log('Cambio:', payload)
  )
  .subscribe();
```

Útil para que el dashboard del supervisor vea check-ins de los GVMs en vivo. Requiere habilitar Realtime en cada tabla desde el dashboard (`Database → Replication`).
