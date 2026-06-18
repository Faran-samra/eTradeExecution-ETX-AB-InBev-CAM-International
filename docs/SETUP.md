# Guía de instalación y deploy

Esta guía lleva al equipo backend desde cero hasta tener la plataforma corriendo en producción. Tiempo estimado: **45-90 minutos**.

---

## Pre-requisitos

- Node.js 20+ y npm
- Cuenta en [Supabase](https://supabase.com/dashboard) (plan Free funciona para piloto)
- Cuenta en [Netlify](https://app.netlify.com/) (plan Free funciona)
- API key de [Anthropic](https://console.anthropic.com/) para Claude
- Git instalado
- (Opcional pero recomendado) [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## Paso 1 · Preparar el repositorio

```bash
# Descomprimir el ZIP entregado
unzip abinbev-trade-platform.zip
cd abinbev-trade-platform

# Inicializar Git (si no viene ya inicializado)
git init
git add .
git commit -m "Initial commit"

# Push a un repo nuevo en GitHub/GitLab/Bitbucket
git remote add origin https://github.com/TU_ORG/abinbev-trade-platform.git
git push -u origin main
```

---

## Paso 2 · Crear el proyecto Supabase

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project** → llenar:
   - Name: `abinbev-trade-platform`
   - Database password: (guardar en gestor de contraseñas, es necesaria para CLI)
   - Region: la más cercana a Centroamérica (ej. `us-east-1` o `sa-east-1`)
3. Esperar ~2 min a que se aprovisione
4. Anotar de **Settings → API**:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key (la usaremos en el frontend)
   - `service_role` `secret` key (NUNCA exponer al frontend, solo Edge Functions)

---

## Paso 3 · Aplicar el esquema de base de datos

### Opción A: SQL Editor del dashboard (más rápido)

1. Abrir **SQL Editor** en el dashboard de Supabase
2. Click **+ New query**
3. Copiar y pegar el contenido completo de `supabase/migrations/20260610000000_init.sql`
4. Click **Run** (Ctrl+Enter)
5. Verificar que dice "Success. No rows returned"
6. Repetir con `supabase/migrations/20260610000100_seed.sql` para cargar los PDVs demo

### Opción B: Supabase CLI (recomendado para CI/CD)

```bash
# Instalar la CLI
npm install -g supabase

# Login
supabase login

# Vincular al proyecto
supabase link --project-ref TU_PROJECT_REF
# (PROJECT_REF es la parte de la URL: https://<ref>.supabase.co)

# Aplicar migraciones
supabase db push
```

### Verificar

En el dashboard ir a **Table Editor**. Deben existir las tablas:
`countries`, `profiles`, `pdvs`, `checkins`, `surveys`, `survey_photos`, `survey_items`.

La tabla `countries` debe tener 6 filas.

---

## Paso 4 · Configurar Storage

El bucket `survey-photos` se crea automáticamente con la migración, pero verifica:

1. Ir a **Storage** en el dashboard
2. Debe aparecer el bucket `survey-photos` marcado como público
3. Si no aparece, créalo manualmente:
   - Click **New bucket**
   - Name: `survey-photos`
   - Public bucket: ✅ ON
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

---

## Paso 5 · Desplegar las Edge Functions

### Configurar secretos primero

En el dashboard: **Project Settings → Edge Functions → Secrets**

Agregar:
- `ANTHROPIC_API_KEY` = tu clave de Anthropic (empieza con `sk-ant-`)

(Las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` se inyectan automáticamente por Supabase, no hace falta agregarlas.)

### Desplegar

```bash
supabase functions deploy analyze-shelf
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy bootstrap-seed
```

### Verificar

```bash
curl https://TU-PROYECTO.supabase.co/functions/v1/analyze-shelf \
  -H "apikey: TU_ANON_KEY" \
  -X OPTIONS
# Debe devolver 200 con headers CORS
```

---

## Paso 6 · Crear las cuentas demo iniciales

Ejecutar una sola vez (después solo da 403):

```bash
curl -X POST https://TU-PROYECTO.supabase.co/functions/v1/bootstrap-seed \
  -H "apikey: TU_ANON_KEY"
```

Respuesta esperada:
```json
{
  "created": [
    { "username": "admin", "ok": true, "id": "..." },
    { "username": "sup.ve", "ok": true, "id": "..." },
    ... 13 usuarios en total
  ]
}
```

Verificar en **Authentication → Users** del dashboard: deben aparecer 13 usuarios.

---

## Paso 7 · Configurar el frontend localmente

```bash
cd abinbev-trade-platform
npm install

# Crear .env.local
cp .env.example .env.local
```

Editar `.env.local`:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica
VITE_AI_PROXY_URL=https://TU-PROYECTO.supabase.co/functions/v1/analyze-shelf
```

Levantar dev:
```bash
npm run dev
# → http://localhost:5173
```

Probar login con `admin/admin`.

---

## Paso 8 · Build local de prueba

```bash
npm run build
npm run preview
# → http://localhost:4173
```

Si todo funciona, ya está listo para deploy.

---

## Paso 9 · Deploy a Netlify

### Opción A: vía Netlify CLI

```bash
npm install -g netlify-cli
netlify login

cd abinbev-trade-platform
netlify init
# - Create & configure a new site
# - Team: tu organización
# - Site name: abinbev-trade-cam (o el que prefieras)
# - Build command: npm run build
# - Directory to deploy: dist

# Configurar variables de entorno
netlify env:set VITE_SUPABASE_URL "https://TU-PROYECTO.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "tu_anon_key"
netlify env:set VITE_AI_PROXY_URL "https://TU-PROYECTO.supabase.co/functions/v1/analyze-shelf"

# Deploy a producción
netlify deploy --prod
```

### Opción B: vía dashboard de Netlify (recomendado para auto-deploy)

1. Ir a [app.netlify.com](https://app.netlify.com/) → **Add new site** → **Import an existing project**
2. Conectar con GitHub/GitLab/Bitbucket → seleccionar tu repo
3. Configuración del build:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Site settings → Environment variables** → Agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_PROXY_URL`
5. Click **Deploy site**
6. Esperar ~2 min al primer build
7. Sitio disponible en `https://xxxxx.netlify.app`

A partir de ahora, cada `git push` a `main` despliega automáticamente.

---

## Paso 10 · Custom domain (opcional)

1. Netlify → **Domain management** → **Add a domain**
2. Configurar DNS según las instrucciones (CNAME o A record)
3. Esperar propagación (~15 min)
4. HTTPS se aprovisiona automáticamente (Let's Encrypt)

---

## Paso 11 · Probar end-to-end

1. Abrir el sitio público
2. Login con `admin/admin`
3. Verificar que aparece el dashboard del administrador
4. Logout → entrar con `eduardo/1234`
5. Debe aparecer la app del GVM con los PDVs de Venezuela
6. Probar check-in (en móvil real para usar GPS y cámara)

---

## Mantenimiento

### Backups de la BD
Supabase hace backups diarios automáticos (Free: 7 días; Pro: 14 días).
Para backup manual: **Database → Backups** o `pg_dump` vía CLI.

### Monitoreo
- **Logs de Edge Functions**: dashboard → **Edge Functions → Logs**
- **Logs de la BD**: dashboard → **Logs → Postgres Logs**
- **Métricas de uso**: dashboard → **Reports**

### Actualizaciones
1. Hacer cambios en código local
2. `git push` → Netlify rebuilea automáticamente
3. Si hay cambios de schema: crear nueva migración `supabase/migrations/YYYYMMDD_descripcion.sql` y aplicar con `supabase db push`

---

## Troubleshooting

| Problema | Diagnóstico | Solución |
|---|---|---|
| Login devuelve "Invalid credentials" | Usuario no existe o contraseña mal | Verificar en Auth → Users; correr bootstrap-seed |
| El frontend dice "Faltan variables de entorno" | `.env.local` mal configurado | Verificar VITE_* en local; en Netlify revisar Environment variables |
| Analyze-shelf devuelve 500 | `ANTHROPIC_API_KEY` no configurada | Agregar en Project Settings → Edge Functions → Secrets |
| Las fotos no suben | Bucket inexistente o RLS mal | Verificar bucket `survey-photos` público; revisar política RLS |
| El dashboard del supervisor está vacío | RLS bloqueando consultas | Verificar que el supervisor tenga `country` no nulo; revisar helper `current_user_country()` |
| Build falla en Netlify | Versión de Node | Forzar Node 20 en `netlify.toml` (ya viene configurado) |
| CORS errors al llamar Edge Function | Falta header `apikey` | Agregar `apikey: ANON_KEY` además del Bearer |

---

## Costos estimados

| Servicio | Plan inicial | Cuándo escalar |
|---|---|---|
| **Supabase** Free | 500 MB BD, 1 GB Storage, 2 GB egress/mes, 500k Edge Function calls/mes | Cuando se supere alguno → Pro ($25/mes) |
| **Netlify** Free | 100 GB bandwidth/mes, 300 build minutes/mes | Cuando se supere → Pro ($19/mes) |
| **Anthropic Claude** | Pay-per-use | ~$3 USD por 1M tokens input + $15 por 1M output. Una foto consume ~1500 tokens output. Estimado piloto: **$50-150/mes** |

Total piloto: **$0-50/mes** (mientras quepa en free tiers de Supabase y Netlify).
Total producción ~ **$50-200/mes** dependiendo de volumen de uso y fotos analizadas por IA.
