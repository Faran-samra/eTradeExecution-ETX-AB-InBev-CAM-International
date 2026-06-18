-- =====================================================================
-- AB InBev Trade Platform · Esquema inicial
-- Ejecutar en Supabase SQL Editor o vía CLI: supabase db push
-- =====================================================================

-- ---------- ENUMS ----------
create type user_role as enum ('admin', 'supervisor', 'gvm');

create type pdv_status as enum ('pending', 'in_progress', 'done');

create type survey_kind as enum (
  'precios', 'inventario', 'neveras', 'gondolas', 'pop', 'competencia'
);

-- ---------- TABLA: countries ----------
create table countries (
  code text primary key,         -- 'VE', 'PA', 'CR', 'GT', 'HN', 'SV'
  name text not null,
  flag text not null,
  currency text not null,
  distributor text,
  created_at timestamptz default now()
);

insert into countries (code, name, flag, currency, distributor) values
  ('VE', 'Venezuela',   '🇻🇪', 'USD', 'Distribuidora AB InBev Caracas'),
  ('PA', 'Panamá',      '🇵🇦', 'USD', 'Distribuidora CAM Panamá'),
  ('CR', 'Costa Rica',  '🇨🇷', 'CRC', 'Distribuidora CAM Costa Rica'),
  ('GT', 'Guatemala',   '🇬🇹', 'GTQ', 'Distribuidora CAM Guatemala'),
  ('HN', 'Honduras',    '🇭🇳', 'HNL', 'Distribuidora CAM Honduras'),
  ('SV', 'El Salvador', '🇸🇻', 'USD', 'Distribuidora CAM El Salvador');

-- ---------- TABLA: profiles (perfil extendido del auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  name text not null,
  role user_role not null,
  country text references countries(code),
  initials text,
  color text,
  visited integer default 0,
  planned integer default 0,
  oos integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Reglas:
  -- 1) admin: country = null obligatoriamente
  -- 2) supervisor, gvm: country no nulo
  constraint role_country_check check (
    (role = 'admin' and country is null) or
    (role in ('supervisor', 'gvm') and country is not null)
  )
);

create index profiles_role_idx on profiles(role);
create index profiles_country_idx on profiles(country);

-- ---------- TABLA: pdvs (puntos de venta) ----------
create table pdvs (
  id text primary key,           -- 'PDV-CCS-001', 'PDV-PA-001', etc.
  name text not null,
  cat text,                      -- categoría: Supermercado, Bodegón, etc.
  channel text default 'Off-trade',
  dist text,                     -- distribuidor
  addr text,
  lat double precision,
  lng double precision,
  status pdv_status default 'pending',
  "order" integer default 0,
  country text not null references countries(code),
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index pdvs_country_idx on pdvs(country);
create index pdvs_assigned_idx on pdvs(assigned_to);
create index pdvs_status_idx on pdvs(status);

-- ---------- TABLA: checkins ----------
create table checkins (
  id uuid primary key default gen_random_uuid(),
  pdv_id text not null references pdvs(id) on delete cascade,
  user_id uuid not null references profiles(id),
  lat double precision,
  lng double precision,
  distance_meters integer,
  photo_url text,
  created_at timestamptz default now()
);

create index checkins_pdv_idx on checkins(pdv_id);
create index checkins_user_idx on checkins(user_id);

-- ---------- TABLA: surveys (levantamientos) ----------
create table surveys (
  id uuid primary key default gen_random_uuid(),
  pdv_id text not null references pdvs(id) on delete cascade,
  kind survey_kind not null,
  created_by uuid not null references profiles(id),
  country text not null references countries(code),
  status text default 'completed',  -- 'draft' | 'completed' | 'synced'
  notes text,
  payload jsonb default '{}'::jsonb,  -- datos específicos del tipo
  created_at timestamptz default now()
);

create index surveys_pdv_idx on surveys(pdv_id);
create index surveys_country_idx on surveys(country);
create index surveys_creator_idx on surveys(created_by);
create index surveys_kind_idx on surveys(kind);

-- ---------- TABLA: survey_photos ----------
create table survey_photos (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  url text not null,
  storage_path text,
  is_live boolean default false,  -- true si fue captura via getUserMedia
  taken_at timestamptz default now()
);

-- ---------- TABLA: survey_items (SKUs detectados/agregados) ----------
create table survey_items (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  brand text,
  pack text,
  price numeric(10,2),
  psv numeric(10,2),
  is_abi boolean default false,
  confidence integer,             -- 0-100, si vino de IA
  detected_by_ai boolean default false,
  created_at timestamptz default now()
);

create index survey_items_survey_idx on survey_items(survey_id);

-- =====================================================================
-- TRIGGERS para updated_at
-- =====================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger pdvs_updated_at before update on pdvs
  for each row execute function update_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table profiles    enable row level security;
alter table pdvs        enable row level security;
alter table checkins    enable row level security;
alter table surveys     enable row level security;
alter table survey_photos enable row level security;
alter table survey_items enable row level security;
alter table countries   enable row level security;

-- Helper: rol del usuario actual
create or replace function current_user_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: país del usuario actual
create or replace function current_user_country() returns text as $$
  select country from profiles where id = auth.uid();
$$ language sql security definer stable;

-- ---------- POLÍTICAS: countries (lectura libre para autenticados) ----------
create policy "countries_read_all" on countries
  for select using (auth.role() = 'authenticated');

-- ---------- POLÍTICAS: profiles ----------
-- Cada usuario ve su propio perfil
create policy "profiles_self_select" on profiles
  for select using (id = auth.uid());

-- Admin ve todos los perfiles
create policy "profiles_admin_select" on profiles
  for select using (current_user_role() = 'admin');

-- Supervisor ve perfiles de su país (incluido el suyo)
create policy "profiles_supervisor_select" on profiles
  for select using (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

-- GVM ve solo su propio perfil (cubierto por self_select)

-- Inserción y eliminación: solo via Edge Function con service_role (no via cliente directamente)
-- Actualización: usuario puede actualizar su propio perfil (campos limitados via Edge Function)
create policy "profiles_self_update" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- ---------- POLÍTICAS: pdvs ----------
-- Admin ve todos los PDVs
create policy "pdvs_admin_all" on pdvs
  for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- Supervisor: ve y modifica solo los PDVs de su país
create policy "pdvs_supervisor_select" on pdvs
  for select using (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

create policy "pdvs_supervisor_modify" on pdvs
  for update using (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  ) with check (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

create policy "pdvs_supervisor_insert" on pdvs
  for insert with check (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

create policy "pdvs_supervisor_delete" on pdvs
  for delete using (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

-- GVM: ve PDVs de su país que estén asignados a él O en el pool
create policy "pdvs_gvm_select" on pdvs
  for select using (
    current_user_role() = 'gvm' and
    country = current_user_country() and
    (assigned_to = auth.uid() or assigned_to is null)
  );

-- GVM puede auto-asignarse PDVs del pool (de su país)
create policy "pdvs_gvm_self_assign" on pdvs
  for update using (
    current_user_role() = 'gvm' and
    country = current_user_country() and
    assigned_to is null
  ) with check (
    current_user_role() = 'gvm' and
    assigned_to = auth.uid()
  );

-- ---------- POLÍTICAS: checkins ----------
create policy "checkins_creator_all" on checkins
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "checkins_admin_select" on checkins
  for select using (current_user_role() = 'admin');

create policy "checkins_supervisor_select" on checkins
  for select using (
    current_user_role() = 'supervisor' and
    exists(select 1 from pdvs p where p.id = checkins.pdv_id and p.country = current_user_country())
  );

-- ---------- POLÍTICAS: surveys ----------
create policy "surveys_creator_all" on surveys
  for all using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "surveys_admin_select" on surveys
  for select using (current_user_role() = 'admin');

create policy "surveys_supervisor_select" on surveys
  for select using (
    current_user_role() = 'supervisor' and
    country = current_user_country()
  );

-- ---------- POLÍTICAS: survey_photos y survey_items ----------
create policy "survey_photos_via_survey" on survey_photos
  for all using (
    exists(select 1 from surveys s where s.id = survey_photos.survey_id and (
      s.created_by = auth.uid() or
      current_user_role() = 'admin' or
      (current_user_role() = 'supervisor' and s.country = current_user_country())
    ))
  );

create policy "survey_items_via_survey" on survey_items
  for all using (
    exists(select 1 from surveys s where s.id = survey_items.survey_id and (
      s.created_by = auth.uid() or
      current_user_role() = 'admin' or
      (current_user_role() = 'supervisor' and s.country = current_user_country())
    ))
  );

-- =====================================================================
-- STORAGE BUCKET para fotos
-- =====================================================================
-- Ejecutar en SQL Editor o crear desde la UI:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('survey-photos', 'survey-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Política: usuarios autenticados pueden subir (la ruta debe empezar con surveys/)
create policy "photos_upload_auth"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'survey-photos' and (storage.foldername(name))[1] = 'surveys');

create policy "photos_read_public"
  on storage.objects for select
  using (bucket_id = 'survey-photos');
