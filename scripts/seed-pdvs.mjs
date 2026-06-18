// Seed PDVs using direct DB connection
// Run: node scripts/seed-pdvs.mjs
// Requires: npm install postgres (run once)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgnxlaezofcqxhwrhwrm.supabase.co';

// We'll use the anon key to sign in as admin, then insert via RLS
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbnhsYWV6b2ZjcXhod3Jod3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTMzNzAsImV4cCI6MjA5NjgyOTM3MH0.hFzdJcBJgjYmIunXcw2-jONJ4d2RgyAUGCT3aWWTaJo';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Sign in as admin to get elevated permissions via RLS
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@abinbev.local',
  password: 'admin',
});
if (authError) { console.error('Login failed:', authError.message); process.exit(1); }
console.log('Logged in as admin');

// Get GVM user IDs
const { data: profiles } = await supabase.from('profiles').select('id,username');
const byUsername = Object.fromEntries(profiles.map(p => [p.username, p.id]));
console.log('Loaded profiles:', Object.keys(byUsername));

const EM = byUsername['eduardo'];
const CV = byUsername['carlos'];
const CR = byUsername['carla'];
const JP = byUsername['jose'];
const ML = byUsername['maria'];
const LB = byUsername['luis'];

const PDVS = [
  { id: "PDV-CCS-001", name: "2Doce Market", cat: "Bodegón / Market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle Madrid, Las Mercedes, Caracas", lat: 10.483912, lng: -66.860634, status: "pending", order: 1, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-002", name: "Nola (Nola Gourmet)", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Los Palos Grandes, Caracas", lat: 10.497226, lng: -66.84476, status: "pending", order: 2, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-003", name: "Celicor La Urbina", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de La Urbina, Caracas", lat: 10.486902, lng: -66.807057, status: "pending", order: 3, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-004", name: "Celicor Boutique", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Castellana, Chacao, Caracas", lat: 10.499438, lng: -66.851188, status: "pending", order: 4, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-005", name: "Osomanía", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Milán, La California Sur, Caracas", lat: 10.478507, lng: -66.827534, status: "pending", order: 5, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-006", name: "Automercado Santa Rosa de Lima", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle A, Santa Rosa de Lima, Caracas", lat: 10.467923, lng: -66.859899, status: "pending", order: 6, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-007", name: "Automercado Alegría", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Calle B, Los Chorros, Caracas", lat: 10.502434, lng: -66.820453, status: "pending", order: 7, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-008", name: "Buy Now", cat: "Bodegón / Mayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Caurimare, Caracas", lat: 10.472085, lng: -66.838116, status: "pending", order: 8, country: "VE", assigned_to: EM },
  { id: "PDV-CCS-009", name: "BB Licores", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de La Urbina, Caracas", lat: 10.483041, lng: -66.807685, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-010", name: "Bodegón Mundial", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, La California, Caracas", lat: 10.480147, lng: -66.817124, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-011", name: "Katty Kar", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Boleíta, Caracas", lat: 10.492018, lng: -66.822593, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-012", name: "Licores Casanova", cat: "Bodegón / Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Casanova con Calle San Antonio, Caracas", lat: 10.494095, lng: -66.880399, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-013", name: "Bodegón Beethoven", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Colinas de Bello Monte, Caracas", lat: 10.487672, lng: -66.876072, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-014", name: "La Casa de la Caña", cat: "Licorería especializada", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Blandín, La Castellana, Caracas", lat: 10.49759, lng: -66.852772, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-015", name: "Licoteca", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Castellana, Caracas", lat: 10.498779, lng: -66.854374, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-016", name: "Guuao", cat: "Bodegón / Tienda", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Sambil La Candelaria, Caracas", lat: 10.505057, lng: -66.901194, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-017", name: "Minuto (Practimercado)", cat: "Mini market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Chacao, Caracas", lat: 10.492473, lng: -66.856903, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-018", name: "Oso 3", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Sector Horizonte, Caracas", lat: 10.48508, lng: -66.826901, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-019", name: "Hieylic", cat: "Bodegón / Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Los Palos Grandes, Caracas", lat: 10.498753, lng: -66.844675, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-020", name: "Hiperlicores Flor de Macaracuay", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Principal de Macaracuay, Caracas", lat: 10.463146, lng: -66.811409, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-021", name: "MegaLicor Los Palos Grandes", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Los Palos Grandes, Caracas", lat: 10.498168, lng: -66.843877, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-022", name: "Bodegón Don Picasso", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Piedra Azul, Baruta, Caracas", lat: 10.431665, lng: -66.874947, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-023", name: "Be Plus", cat: "Bodegón", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Santa Fe Norte, Caracas", lat: 10.466177, lng: -66.871656, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-024", name: "Bodegón Plus", cat: "Bodegón / Mayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Rómulo Gallegos, Caracas", lat: 10.496996, lng: -66.836685, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-025", name: "Bodegón La Salle", cat: "Bodegón / Abasto", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. La Salle, Los Caobos, Caracas", lat: 10.499473, lng: -66.884023, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-026", name: "Bodegón Los Ilustres 2020", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Los Ilustres, Caracas", lat: 10.484293, lng: -66.8948, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-027", name: "Fresh Fish", cat: "Pescadería / Gourmet market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Castellana, Caracas", lat: 10.498298, lng: -66.855138, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-028", name: "Licores Mundiales", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Las Mercedes, Caracas", lat: 10.483938, lng: -66.859536, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-029", name: "Automercado La Muralla", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "El Hatillo, Caracas", lat: 10.427589, lng: -66.829341, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-030", name: "La Muralla Gourmet", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "El Hatillo, Caracas", lat: 10.428044, lng: -66.8289, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-031", name: "Automercado Sledo", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Yaguara, Caracas", lat: 10.485476, lng: -66.950384, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-032", name: "Megalicor El Hatillo", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "El Hatillo, Caracas", lat: 10.426401, lng: -66.83087, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-033", name: "Bodegón Cinecittà", cat: "Bodegón / Gourmet", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Colinas de Bello Monte, Caracas", lat: 10.486757, lng: -66.874594, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-034", name: "Mercato Market", cat: "Supermercado / Market", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Santa Paula, Caracas", lat: 10.46339, lng: -66.841245, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-035", name: "Plan Suárez Santa Mónica", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Santa Mónica, Caracas", lat: 10.478862, lng: -66.892382, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-036", name: "Plan Suárez La Trinidad", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Trinidad, Caracas", lat: 10.437144, lng: -66.8655, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-037", name: "Forum SuperMayorista", cat: "Supermayorista", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "C.C. Los Próceres, Caracas", lat: 10.473179, lng: -66.89517, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-038", name: "Río Vida Bello Monte", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Bello Monte, Caracas", lat: 10.489222, lng: -66.879064, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-039", name: "Río Vida Andrés Bello", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Andrés Bello, Caracas", lat: 10.503768, lng: -66.884234, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-040", name: "Río Super Market Lomas del Sol", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Lomas del Sol, Caracas", lat: 10.447512, lng: -66.830097, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-041", name: "Río Super Market Los Palos Grandes", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Los Palos Grandes, Caracas", lat: 10.500637, lng: -66.84647, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-042", name: "Páramo Av. Libertador", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Libertador, Caracas", lat: 10.497436, lng: -66.876268, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-043", name: "Hipermercado Páramo Piedra Azul", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Piedra Azul, Baruta, Caracas", lat: 10.429468, lng: -66.873624, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-044", name: "Luvebras", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. San Felipe, La Castellana, Caracas", lat: 10.500012, lng: -66.852504, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-045", name: "Unicasa Bello Monte", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Caroní, Bello Monte, Caracas", lat: 10.484446, lng: -66.875538, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-046", name: "Automercado Luz", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Av. Francisco de Miranda, Chacao, Caracas", lat: 10.492713, lng: -66.855695, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-047", name: "Automercados Plaza's", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Los Chaguaramos, Caracas", lat: 10.4833, lng: -66.885235, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-048", name: "Casa Mía", cat: "Bodegón / Supermercado", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Las Mercedes, Caracas", lat: 10.481728, lng: -66.856179, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-049", name: "Central Madeirense", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "La Alameda, Caracas", lat: 10.467177, lng: -66.876292, status: "pending", order: 0, country: "VE", assigned_to: null },
  { id: "PDV-CCS-050", name: "Gama Plus", cat: "Cadena de supermercados", channel: "Off-trade", dist: "Distribuidora AB InBev Caracas", addr: "Santa Eduvigis, Caracas", lat: 10.497962, lng: -66.840505, status: "pending", order: 0, country: "VE", assigned_to: null },
  // Panama
  { id: "PDV-PA-001", name: "Super 99 Vía España", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "Vía España, Ciudad de Panamá", lat: 8.987, lng: -79.518, status: "pending", order: 1, country: "PA", assigned_to: CV },
  { id: "PDV-PA-002", name: "Riba Smith Marbella", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "Calle 53, Marbella, Panamá", lat: 8.982, lng: -79.524, status: "pending", order: 2, country: "PA", assigned_to: CV },
  { id: "PDV-PA-003", name: "Licorería El Tucán", cat: "Licorería", channel: "Off-trade", dist: "Distribuidora CAM Panamá", addr: "El Cangrejo, Panamá", lat: 8.989, lng: -79.530, status: "pending", order: 0, country: "PA", assigned_to: null },
  // Costa Rica
  { id: "PDV-CR-001", name: "Auto Mercado Escazú", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "Escazú, San José", lat: 9.926, lng: -84.135, status: "done", order: 1, country: "CR", assigned_to: CR },
  { id: "PDV-CR-002", name: "Más x Menos Sabana", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "La Sabana, San José", lat: 9.935, lng: -84.103, status: "done", order: 2, country: "CR", assigned_to: CR },
  { id: "PDV-CR-003", name: "Pricesmart Zapote", cat: "Mayorista", channel: "Off-trade", dist: "Distribuidora CAM Costa Rica", addr: "Zapote, San José", lat: 9.920, lng: -84.064, status: "pending", order: 0, country: "CR", assigned_to: null },
  // Guatemala
  { id: "PDV-GT-001", name: "Super Selecto Z.10", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Guatemala", addr: "Zona 10, Ciudad de Guatemala", lat: 14.598, lng: -90.508, status: "pending", order: 1, country: "GT", assigned_to: JP },
  { id: "PDV-GT-002", name: "La Torre Las Américas", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM Guatemala", addr: "Av. Las Américas, Guatemala", lat: 14.580, lng: -90.514, status: "pending", order: 0, country: "GT", assigned_to: null },
  // Honduras
  { id: "PDV-HN-001", name: "La Colonia Multiplaza", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM Honduras", addr: "Multiplaza, Tegucigalpa", lat: 14.077, lng: -87.183, status: "done", order: 1, country: "HN", assigned_to: ML },
  { id: "PDV-HN-002", name: "Pulpería La Esquina", cat: "Pulpería", channel: "Off-trade", dist: "Distribuidora CAM Honduras", addr: "Col. Lomas del Mayab, Tegucigalpa", lat: 14.089, lng: -87.195, status: "pending", order: 0, country: "HN", assigned_to: null },
  // El Salvador
  { id: "PDV-SV-001", name: "Súper Selectos La Gran Vía", cat: "Supermercado", channel: "Off-trade", dist: "Distribuidora CAM El Salvador", addr: "La Gran Vía, Antiguo Cuscatlán", lat: 13.683, lng: -89.244, status: "pending", order: 1, country: "SV", assigned_to: LB },
  { id: "PDV-SV-002", name: "Walmart Metrocentro", cat: "Hipermercado", channel: "Off-trade", dist: "Distribuidora CAM El Salvador", addr: "Metrocentro, San Salvador", lat: 13.701, lng: -89.224, status: "pending", order: 0, country: "SV", assigned_to: null },
];

// Get existing IDs to skip them
const { data: existing } = await supabase.from('pdvs').select('id');
const existingIds = new Set(existing.map(r => r.id));
const toInsert = PDVS.filter(p => !existingIds.has(p.id));
console.log(`Existing: ${existingIds.size}, To insert: ${toInsert.length}`);

if (toInsert.length > 0) {
  const { error } = await supabase.from('pdvs').insert(toInsert);
  if (error) {
    console.error('Error inserting PDVs:', error.message);
  } else {
    console.log(`✅ Inserted ${toInsert.length} PDVs successfully!`);
  }
} else {
  console.log('All PDVs already exist.');
}

await supabase.auth.signOut();
