# Modelo de datos

## Diagrama de entidades

```
┌─────────────────┐         ┌─────────────────┐
│    countries    │         │    profiles     │
│─────────────────│         │─────────────────│
│ code (PK)       │◄────────┤ country (FK)    │
│ name            │         │ id (PK = auth)  │
│ flag            │         │ username (uniq) │
│ currency        │         │ email (uniq)    │
│ distributor     │         │ name            │
└─────────────────┘         │ role (enum)     │
                            │ initials        │
                            │ color           │
                            │ visited/planned │
                            └────────┬────────┘
                                     │
                ┌────────────────────┼─────────────────────┐
                │                    │                     │
                ▼                    ▼                     ▼
       ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
       │      pdvs       │  │    checkins     │  │     surveys     │
       │─────────────────│  │─────────────────│  │─────────────────│
       │ id (PK = text)  │  │ id (PK = uuid)  │  │ id (PK = uuid)  │
       │ name            │  │ pdv_id (FK)     │  │ pdv_id (FK)     │
       │ cat             │  │ user_id (FK)    │  │ kind (enum)     │
       │ channel         │  │ lat / lng       │  │ created_by (FK) │
       │ addr            │  │ distance_meters │  │ country (FK)    │
       │ lat / lng       │  │ photo_url       │  │ status          │
       │ status (enum)   │  └─────────────────┘  │ notes           │
       │ order           │                       │ payload (jsonb) │
       │ country (FK)    │                       └────────┬────────┘
       │ assigned_to (FK)│                                │
       └─────────────────┘                       ┌────────┴────────┐
                                                 ▼                 ▼
                                       ┌─────────────────┐ ┌────────────────┐
                                       │  survey_photos  │ │  survey_items  │
                                       │─────────────────│ │────────────────│
                                       │ id (uuid)       │ │ id (uuid)      │
                                       │ survey_id (FK)  │ │ survey_id (FK) │
                                       │ url             │ │ brand          │
                                       │ storage_path    │ │ pack           │
                                       │ is_live (bool)  │ │ price          │
                                       │ taken_at        │ │ psv            │
                                       └─────────────────┘ │ is_abi         │
                                                           │ confidence     │
                                                           │ detected_by_ai │
                                                           └────────────────┘
```

## Detalle por tabla

### `countries`
Catálogo de países donde opera la plataforma. Es estático en MVP pero modelable.

| Columna | Tipo | Comentario |
|---|---|---|
| `code` | `text` PK | Código ISO 3166-1 alpha-2: VE, PA, CR, GT, HN, SV |
| `name` | `text` | Nombre legible |
| `flag` | `text` | Emoji de bandera |
| `currency` | `text` | USD, CRC, GTQ, HNL |
| `distributor` | `text` | Nombre del distribuidor local |

### `profiles`
Perfil extendido del usuario, ligado 1:1 con `auth.users` de Supabase.

| Columna | Tipo | Constraint | Comentario |
|---|---|---|---|
| `id` | `uuid` PK | FK `auth.users.id` ON DELETE CASCADE | Mismo UUID que Auth |
| `username` | `text` UNIQUE NOT NULL | | Usado para login alternativo (sin @) |
| `email` | `text` UNIQUE NOT NULL | | Email para login |
| `name` | `text` NOT NULL | | Nombre completo |
| `role` | `user_role` NOT NULL | enum: admin/supervisor/gvm | |
| `country` | `text` FK countries | NULL si role=admin | Verificado por constraint |
| `initials` | `text` | | Para avatar |
| `color` | `text` | | Color hex del avatar |
| `visited` | `int` default 0 | | Métricas de operación (denormalizadas) |
| `planned` | `int` default 0 | | |
| `oos` | `int` default 0 | | |
| `created_at` | `timestamptz` | | |
| `updated_at` | `timestamptz` | trigger | |

**Constraint clave:** `role_country_check` — admin requiere country NULL; supervisor/gvm requieren country no nulo.

### `pdvs`
Catálogo de puntos de venta.

| Columna | Tipo | Comentario |
|---|---|---|
| `id` | `text` PK | Formato libre: `PDV-CCS-001`, `PDV-PA-001`, etc. |
| `name` | `text` NOT NULL | Nombre comercial |
| `cat` | `text` | Categoría (Supermercado, Bodegón, Licorería, etc.) |
| `channel` | `text` default 'Off-trade' | Off-trade / On-trade |
| `dist` | `text` | Distribuidor que atiende este PDV |
| `addr` | `text` | Dirección física |
| `lat` / `lng` | `double precision` | Coordenadas GPS |
| `status` | `pdv_status` | pending/in_progress/done |
| `order` | `int` | Orden en la ruta del GVM |
| `country` | `text` FK countries NOT NULL | País del PDV |
| `assigned_to` | `uuid` FK profiles | NULL = en el pool del país |
| `created_at` / `updated_at` | `timestamptz` | |

**Índices**: `country`, `assigned_to`, `status`.

### `checkins`
Registro histórico de check-ins de los GVMs.

| Columna | Tipo | Comentario |
|---|---|---|
| `id` | `uuid` PK | |
| `pdv_id` | `text` FK pdvs ON DELETE CASCADE | |
| `user_id` | `uuid` FK profiles NOT NULL | Quien hizo el check-in |
| `lat` / `lng` | `double precision` | Ubicación real del GVM |
| `distance_meters` | `int` | Distancia al PDV registrado |
| `photo_url` | `text` | URL en Supabase Storage |
| `created_at` | `timestamptz` | |

### `surveys`
Levantamientos realizados en cada PDV.

| Columna | Tipo | Comentario |
|---|---|---|
| `id` | `uuid` PK | |
| `pdv_id` | `text` FK pdvs ON DELETE CASCADE | |
| `kind` | `survey_kind` NOT NULL | enum: precios, inventario, neveras, gondolas, pop, competencia |
| `created_by` | `uuid` FK profiles NOT NULL | GVM que lo hizo |
| `country` | `text` FK countries NOT NULL | Denormalizado para queries del supervisor |
| `status` | `text` default 'completed' | draft/completed/synced |
| `notes` | `text` | |
| `payload` | `jsonb` default '{}' | Datos específicos del tipo (ver abajo) |
| `created_at` | `timestamptz` | |

#### Esquema de `payload` por tipo

**`precios` / `competencia`**:
```json
{
  "facings_abi": 12,
  "facings_total": 28,
  "share_of_shelf_pct": 43,
  "ai_processed": true
}
```

**`inventario`**:
```json
{
  "skus": [
    { "brand": "Corona Extra 355ml", "units": 24 },
    { "brand": "Budweiser Lata", "units": 0, "oos": true }
  ]
}
```

**`neveras`**:
```json
{
  "equipment_id": "NEV-CCS-00471",
  "estado": "Bueno",
  "share_of_cooler": 60,
  "planograma_ok": true,
  "branding_visible": true
}
```

**`pop`**: `{ "items": ["banner_entrada", "habladores"], "compliance": 80 }`

**`gondolas`**: `{ "share_of_shelf": 55, "facings_abi": 18 }`

### `survey_photos`
Fotos asociadas a cada levantamiento.

| Columna | Tipo | Comentario |
|---|---|---|
| `id` | `uuid` PK | |
| `survey_id` | `uuid` FK surveys ON DELETE CASCADE | |
| `url` | `text` NOT NULL | URL pública de Supabase Storage |
| `storage_path` | `text` | Ruta interna para eliminar |
| `is_live` | `bool` default false | true si vino de getUserMedia (con marca de agua) |
| `taken_at` | `timestamptz` | |

### `survey_items`
Items detectados/agregados en un levantamiento de precios o competencia.

| Columna | Tipo | Comentario |
|---|---|---|
| `id` | `uuid` PK | |
| `survey_id` | `uuid` FK | |
| `brand` | `text` | Marca del producto |
| `pack` | `text` | Empaque (Lata/Botella) |
| `price` | `numeric(10,2)` | Precio observado |
| `psv` | `numeric(10,2)` | Precio sugerido al vendedor |
| `is_abi` | `bool` default false | true si es marca AB InBev |
| `confidence` | `int` | 0-100 si vino de IA |
| `detected_by_ai` | `bool` default false | |
| `created_at` | `timestamptz` | |

---

## Tipos enumerados

```sql
create type user_role as enum ('admin', 'supervisor', 'gvm');
create type pdv_status as enum ('pending', 'in_progress', 'done');
create type survey_kind as enum (
  'precios', 'inventario', 'neveras', 'gondolas', 'pop', 'competencia'
);
```

## Reglas de negocio importantes

1. **El email/username del Auth user debe coincidir con el del profile**. La Edge Function `create-user` se asegura de esto.
2. **`profiles.id` siempre es el mismo UUID que `auth.users.id`**. ON DELETE CASCADE para mantener integridad.
3. **Admin nunca tiene country**. Supervisores y GVMs siempre tienen country.
4. **Un PDV solo puede pertenecer a un país** (`pdvs.country` NOT NULL).
5. **Un PDV solo puede estar asignado a un GVM** (`assigned_to` es FK simple, no array).
6. **Los GVMs solo se asignan a PDVs de su propio país** (validado por RLS).
7. **Los surveys siempre llevan el country denormalizado** del PDV para facilitar queries del supervisor.

## Índices recomendados (ya creados en la migración)

- `profiles(role)`, `profiles(country)`
- `pdvs(country)`, `pdvs(assigned_to)`, `pdvs(status)`
- `checkins(pdv_id)`, `checkins(user_id)`
- `surveys(pdv_id)`, `surveys(country)`, `surveys(created_by)`, `surveys(kind)`
- `survey_items(survey_id)`
