# AB InBev Trade Platform — CAM International

## Master Technical Document for the Backend Team
**Point-of-Sale Information Collection Platform**
Stack: React · Vite · Supabase · Claude API · Netlify
Version 1.0 — June 2026

---

## Table of Contents
1. Executive Vision
2. Technology Stack
3. System Architecture
4. Roles and Permissions Matrix
5. Data Model
6. Product Features
7. API and Endpoints
8. Repository Structure
9. Setup and Deployment (Step by Step)
10. Prototype-to-Production Migration
11. Security and Privacy
12. Operating Costs
13. Roadmap and Effort Estimation
14. Annexes

---

## 1. Executive Vision

### 1.1 What is the project?
A responsive web platform (mobile + desktop) that digitalizes point-of-sale (POS) information collection for AB InBev in Central America. It replaces the current manual Excel + WhatsApp process used by Sales and Marketing Managers (GVMs).

### 1.2 Who is it for?

| Audience | Role | What They Do |
|---|---|---|
| GVMs | Sales and Marketing Managers | Visit POS locations physically and collect data (prices, inventory, coolers, etc.) |
| Supervisors | One per country | Monitor their GVMs, assign POS locations, manage users in their country |
| Administrators | Global (corporate) | Consolidated CAM view, global management, configuration |

### 1.3 Markets

| Country | Code | Local Distributor |
|---|---|---|
| Venezuela | VE | Distribuidora AB InBev Caracas |
| Panama | PA | Distribuidora CAM Panamá |
| Costa Rica | CR | Distribuidora CAM Costa Rica |
| Guatemala | GT | Distribuidora CAM Guatemala |
| Honduras | HN | Distribuidora CAM Honduras |
| El Salvador | SV | Distribuidora CAM El Salvador |

### 1.4 Pilot Plan
- 50 real POS locations in Caracas already loaded (Las Mercedes, Los Palos Grandes, La Castellana, El Hatillo, etc.)
- 1 active GVM during the pilot (Eduardo Méndez)
- Expected duration: 4–6 weeks
- Success metric: ≥85% weekly coverage of assigned POS locations
- Post-pilot expansion: the other 5 countries progressively, reaching ~30 GVMs and ~1,500 POS across CAM

### 1.5 Key Differentiators
1. **Native multi-country:** each GVM only sees POS in their country; each supervisor only manages their country; admin sees everything
2. **AI shelf analysis:** shelf photo → Claude automatically detects brands, prices, and share of shelf
3. **Live photo capture:** getUserMedia with "LIVE + timestamp" watermark to prevent fraud (pre-taken photos)
4. **Geofenced check-in:** GPS validated against POS coordinates (50m tolerance), with supervisor alert if exceeded
5. **POS pool:** unassigned POS available for GVMs to self-assign from their country's pool

---

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast SPA, HMR, optimized build |
| UI | Lucide React + inline styles | No heavy CSS framework |
| Database | Supabase (PostgreSQL 15) | Native RLS by country, scalable |
| Authentication | Supabase Auth | Email/password with JWT |
| Storage | Supabase Storage | Public bucket with CDN |
| Compute | Supabase Edge Functions (Deno) | Secure AI proxy, validations |
| AI Vision | Claude Sonnet 4 (Anthropic) | Best model for visual tasks |
| Hosting | Netlify | Continuous deploy, HTTPS, CDN |
| Spreadsheets | SheetJS (xlsx) | CSV/Excel import |

### 2.1 Why Supabase?
- **Real Postgres:** native SQL queries, not limited NoSQL
- **DB-level RLS:** country-based security is enforced at the database engine, not in application code
- **Open-source:** if migrating to self-hosted (AWS / GCP), the code is identical
- **Generous free tier:** 500 MB DB + 1 GB storage + 500k Edge calls/month
- **Edge Functions in Deno:** native TypeScript, deploy in a single command

---

## 3. System Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  NETLIFY (CDN)                          │
│         React SPA static (HTML+JS+CSS)                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
│  ┌────────┐  ┌──────────┐  ┌────────────────────────┐  │
│  │  Auth  │  │ Postgres │  │ Storage (survey-photos)│  │
│  │  JWT   │  │  + RLS   │  │       Public CDN       │  │
│  └────────┘  └──────────┘  └────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐    │
│  │     Edge Functions (Deno runtime)              │    │
│  │  • analyze-shelf  • create-user                │    │
│  │  • delete-user    • bootstrap-seed             │    │
│  └────────────────┬───────────────────────────────┘    │
└───────────────────┼─────────────────────────────────────┘
                    │ HTTPS (Edge only)
                    ▼
            ┌───────────────────┐
            │  Anthropic Claude │
            │   Sonnet 4 API    │
            └───────────────────┘
```

### 3.2 Authentication Flow
1. User POSTs `/auth/v1/token` with email/username + password
2. Supabase Auth validates and issues JWT (1 hour) + refresh token (7 days)
3. Frontend stores tokens in localStorage via `@supabase/supabase-js`
4. Frontend queries profiles and receives role + country
5. Renders UI based on role (GVM / Supervisor / Admin)
6. Automatic token refresh every hour

### 3.3 Check-in with Photo Flow
1. GVM taps "Perform Check-in" on the POS
2. Frontend requests `navigator.geolocation` and calculates distance using Haversine
3. If distance > 50m, a visible alert is sent to the supervisor (but allows continuation)
4. Opens camera with getUserMedia
5. Captures frame → canvas → draws "LIVE + timestamp" watermark
6. JPEG (quality 0.88) uploaded to Supabase Storage
7. Frontend performs INSERT into checkins with lat/lng/distance/photo_url
8. UI unlocks the 6 survey types for that POS

### 3.4 AI Analysis Flow
1. GVM takes a live shelf photo
2. Frontend converts to base64
3. POST to `/functions/v1/analyze-shelf`
4. Edge Function adds ANTHROPIC_API_KEY and forwards to api.anthropic.com
5. Claude responds with JSON: `{ items, facings_abi, facings_total }`
6. Edge Function validates and cleans the JSON
7. Frontend pre-fills the detected SKU table
8. GVM manually corrects prices if needed
9. Confirms → INSERT into surveys, survey_items, survey_photos

---

## 4. Roles and Permissions Matrix

### 4.1 Administrator
- **Scope:** global, no country assigned (country = NULL)
- **How many:** 1–3 people (corporate)
- **Creates:** any admin, supervisor, or GVM in any country
- **Views:** all CAM data
- **Modifies:** any POS, any assignment, any user

### 4.2 Supervisor
- **Scope:** single country (non-null country, fixed)
- **How many:** 1 per country (6 total at full scale)
- **Creates:** only GVMs in their same country
- **Views:** users, POS, surveys, and check-ins in their country
- **Modifies:** POS and assignments in their country; never others

### 4.3 GVM
- **Scope:** single country (non-null country, fixed)
- **How many:** 5–15 per country eventually
- **Creates:** nothing (only their own check-ins and surveys)
- **Views:** POS in their country assigned to them, or in the unassigned pool
- **Modifies:** can self-assign POS from their country's pool

### 4.4 Full Permissions Matrix

| Action | Admin | Supervisor | GVM |
|---|---|---|---|
| View users | All | Their country only | Own only |
| Create admin | Yes | No | No |
| Create supervisor | Yes | No | No |
| Create GVM | Any country | Their country only | No |
| Edit user | Anyone | GVMs in their country only | Own only |
| Delete user | Yes (not own) | GVMs in their country only | No |
| View POS | All | Their country only | Their country only (assigned or pool) |
| Import POS | Any country | Their country only | No |
| Assign POS to GVM | Any GVM | GVMs in their country | Self-assign only |
| Release POS | Yes | Their country only | Own only |
| Delete POS | Yes | Their country only | No |
| Perform check-in | No | No | Yes |
| Surveys | No | No | Yes |
| View surveys | All | Their country only | Own only |
| Coverage dashboard | Global | Their country only | No |

### 4.5 How It Is Enforced
1. Row Level Security in PostgreSQL (primary line of defense)
2. Additional validation in Edge Functions for create-user / delete-user
3. Frontend hides UI based on role (defense in depth)

---

## 5. Data Model

### 5.1 Main Tables

| Table | Purpose |
|---|---|
| countries | Country catalog: VE, PA, CR, GT, HN, SV |
| profiles | Extended user profile (FK to auth.users) |
| pdvs | POS catalog with assignment |
| checkins | Check-in history with GPS + facade photo |
| surveys | Surveys by type (prices, inventory, etc.) |
| survey_photos | Photos associated with each survey |
| survey_items | SKUs detected (by AI) or added manually |

### 5.2 Profiles Detail

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Same UUID as auth.users.id |
| username | text UNIQUE | Alternative login without @ |
| email | text UNIQUE | Email login |
| name | text | Full name |
| role | user_role enum | admin / supervisor / gvm |
| country | text FK countries | NULL if admin, non-null otherwise |
| initials | text | Avatar (2 letters) |
| color | text | Hex color for avatar |
| visited / planned / oos | int | Operational metrics |
| created_at / updated_at | timestamptz | Automatic trigger |

### 5.3 PDVs Detail

| Column | Type | Notes |
|---|---|---|
| id | text PK | PDV-CCS-001, PDV-PA-001 |
| name | text | Commercial name |
| cat | text | Supermarket / Bodegón / Liquor Store |
| channel | text | Off-trade / On-trade |
| dist | text | Serving distributor |
| addr | text | Address |
| lat, lng | double precision | GPS |
| status | pdv_status enum | pending / in_progress / done |
| order | int | Route order |
| country | text FK | POS country |
| assigned_to | uuid FK profiles | NULL = in the pool |

### 5.4 Payload Field Schema (jsonb)
Each survey has a `payload` jsonb field with a specific structure based on type:

**Type: prices / competition**
```json
{
  "facings_abi": 12,
  "facings_total": 28,
  "share_of_shelf_pct": 43,
  "ai_processed": true,
  "items_count": 5
}
```

**Type: inventory**
```json
{
  "skus": [
    { "brand": "Corona Extra 355ml", "units": 24 },
    { "brand": "Budweiser Can", "units": 0, "oos": true }
  ]
}
```

**Type: coolers**
```json
{
  "equipment_id": "NEV-CCS-00471",
  "condition": "Good",
  "share_of_cooler": 60,
  "planogram_ok": true,
  "branding_visible": true,
  "temperature_ok": true
}
```

### 5.5 Row Level Security
All tables have RLS enabled. There are two helper functions:

```sql
CREATE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE FUNCTION current_user_country() RETURNS text AS $$
  SELECT country FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

**Critical policy for POS (example):**
```sql
-- GVM sees only their country: assigned to them or in pool
CREATE POLICY pdvs_gvm_select ON pdvs FOR SELECT
  USING (current_user_role() = 'gvm'
         AND country = current_user_country()
         AND (assigned_to = auth.uid() OR assigned_to IS NULL));

-- GVM can self-assign from the pool (their country)
CREATE POLICY pdvs_gvm_self_assign ON pdvs FOR UPDATE
  USING (current_user_role() = 'gvm'
         AND country = current_user_country()
         AND assigned_to IS NULL)
  WITH CHECK (assigned_to = auth.uid());
```

All ~15 complete policies are in `supabase/migrations/20260610000000_init.sql`.

---

## 6. Product Features

### 6.1 GVM App
Primarily designed for mobile use. Main screens:
- **Login** — username/email + password; supports `eduardo` (internal) or `eduardo.mendez@abinbev.com`
- **Daily Itinerary** — list of assigned POS with progress (X of Y, % coverage)
- **POS Detail** — info + "Perform Check-in" button + 6 survey cards
- **Check-in with Geofencing** — GPS + Haversine; 50m tolerance; mandatory facade photo
- **Price Survey** — photo → AI analysis → pre-filled table → traffic light vs PSV
- **Inventory Survey** — stepper per SKU; automatic OOS if count = 0
- **Cooler Survey** — equipment + condition + share of cooler + planogram + branding
- **Generic Surveys** — Gondolas, POP, Competition
- **Coverage Map** — pins by status
- **Personal KPIs** — GVM performance charts
- **Profile** — personal data + logout

### 6.2 Supervisor/Admin Dashboard
Three tabs:

**"Summary" Tab**
- Consolidated KPIs (filterable by country if admin): coverage, active GVMs, OOS alerts, Price Compliance, Share of Shelf
- Itinerary compliance by GVM (animated bars)
- CAM coverage map with pins by status
- Real-time critical alerts
- Exportable report buttons (PDF/Excel) — to be implemented

**"Catalog" Tab**
- Table with POS visible per permissions
- Search + filters (status, country)
- Import CSV/Excel: mandatory country selection, then upload file
- Row actions: "Assign to..." (dropdown of GVMs in country), "Release," "Delete"

**"Users" Tab**
- Table with users visible per permissions
- Filters: role, country (admin), search
- "Create user": modal with name, username, email, password, role, country
- Edit / Delete per row (with confirmation)
- Cannot delete own account

### 6.3 Detailed AI Pipeline
- **Model:** `claude-sonnet-4-20250514`
- **Recognized brands:** Corona, Budweiser, Stella Artois, Modelo, Atlas, Balboa (AB InBev) + Heineken, Polar, Imperial, Gallo, Salva Vida, Pilsener (regional competition)
- **Approximate cost per analysis:** ~1,500 output tokens + 1,000 input tokens + image ≈ $0.04–0.06 USD

### 6.4 Live Photo Capture
1. First attempt: `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
2. If successful: full-screen modal with preview and circular capture button
3. Captures a video frame on canvas, draws "🔴 LIVE + timestamp" watermark
4. If fails (iframe without permission, no camera): fallback to `<input type="file" capture="environment">`
5. Live photos carry a visible stamp; fallback photos do not — supervisor can distinguish both cases

---

## 7. API and Endpoints

### 7.1 Authentication
```
POST /auth/v1/token?grant_type=password
Headers: apikey: ANON_KEY
Body: {"email":"admin@abinbev.local","password":"admin"}
Response: { access_token, refresh_token, user }
```

### 7.2 REST Tables
All tables are exposed at `/rest/v1/<table>` respecting RLS. Examples:
```bash
# GET POS from Panama pool
curl '.../rest/v1/pdvs?country=eq.PA&assigned_to=is.null'

# PATCH assign POS to GVM
curl -X PATCH '.../rest/v1/pdvs?id=eq.PDV-CCS-001' \
  -d '{"assigned_to":"gvm-uuid","order":3}'

# POST register check-in
curl -X POST '.../rest/v1/checkins' \
  -d '{"pdv_id":"PDV-CCS-001","lat":10.47,"lng":-66.86,
       "distance_meters":12,"photo_url":"https://..."}'
```

### 7.3 Edge Functions

| Function | Purpose |
|---|---|
| POST /functions/v1/analyze-shelf | Secure proxy to Claude for AI shelf analysis |
| POST /functions/v1/create-user | Create user validating caller permissions |
| POST /functions/v1/delete-user | Delete user validating permissions |
| POST /functions/v1/bootstrap-seed | Create 13 demo accounts (only if DB is empty) |

### 7.4 Storage
```javascript
// Upload photo
await supabase.storage
  .from('survey-photos')
  .upload(`surveys/${surveyId}/prices-${Date.now()}.jpg`, file);

// Public URL
const { data: { publicUrl } } = supabase.storage
  .from('survey-photos').getPublicUrl(path);
```

### 7.5 Common Error Codes

| Code | Meaning |
|---|---|
| PGRST116 | Resource not found |
| 42501 | Permission denied by RLS |
| 23505 | UNIQUE violation (duplicate username/email) |
| 23503 | Foreign key violated |
| 23514 | CHECK constraint violated (e.g. role/country) |

---

## 8. Repository Structure

```
abinbev-trade-platform/
├── ABInBev_TradeApp.prototype.jsx   ⭐ Monolithic prototype
├── README.md                         📘 Quick start
├── package.json
├── vite.config.js
├── netlify.toml
├── index.html
├── .env.example
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                       Auth + role-based routing
│   ├── components/
│   │   ├── LoginScreen.jsx           ✅ COMPLETE
│   │   ├── UserChip.jsx              ✅ COMPLETE
│   │   ├── CameraHost.jsx            ✅ COMPLETE (getUserMedia)
│   │   ├── FieldApp.jsx              ⚠️ STUB
│   │   └── SupervisorDashboard.jsx   ⚠️ STUB with 3 tabs
│   ├── lib/
│   │   ├── supabase.js               Client + auth helpers
│   │   ├── data.js                   Full DAO (CRUD)
│   │   └── constants.js              Palette + countries + helpers
│   ├── hooks/
│   │   └── useCamera.js
│   └── styles/
│       └── global.css
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260610000000_init.sql   Schema + RLS
│   │   └── 20260610000100_seed.sql   Demo POS data
│   └── functions/
│       ├── analyze-shelf/index.ts
│       ├── create-user/index.ts
│       ├── delete-user/index.ts
│       └── bootstrap-seed/index.ts
│
├── public/
│   ├── favicon.svg
│   └── robots.txt
│
└── docs/
    ├── SPECIFICATION.md
    ├── DATA_MODEL.md
    ├── API.md
    ├── SETUP.md
    ├── INTEGRATION.md
    └── SECURITY.md
```

> ⚠️ "STUB" components have data logic connected to Supabase, but the complete UI with animations and detailed forms is in `ABInBev_TradeApp.prototype.jsx`. The backend team should port that UI into the modular components following the guides in Section 10.

---

## 9. Setup and Deployment (Step by Step)

**Estimated time:** 45–90 minutes for full deployment.

### 9.1 Prerequisites
- Node.js 20+ and npm
- Supabase account (supabase.com/dashboard)
- Netlify account (app.netlify.com)
- Anthropic API key (console.anthropic.com)
- Git
- Supabase CLI (recommended): `npm install -g supabase`

### 9.2 Step 1 — Prepare Repository
```bash
unzip abinbev-trade-platform.zip
cd abinbev-trade-platform
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/abinbev-trade-platform.git
git push -u origin main
```

### 9.3 Step 2 — Create Supabase Project
1. Dashboard → "New project"
2. Region close to CAM (us-east-1 or sa-east-1)
3. Wait ~2 min for provisioning
4. Note from Settings → API: Project URL, anon key, service_role key

### 9.4 Step 3 — Apply SQL Migrations
**Option A (faster):** SQL Editor in the dashboard
1. SQL Editor → New query
2. Copy/paste `supabase/migrations/20260610000000_init.sql`
3. Run
4. Repeat with `20260610000100_seed.sql`

**Option B:** Supabase CLI
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 9.5 Step 4 — Configure Secrets
Dashboard → Project Settings → Edge Functions → Secrets, add:
- `ANTHROPIC_API_KEY` = your Anthropic key

The variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### 9.6 Step 5 — Deploy Edge Functions
```bash
supabase functions deploy analyze-shelf
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy bootstrap-seed
```

### 9.7 Step 6 — Seed Demo Accounts (ONCE only)
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/bootstrap-seed \
  -H "apikey: YOUR_ANON_KEY"
```
After running, you will see 13 users in Authentication → Users.

### 9.8 Step 7 — Frontend Local
```bash
npm install
cp .env.example .env.local
# Edit .env.local with real values
npm run dev  # → http://localhost:5173
```
Test login with `admin` / `admin`.

### 9.9 Step 8 — Deploy to Netlify
**Via dashboard (recommended — auto-deploy on each push):**
1. Add new site → Import existing project → connect Git repo
2. Build command: `npm run build` · Publish: `dist`
3. Site settings → Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AI_PROXY_URL`
4. Deploy site

### 9.10 Troubleshooting

| Problem | Solution |
|---|---|
| Login "Invalid credentials" | Check Auth → Users; run bootstrap-seed |
| "Missing environment variables" | Verify VITE_* (local) or Environment variables (Netlify) |
| analyze-shelf 500 | Add ANTHROPIC_API_KEY in Edge Function secrets |
| Photos not uploading | Check survey-photos bucket is public; review policies |
| Supervisor dashboard empty | Verify supervisor has non-null country |
| Netlify build fails | netlify.toml already forces Node 20 |
| CORS errors | Add apikey and Authorization: Bearer headers |

---

## 10. Prototype-to-Production Migration

### 10.1 Context
The file `ABInBev_TradeApp.prototype.jsx` (~2,700 lines) contains **all the functional UI**: animations, responsive layouts, validations, live capture, AI analysis, tabbed dashboard. But it persists everything in `localStorage` (it's a demo).

The modular architecture in `src/` has the **correct production structure** with Supabase, but the `FieldApp.jsx` and `SupervisorDashboard.jsx` components are **functional stubs**.

**Backend work:** port the UI from the monolith to the modular components, replacing calls to `setCatalog`/`setUsers` (localStorage) with functions from `src/lib/data.js`.

### 10.2 Component Mapping

| Prototype Component | Target File | Replace With |
|---|---|---|
| ItineraryScreen | field/ItineraryScreen.jsx | fetchPdvs({assignedTo: user.id}) |
| PoolScreen | field/PoolScreen.jsx | fetchPdvs({country, assignedTo: null}) |
| PdvDetail | field/PdvDetail.jsx | Receives pdv as prop |
| CheckinScreen | field/CheckinScreen.jsx | createCheckin({pdvId, lat, lng, photoUrl}) |
| PriceSurvey | field/surveys/PriceSurvey.jsx | analyzeShelfImage(file) |
| CoolerSurvey | field/surveys/CoolerSurvey.jsx | createSurvey({kind:'neveras'}) |
| CatalogTab | dashboard/CatalogTab.jsx | bulkUpsertPdvs, assignPdv |
| UsersTab | dashboard/UsersTab.jsx | createUserAccount, deleteUserAccount |

### 10.3 Replacement Patterns

**Pattern 1: Load POS**
```javascript
// ❌ Before (prototype)
const [catalog, setCatalog] = useState(() => loadCatalog());
const pdvs = catalog.filter(p => p.assignedTo === gvm.id);

// ✅ After
const [pdvs, setPdvs] = useState([]);
useEffect(() => {
  data.fetchPdvs({ assignedTo: user.id }).then(setPdvs);
}, [user.id]);
```

**Pattern 2: Secure AI Analysis**
```javascript
// ❌ Before (INSECURE in production)
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': 'sk-ant-...' },  // ⚠️ Never expose
});

// ✅ After (via Edge Function)
import { analyzeShelfImage } from '../lib/supabase.js';
const result = await analyzeShelfImage(photoFile);
```

**Pattern 3: Check-in with Photo**
```javascript
const handleCheckin = async (photoFile, location) => {
  const { url } = await uploadPhoto(photoFile, `checkin-${pdv.id}`, 'checkin');
  await data.createCheckin({
    pdvId: pdv.id,
    lat: location.lat,
    lng: location.lng,
    distanceMeters: location.distance,
    photoUrl: url,
  });
};
```

**Pattern 4: Create User**
```javascript
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
    setUsers(await data.fetchProfiles());
  } catch (e) {
    setError(e.message); // Edge Function already returns clear messages
  }
};
```

---

## 11. Security and Privacy

### 11.1 Controls Already Implemented
- RLS on all tables — the DB enforces permissions; application code is not the only guard
- Service role only in Edge Functions — `SUPABASE_SERVICE_ROLE_KEY` never leaves the server
- Anthropic API key protected — lives only in Supabase project env vars
- Permission validation in Edge Functions for create-user and delete-user
- Security headers in Netlify: CSP, X-Frame-Options, etc.
- Integrity constraints: role/country, unique on username/email
- File validation: MIME types, 5 MB maximum size

### 11.2 Pre-Production Checklist
- [ ] Change ALL demo passwords (admin/admin, 1234)
- [ ] Strong password policy (minimum 12 characters)
- [ ] Enable MFA for admin and supervisor
- [ ] Rate limiting on analyze-shelf (suggested: 30 analyses/hour/user)
- [ ] Restrict CORS to production domain
- [ ] Privacy notice visible on login
- [ ] audit_log table for critical actions
- [ ] Backups tested at least once
- [ ] Penetration test (OWASP Top 10)
- [ ] Incident response plan documented

### 11.3 Personal Data Collected
- **Employees:** name, email, avatar photo, GPS location during check-ins
- **POS locations (third parties):** commercial name, address, GPS, operational data
- **Photos:** may incidentally include people (customers, POS employees)

### 11.4 Compliance (CAM Data Privacy Laws)
Although European GDPR doesn't apply directly, several countries have equivalent laws:
- **Panama:** Law 81 of 2019
- **Costa Rica:** Law 8968
- **Honduras:** Law of Transparency and Access to Public Information

**Recommendations:**
1. Privacy notice visible on login
2. Explicit consent when creating account
3. Right to erasure — endpoint to delete a user's data
4. Portability — endpoint to export data in JSON
5. Suggested retention: 24 months for surveys, 12 months for photos, 36 months for audit logs

---

## 12. Operating Costs

### 12.1 Monthly Costs Table

| Service | Initial Plan | When to Scale | Scaled Cost |
|---|---|---|---|
| Supabase | Free | >500 MB DB, >1 GB Storage, or >500k Edge calls/month | Pro: $25/month |
| Netlify | Free | >100 GB bandwidth/month | Pro: $19/month |
| Anthropic Claude | Pay-per-use | Growing volume | ~$0.05/analysis |
| Custom domain | (optional) | — | ~$15/year |

### 12.2 Pilot (Caracas, 1 GVM, 50 POS)

| Item | Monthly Volume | Cost |
|---|---|---|
| Photo storage | ~150 MB/month | $0 (free tier) |
| AI analysis | ~300 analyses × $0.05 | ~$15 |
| Egress | ~500 MB/month | $0 |
| **PILOT TOTAL** | | **$0–15/month** |

### 12.3 Full CAM Production (6 countries, ~30 GVMs, ~1,500 POS)

| Item | Volume | Cost |
|---|---|---|
| Supabase Pro | | $25 |
| Photo storage | ~9 GB/month | $0 (included) |
| AI analysis | ~9,000 × $0.05 | ~$450 |
| Netlify Pro | | $19 |
| **PRODUCTION TOTAL** | | **~$500/month** |

**Per user:** ~$15/month per active GVM.

### 12.4 Cost Optimizations
- Compress photos to 800×600 before uploading (reduces storage ~70%)
- Cache AI analysis: if the GVM revisits a shelf without changes, don't re-analyze
- Move Storage to Cloudflare R2 if egress grows (R2 charges no egress fees)
- Consider Claude Haiku for simple photos (10× cheaper than Sonnet)

---

## 13. Roadmap and Effort Estimation

### 13.1 Suggested Sprints

**Sprint 1: Auth and GVM View (2–3 days)**
- LoginScreen (already migrated)
- Port ItineraryScreen with fetchPdvs
- Port PoolScreen with self-assignment
- Port PdvDetail
- Port CheckinScreen with createCheckin
- Port ProfileScreen

**Sprint 2: Surveys (3–4 days)**
- PriceSurvey with analyzeShelfImage
- CoolerSurvey
- GenericSurvey (inventory, gondolas, POP, competition)
- Photo upload + createSurvey + insert into items/photos

**Sprint 3: Supervisor Dashboard (3–4 days)**
- OverviewTab with aggregate queries
- CatalogTab with CSV/Excel import + assignments
- UsersTab with UserFormModal

**Sprint 4: Polish and Production (2–3 days)**
- Robust error handling (toasts, retry)
- Loading states on all queries
- Optimistic updates where beneficial
- E2E tests (Playwright or Cypress)
- Production deploy and custom domain configuration

**Sprint 5 (optional): Reports and Offline (5–7 days)**
- 4 exportable reports (PDF/Excel)
- Offline mode with IndexedDB

### 13.2 Total Estimation

| Phase | Senior Dev Effort | QA |
|---|---|---|
| Full MVP (Sprints 1–4) | 10–14 days | 2–3 days |
| Extended Production (Sprints 1–5) | 15–21 days | 3–5 days |

### 13.3 Recommended Team
- 1 senior React developer (full-time)
- 1 Supabase / SQL developer (part-time, first 2 weeks)
- 1 QA (last sprint, intensive)
- 1 Product owner / AB InBev reference (1–2 hr/week for functional questions)

### 13.4 Identified Risks

| Risk | Probability | Mitigation |
|---|---|---|
| Anthropic API changes / price increase | Medium | Edge Function abstracts it; easy to change provider |
| RLS blocks legitimate queries in prod | High | Test exhaustively; have audit_log in place |
| Photos fill storage quickly | Medium | Compress before upload; move to R2 |
| Unstable connectivity in rural areas | High | Implement offline mode (Sprint 5) |
| Field team resistance to change | Medium | In-person onboarding; simple passwords initially |

---

## 14. Annexes

### 14.1 Initial Demo Credentials

| Username | Password | Role | Country |
|---|---|---|---|
| admin | admin | Global Administrator | — |
| sup.ve | 1234 | Supervisor | Venezuela |
| sup.pa | 1234 | Supervisor | Panama |
| sup.cr | 1234 | Supervisor | Costa Rica |
| sup.gt | 1234 | Supervisor | Guatemala |
| sup.hn | 1234 | Supervisor | Honduras |
| sup.sv | 1234 | Supervisor | El Salvador |
| eduardo | 1234 | GVM | Venezuela |
| carlos | 1234 | GVM | Panama |
| carla | 1234 | GVM | Costa Rica |
| jose | 1234 | GVM | Guatemala |
| maria | 1234 | GVM | Honduras |
| luis | 1234 | GVM | El Salvador |

> ⚠️ Change ALL passwords before going to production.

### 14.2 Useful Commands
```bash
# Local development
npm install
npm run dev          # → http://localhost:5173
npm run build        # → ./dist/
npm run preview      # → http://localhost:4173

# Supabase CLI
supabase link --project-ref YOUR_REF
supabase db push                  # Apply migrations
supabase functions deploy         # Deploy all edge functions
supabase functions logs           # View logs

# Netlify CLI
netlify init
netlify env:list
netlify deploy --prod

# Initial bootstrap (ONCE only)
curl -X POST https://YOUR.supabase.co/functions/v1/bootstrap-seed \
  -H "apikey: ANON_KEY"
```

### 14.3 Environment Variables

**Frontend (.env.local or Netlify Environment)**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_AI_PROXY_URL=https://xxx.supabase.co/functions/v1/analyze-shelf
```

**Supabase Edge Functions (Dashboard → Secrets)**
```
ANTHROPIC_API_KEY=sk-ant-xxx
# The following are injected automatically:
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### 14.4 External Resources
- Supabase documentation: supabase.com/docs
- Anthropic documentation: docs.anthropic.com
- Netlify documentation: docs.netlify.com
- Vite documentation: vitejs.dev

### 14.5 Supplementary Documents Included

| File | Content |
|---|---|
| docs/SPECIFICATION.md | Detailed functional specification |
| docs/DATA_MODEL.md | Complete data model |
| docs/API.md | Exhaustive API reference |
| docs/SETUP.md | Step-by-step deployment guide |
| docs/INTEGRATION.md | Guide for migrating the prototype |
| docs/SECURITY.md | Detailed security and privacy |

---

*AB InBev CAM International — Trade Survey Platform · June 2026*