# eTradeExecution (ETX) — AB InBev CAM International

> **Multi-country trade marketing field survey platform for Central America.**
> Field agents (GVMs) collect point-of-sale data on mobile; supervisors and administrators review coverage, manage store catalogs, and export reports — all in real time.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Role System](#role-system)
- [Features](#features)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Offline Support](#offline-support)
- [AI Integration](#ai-integration)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deploying to Netlify](#deploying-to-netlify)
- [Demo Credentials](#demo-credentials)
- [Security](#security)

---

## Overview

ETX is a web-based SPA built for AB InBev's CAM International trade team. It replaces paper-based field surveys with a structured digital workflow covering 6 countries: Venezuela, Panama, Costa Rica, Guatemala, Honduras, and El Salvador.

The platform solves three core problems:

1. **Field execution** — GVM field agents follow a structured daily itinerary, check in to stores via GPS, and complete standardized surveys (prices, inventory, coolers, shelf displays, POP materials, and competitive intel).
2. **Supervision** — Country supervisors monitor real-time coverage, compliance per GVM, and receive notifications for new store requests.
3. **Administration** — Global admins manage all countries, users, the full PDV (point-of-sale) catalog, and export Excel reports for leadership.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Fast SPA with hot reload and optimized builds |
| **Database** | Supabase (PostgreSQL) | Row-level security per country, relational data |
| **Authentication** | Supabase Auth | Email/password JWT sessions + username lookup via RPC |
| **Storage** | Supabase Storage | Survey photos (max 5 MB) with public CDN URLs |
| **Backend Logic** | Supabase Edge Functions (Deno) | User management, AI proxy |
| **AI Vision** | Claude API (Anthropic) | Automatic SKU detection and price extraction from shelf photos |
| **Offline** | IndexedDB (native browser API) | PDV catalog cache + operation queue for offline use |
| **Hosting** | Netlify | Global CDN, HTTPS, SPA routing, security headers |
| **Icons** | Lucide React | Consistent icon system |
| **Excel** | SheetJS (xlsx) | Client-side report export |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     NETLIFY (CDN)                       │
│              React 18 + Vite SPA (dist/)                │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  LoginScreen │   │   FieldApp   │   │ Supervisor │  │
│  │  (all users) │   │  (GVM role)  │   │  Dashboard │  │
│  └──────────────┘   └──────────────┘   └────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                     src/lib/ (DAO layer)                │
│            supabase.js · data.js · offline.js           │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / REST / Realtime
              ┌──────────────┴──────────────┐
              │        SUPABASE             │
              │                             │
              │  ┌─────────┐ ┌──────────┐  │
              │  │  Auth   │ │ Postgres │  │
              │  │  (JWT)  │ │  + RLS   │  │
              │  └─────────┘ └──────────┘  │
              │                             │
              │  ┌─────────┐ ┌──────────┐  │
              │  │ Storage │ │  Edge    │  │
              │  │ (photos)│ │Functions │  │
              │  └─────────┘ └──────────┘  │
              └──────────────┬──────────────┘
                             │
                    ┌────────┴────────┐
                    │  Anthropic API  │
                    │  (Claude AI)    │
                    └─────────────────┘
```

### Data Flow

1. User authenticates via Supabase Auth → receives a JWT.
2. `App.jsx` resolves the session on mount, fetches the user profile and PDV catalog filtered by role/country.
3. GVMs use `FieldApp` (itinerary → check-in → surveys → checkout). All writes go through `src/lib/data.js` which talks directly to Supabase REST.
4. When offline, operations are queued in IndexedDB and automatically replayed when connectivity is restored.
5. Supervisors and admins use `SupervisorDashboard` with tabs for Overview, Catalog, Users, Store Requests, and Survey Timings.
6. Excel reports are generated entirely client-side via SheetJS.
7. AI shelf analysis sends a base64 image from the browser to the `analyze-shelf` Edge Function, which proxies it to the Anthropic Claude API and returns structured SKU/price data.

---

## Role System

The platform enforces a strict three-tier role hierarchy via Postgres RLS policies. Every database policy checks the caller's role and country before granting access.

| Role | Scope | Capabilities |
|---|---|---|
| **admin** | Global (all countries) | Full CRUD on all data, all countries, all users, all reports |
| **supervisor** | One country | Manages GVMs and PDVs for their country, approves new store requests, exports country reports |
| **gvm** | One country, assigned PDVs | Executes field itinerary, completes surveys, requests new stores |

**Key RLS rules:**
- `admin` has `country = null` (enforced by a DB constraint).
- `supervisor` and `gvm` must have a non-null country.
- GVMs can only see PDVs assigned to them or in the pool (unassigned) for their country.
- Supervisors can see all PDVs, users, surveys, and check-ins for their country only.
- User creation and deletion are gated behind Edge Functions that re-validate the caller's role server-side — the client cannot escalate privileges.

---

## Features

### GVM Field App (`FieldApp`)

- **Animated itinerary** with per-PDV progress tracking and reorder capability.
- **Geofenced check-in** using the Haversine formula against stored PDV coordinates; shows distance to store in meters.
- **Live camera capture** via `getUserMedia` with a live timestamp and "EN VIVO" watermark.
- **6 survey types** each with its own form and optional AI assistance:
  - **Prices** (`precios`) — capture shelf prices per SKU; AI extraction from photos.
  - **Inventory** (`inventario`) — stock count per SKU; AI counting from photos.
  - **Coolers** (`neveras`) — cooler condition and share-of-shelf.
  - **Shelf / Gondola** (`gondolas`) — planogram compliance; AI SKU detection.
  - **POP Materials** (`pop`) — presence and condition of point-of-purchase materials.
  - **Competition** (`competencia`) — competitor brand pricing and presence.
- **Out-of-stock (OOS) flagging** per SKU item within inventory surveys.
- **Pool mechanism** — GVMs can self-assign unassigned PDVs from the pool.
- **New store requests** — GVMs can submit new PDV requests (name, category, address, coordinates, photo) that go to the supervisor approval queue.
- **Formal checkout** — marks a PDV visit as complete.

### Supervisor / Admin Dashboard (`SupervisorDashboard`)

- **Overview tab** — KPI cards (active GVMs, total PDVs, completed, in-progress, pending, pool), overall coverage progress bar, per-GVM compliance bars, OOS alerts panel, one-click Excel report export.
- **Catalog tab** — Searchable/filterable paginated table of all PDVs; assign/unassign PDVs to GVMs; delete PDVs; import PDVs from CSV or Excel (.xlsx/.xls) with column mapping and preview.
- **Users tab** — Full user management (create, edit, delete) with role and country filters; supervisors can only create GVMs in their country; admins can create any role.
- **Requests tab** (`Solicitudes`) — New PDV approval queue; approve (creates the PDV in Supabase) or reject requests from GVMs; badge count on the tab.
- **Timings tab** — Survey duration analytics per GVM and PDV.

### Reports (Excel Export)

All reports are generated client-side and downloaded as `.xlsx` files:

| Report | Contents |
|---|---|
| **Coverage** | All PDVs with status, assigned GVM, country, address |
| **Surveys** | All completed surveys with type, date, GVM, PDV, notes |
| **OOS Alerts** | All survey items flagged as out-of-stock |
| **GVM Performance** | Assigned vs completed PDVs per GVM, compliance % |

---

## Database Schema

### Tables

```
countries        — Country reference data (code, name, flag, currency, distributor)
profiles         — Extended user profiles linked to auth.users (role, country, initials, color, stats)
pdvs             — Point-of-sale catalog (name, address, lat/lng, status, country, assigned_to)
checkins         — GPS check-in events (pdv_id, user_id, lat, lng, distance_meters, photo_url)
surveys          — Survey headers (pdv_id, kind, created_by, country, status, notes, payload)
survey_photos    — Photos attached to surveys (url, storage_path, is_live)
survey_items     — SKU-level data rows within a survey (brand, pack, price, psv, is_abi, oos, confidence, detected_by_ai)
```

### Enums

```sql
user_role   → 'admin' | 'supervisor' | 'gvm'
pdv_status  → 'pending' | 'in_progress' | 'done'
survey_kind → 'precios' | 'inventario' | 'neveras' | 'gondolas' | 'pop' | 'competencia'
```

### Key Indexes

All foreign keys are indexed. Additional indexes on `pdvs(country)`, `pdvs(assigned_to)`, `pdvs(status)`, `surveys(country)`, `surveys(created_by)`, `surveys(kind)`, and `profiles(role, country)` for dashboard query performance.

### RLS Helper Functions

```sql
current_user_role()    -- returns the caller's role from profiles
current_user_country() -- returns the caller's country from profiles
```

Both are `SECURITY DEFINER` so they bypass RLS when resolving the caller's own identity.

---

## Edge Functions

Four Deno-based Edge Functions run on Supabase's infrastructure:

### `analyze-shelf`
Proxies image data from the frontend to the Anthropic Claude API. Accepts base64 image + MIME type + mode (`gondolas`, `inventory`, `prices`) and returns structured JSON with detected SKUs, quantities, and prices. The Anthropic API key never leaves the server.

### `create-user`
Creates a new `auth.users` entry + `profiles` row atomically. Validates the caller's role server-side:
- GVM → rejected (403)
- Supervisor → can only create GVMs in their own country
- Admin → unrestricted

On profile insert failure, rolls back the auth user to avoid orphaned accounts.

### `delete-user`
Deletes a user from both `auth.users` and `profiles` using the service role key. Validates that the caller has sufficient privilege.

### `bootstrap-seed`
One-time function to populate demo user accounts. Called once after initial deploy.

---

## Offline Support

The app uses the browser's native **IndexedDB** API (via `src/lib/offline.js`) with two object stores:

- **`pdvs`** — Full PDV catalog snapshot written after every successful data fetch. If the app launches offline, it loads from this cache and shows a banner.
- **`queue`** — Ordered list of pending write operations (survey submissions, check-ins) that failed due to no connectivity. Each entry has a type, payload, and timestamp.

**Auto-sync flow:**
1. When the browser fires the `online` event, `App.jsx` automatically calls `syncQueue()`.
2. Each queued operation is replayed against Supabase in order.
3. Successfully synced items are removed from the queue.
4. A toast notification reports how many operations were synced.
5. A persistent banner at the bottom of the screen shows the pending count and a manual "Sync now" button.

---

## AI Integration

Shelf analysis uses **Claude** (Anthropic) via a Supabase Edge Function proxy so the API key is never exposed to the browser.

**Flow:**
1. GVM captures one or more photos using the live camera or file picker.
2. Each image is converted to base64 in the browser.
3. A `POST` request is sent to `/functions/v1/analyze-shelf` with `{ image, mimeType, mode }`.
4. The Edge Function forwards the request to the Anthropic API with a structured prompt describing the expected output format (array of `{ sku, qty }` for inventory or `{ sku, price }` for prices).
5. The response is parsed and pre-filled into the survey form.
6. For multi-photo analysis (inventory mode), quantities are summed across photos to handle cases where different photos cover different shelf zones.

**Supported modes:**
- `gondolas` — detect which branded SKUs are present on the shelf.
- `inventory` — count units per SKU.
- `prices` — read price tags per SKU.

---

## Project Structure

```
abinbev-trade-platform/
├── src/
│   ├── App.jsx                          # Root: auth state machine, shell layout, offline sync
│   ├── main.jsx                         # Vite entry point
│   ├── components/
│   │   ├── LoginScreen.jsx              # Animated login with demo credentials panel
│   │   ├── FieldApp.jsx                 # GVM app shell (itinerary navigation)
│   │   ├── SupervisorDashboard.jsx      # Admin/supervisor dashboard (5 tabs)
│   │   ├── CameraHost.jsx               # getUserMedia camera modal (global)
│   │   ├── UserChip.jsx                 # Top-bar user avatar + logout
│   │   ├── OfflineBanner.jsx            # Sticky offline status bar
│   │   ├── ErrorBoundary.jsx            # React error boundary
│   │   ├── Toaster.jsx                  # Toast notification system + confirm dialogs
│   │   ├── TimingsPanel.jsx             # Survey duration analytics
│   │   └── field/
│   │       ├── ItineraryScreen.jsx      # Daily PDV list with progress
│   │       ├── PoolScreen.jsx           # Unassigned PDV pool browser
│   │       ├── ProfileScreen.jsx        # GVM profile view
│   │       ├── NewPdvModal.jsx          # New store request form
│   │       └── surveys/
│   │           └── SurveyScreen.jsx     # Survey type router + all 6 survey forms
│   ├── lib/
│   │   ├── supabase.js                  # Supabase client, auth helpers, photo upload, AI proxy calls
│   │   ├── data.js                      # DAO layer: all Supabase reads/writes + offline queue integration
│   │   ├── constants.jsx                # Design tokens, country list, survey kinds, product catalog (41 VE SKUs), ETX logo SVG
│   │   └── offline.js                   # IndexedDB wrapper (catalog cache + operation queue)
│   ├── hooks/
│   │   └── useCamera.js                 # CameraContext — global camera modal trigger
│   └── styles/
│       └── global.css                   # CSS custom properties, animations, shimmer skeletons
├── supabase/
│   ├── migrations/
│   │   ├── 20260610000000_init.sql      # Full schema: tables, enums, RLS policies, storage bucket
│   │   ├── 20260610000100_seed.sql      # Demo data: 50 Caracas PDVs + 12 demo PDVs
│   │   └── 20260612100000_add_survey_timing.sql  # Survey start/end timing columns
│   └── functions/
│       ├── analyze-shelf/               # Claude API proxy (vision AI)
│       ├── create-user/                 # Privileged user creation with role validation
│       ├── delete-user/                 # Privileged user deletion
│       └── bootstrap-seed/             # One-time demo account seeder
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── products/VE/                    # 50+ product reference images (Venezuela catalog)
├── netlify.toml                        # Build config, SPA redirect, security headers, asset cache
├── vite.config.js                      # Vite build with manual chunk splitting
├── package.json
└── .env.example                        # Environment variable template
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key (for AI shelf analysis)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Note your **Project URL** and **anon public key** from Settings → API

### 3. Apply database migrations

**Option A — Supabase CLI:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B — SQL Editor:**
Copy and run each file from `supabase/migrations/` in order in the Supabase SQL Editor.

### 4. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your real values
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy analyze-shelf
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy bootstrap-seed
```

Then add your Anthropic key as an Edge Function secret in the Supabase dashboard:
**Project Settings → Edge Functions → Secrets → Add `ANTHROPIC_API_KEY`**

### 6. Seed demo users

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/bootstrap-seed \
     -H "apikey: YOUR_ANON_KEY"
```

Run this only once. It creates all demo accounts listed in the [Demo Credentials](#demo-credentials) section.

### 7. Start the development server

```bash
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_AI_PROXY_URL` | Yes | URL of the `analyze-shelf` Edge Function |
| `VITE_DEFAULT_LOCALE` | No | Default locale for number formatting (default: `es-PA`) |
| `VITE_APP_NAME` | No | App display name override (default: `Trade Survey`) |

All `VITE_` prefixed variables are inlined at build time by Vite. They are safe to include in the frontend because:
- `VITE_SUPABASE_ANON_KEY` is a public key — it is designed to be exposed. Row Level Security enforces data access, not key secrecy.
- The Anthropic API key is **never** included in frontend env vars. It lives only in the Edge Function environment.

---

## Deploying to Netlify

The [netlify.toml](netlify.toml) is pre-configured. No manual build settings are needed.

### Option A — Git-connected deploy (recommended)

1. Push the project to GitHub or GitLab.
2. In Netlify: **Add new site → Import from Git** → select your repository.
3. Build settings are automatically detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add your environment variables under **Site settings → Environment variables**.
5. Deploy.

### Option B — Manual drag-and-drop

```bash
npm run build
```

Then drag the `dist/` folder into the Netlify deploy drop zone at [app.netlify.com](https://app.netlify.com).

### What netlify.toml provides

| Config | Value |
|---|---|
| Node version | 20 |
| SPA redirect | All routes → `/index.html` (status 200) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera and geolocation allowed for `self` only |
| `Content-Security-Policy` | Restricts scripts, styles, images, connections to known origins |
| Static asset cache | `public, max-age=31536000, immutable` for `/assets/*` |

---

## Demo Credentials

After running `bootstrap-seed`, the following accounts are available:

| Username | Password | Role | Country |
|---|---|---|---|
| `admin` | `admin` | Administrator | Global |
| `sup.ve` | `1234` | Supervisor | 🇻🇪 Venezuela |
| `sup.pa` | `1234` | Supervisor | 🇵🇦 Panama |
| `sup.cr` | `1234` | Supervisor | 🇨🇷 Costa Rica |
| `sup.gt` | `1234` | Supervisor | 🇬🇹 Guatemala |
| `sup.hn` | `1234` | Supervisor | 🇭🇳 Honduras |
| `sup.sv` | `1234` | Supervisor | 🇸🇻 El Salvador |
| `eduardo` | `1234` | GVM | 🇻🇪 Venezuela |
| `carlos` | `1234` | GVM | 🇵🇦 Panama |
| `carla` | `1234` | GVM | 🇨🇷 Costa Rica |
| `jose` | `1234` | GVM | 🇬🇹 Guatemala |
| `maria` | `1234` | GVM | 🇭🇳 Honduras |
| `luis` | `1234` | GVM | 🇸🇻 El Salvador |

> **Change all passwords before exposing the site to real users.**

Login supports both username (e.g. `eduardo`) and full email (e.g. `eduardo@ETX.local`). Username resolution is handled via a Postgres RPC function (`get_email_by_username`) that uses `SECURITY DEFINER` to bypass RLS safely.

---

## Security

### Authentication
- Sessions are JWT-based, persisted in localStorage, and auto-refreshed by the Supabase client.
- The `signIn` helper resolves usernames to emails via a server-side RPC before calling `signInWithPassword` — no username enumeration risk because the RPC returns nothing if the username doesn't exist.

### Row Level Security
Every table has RLS enabled. No data is accessible without a valid JWT matching the appropriate policy. Key principles:
- Admins have full access to all rows.
- Supervisors are scoped to their `country` column.
- GVMs are scoped to their `country` and their own `user_id` / `assigned_to`.
- Users cannot elevate their own role (the `profiles_self_update` policy enforces this at the DB level).

### User Management
User creation and deletion go through Edge Functions using the `service_role` key, which never reaches the browser. The functions re-verify the caller's role server-side before acting, making client-side privilege escalation impossible.

### AI Proxy
The Anthropic API key is stored as a Supabase Edge Function secret. The browser sends images to the Edge Function endpoint, not directly to `api.anthropic.com`. The CSP header in `netlify.toml` does not allow connections to `api.anthropic.com` from the browser.

### Content Security Policy
The deployed app enforces a strict CSP that allows scripts and styles only from `self`, connects only to `*.supabase.co`, and restricts image sources to `self`, `data:`, `blob:`, and Supabase CDN. Inline scripts are allowed because Vite's runtime requires them; all other third-party script sources are blocked.
