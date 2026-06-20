export const T = {
  bg: '#FBF8F1', surface: '#FFFDF8', surfaceAlt: '#F2EDE0', cream: '#F6F0E2',
  primary: '#C68A12', primaryDim: '#A2700B', primarySoft: '#FAEDCE',
  ink: '#26303A', inkSoft: '#3E4B57', navy: '#2C4256',
  textMed: '#5C6770', textLow: '#97A0A8', border: '#E8E0CF', white: '#FFFEFB',
  success: '#2C9D63', successSoft: '#E3F4EA',
  warn: '#DD9426', warnSoft: '#FBEFD4',
  danger: '#D5443D', dangerSoft: '#FAE5E3',
  info: '#3D83C2', infoSoft: '#E4F0F8',
};

export const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
export const DISPLAY = "'Fraunces', Georgia, serif";

export const COUNTRIES = [
  { code: 'VE', name: 'Venezuela',   flag: '🇻🇪', currency: 'USD', distributor: 'Distribuidora ETX Caracas' },
  { code: 'PA', name: 'Panamá',      flag: '🇵🇦', currency: 'USD', distributor: 'Distribuidora ETX Panamá' },
  { code: 'CR', name: 'Costa Rica',  flag: '🇨🇷', currency: 'CRC', distributor: 'Distribuidora ETX Costa Rica' },
  { code: 'GT', name: 'Guatemala',   flag: '🇬🇹', currency: 'GTQ', distributor: 'Distribuidora ETX Guatemala' },
  { code: 'HN', name: 'Honduras',    flag: '🇭🇳', currency: 'HNL', distributor: 'Distribuidora ETX Honduras' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', currency: 'USD', distributor: 'Distribuidora ETX El Salvador' },
];
export const getCountry = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[0];

import { Tag, Boxes, ThermometerSun, LayoutGrid, Megaphone, Eye } from 'lucide-react';

export const SURVEY_KINDS = [
  { key: 'precios',     label: 'Precios',       color: T.primary, icon: Tag },
  { key: 'inventario',  label: 'Inventario',    color: T.navy, icon: Boxes },
  { key: 'neveras',     label: 'Refrigerator',      color: T.info, icon: ThermometerSun },
  { key: 'gondolas',    label: 'Góndolas',      color: T.success, icon: LayoutGrid },
  { key: 'pop',         label: 'Material POP',  color: T.warn, icon: Megaphone },
  { key: 'competencia', label: 'Acciones de la Competencia', color: T.danger, icon: Eye },
];

/* ── ETX Logo: órbita + satélite + barras KPI ──────────────────────────────── */
export function ETXLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="etxGrad" x1="0" y1="48" x2="48" y2="0">
          <stop offset="0%" stopColor="#A2700B" />
          <stop offset="100%" stopColor="#E8B33C" />
        </linearGradient>
      </defs>
      {/* órbita punteada — ciclo de ejecución */}
      <circle className="logo-orbit" cx="24" cy="24" r="21"
        stroke="#C68A12" strokeWidth="1.8" strokeDasharray="4 6"
        strokeLinecap="round" opacity=".5" fill="none" />
      {/* satélite — GVM en campo */}
      <g className="logo-sat">
        <circle cx="24" cy="3.2" r="2.7" fill="#C68A12" />
        <circle cx="24" cy="3.2" r="1.1" fill="#FFFEFB" />
      </g>
      {/* barras KPI ascendentes */}
      <rect className="logo-bar" x="11" y="27" width="6.5" height="10" rx="2.4"
        fill="url(#etxGrad)" opacity=".5" />
      <rect className="logo-bar" x="20.75" y="21" width="6.5" height="16" rx="2.4"
        fill="url(#etxGrad)" opacity=".78" style={{ animationDelay: '.14s' }} />
      <rect className="logo-bar" x="30.5" y="14" width="6.5" height="23" rx="2.4"
        fill="url(#etxGrad)" style={{ animationDelay: '.28s' }} />
    </svg>
  );
}

/* Legacy alias so existing imports that still reference HopMark don't break */
export const HopMark = ETXLogo;


/* ============================================================
   CATÁLOGO DE PRODUCTOS POR PAÍS
   Fuente: catalogo_cervezas_venezuela.xlsx
   abi: true = portfolio ETX (importadas gestionadas)
   abi: false = competencia local/otras importadas
   psv: Precio de Venta Sugerido en USD
   ============================================================ */

// Venezuela — 41 SKUs (Polar, Regional, Importadas)
const PRODUCTS_VE = [
  // ── Cervecería Polar ── (competencia local)
  { brand: 'Cervecería Polar', name: 'Polar Pilsen', pack: 'Botella retornable',     size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Polar', name: 'Polar Pilsen', pack: 'Botella retornable',     size: 330, units: 24, abi: false, psv: 0.75 },
  { brand: 'Cervecería Polar', name: 'Polar Pilsen', pack: 'Botella no retornable',  size: 355, units: 24, abi: false, psv: 1.10 },
  { brand: 'Cervecería Polar', name: 'Polar Pilsen', pack: 'Lata',                   size: 250, units: 24, abi: false, psv: 0.65 },
  { brand: 'Cervecería Polar', name: 'Polar Pilsen', pack: 'Lata',                   size: 355, units: 12, abi: false, psv: 0.95 },
  { brand: 'Cervecería Polar', name: 'Polar Light',  pack: 'Botella retornable',     size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Polar', name: 'Polar Light',  pack: 'Botella no retornable',  size: 355, units: 24, abi: false, psv: 1.10 },
  { brand: 'Cervecería Polar', name: 'Polar Light',  pack: 'Lata',                   size: 250, units: 24, abi: false, psv: 0.65 },
  { brand: 'Cervecería Polar', name: 'Polar Light',  pack: 'Lata',                   size: 355, units: 24, abi: false, psv: 0.95 },
  { brand: 'Cervecería Polar', name: 'Solera (Verde)',      pack: 'Botella retornable', size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Polar', name: 'Solera (Verde)',      pack: 'Lata',               size: 250, units: 24, abi: false, psv: 0.65 },
  { brand: 'Cervecería Polar', name: 'Solera Light (Azul)', pack: 'Botella retornable', size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Polar', name: 'Solera Light (Azul)', pack: 'Lata',               size: 250, units: 24, abi: false, psv: 0.65 },

  // ── Cervecería Regional ── (competencia local)
  { brand: 'Cervecería Regional', name: 'Regional Light',  pack: 'Botella retornable', size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Regional', name: 'Regional Light',  pack: 'Lata',               size: 250, units: 24, abi: false, psv: 0.65 },
  { brand: 'Cervecería Regional', name: 'Regional Light',  pack: 'Lata',               size: 355, units: 24, abi: false, psv: 0.95 },
  { brand: 'Cervecería Regional', name: 'Regional Pilsen', pack: 'Botella retornable', size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Regional', name: 'Regional Pilsen', pack: 'Lata',               size: 355, units: 24, abi: false, psv: 0.95 },
  { brand: 'Cervecería Regional', name: 'Morena',          pack: 'Botella retornable', size: 222, units: 36, abi: false, psv: 0.60 },
  { brand: 'Cervecería Regional', name: 'Morena',          pack: 'Lata',               size: 355, units: 24, abi: false, psv: 0.95 },
  { brand: 'Cervecería Regional', name: 'Zulia',           pack: 'Botella retornable',    size: 222, units: 36, abi: false, psv: 0.55 },
  { brand: 'Cervecería Regional', name: 'Zulia',           pack: 'Botella no retornable', size: 250, units: 24, abi: false, psv: 0.70 },
  { brand: 'Cervecería Regional', name: 'Zulia',           pack: 'Lata',                  size: 295, units: 24, abi: false, psv: 0.80 },
  { brand: 'Cervecería Regional', name: 'Cardenal',        pack: 'Lata',                  size: 250, units: 24, abi: false, psv: 0.70 },
  { brand: 'Cervecería Regional', name: 'Cardenal Ultra',  pack: 'Lata',                  size: 250, units: 24, abi: false, psv: 0.75 },

  // ── Importadas ── (portfolio ETX = abi: true)
  { brand: 'Importada', name: 'Heineken',                  pack: 'Botella no retornable', size: 330, units: 24, abi: false, psv: 2.50 },
  { brand: 'Importada', name: 'Heineken',                  pack: 'Lata',                  size: 330, units: 24, abi: false, psv: 2.50 },
  { brand: 'Importada', name: 'Corona Extra',              pack: 'Botella no retornable', size: 355, units: 24, abi: true,  psv: 3.00 },
  { brand: 'Importada', name: 'Coronita',                  pack: 'Botella no retornable', size: 210, units: 24, abi: true,  psv: 2.50 },
  { brand: 'Importada', name: 'Modelo Especial',           pack: 'Botella no retornable', size: 355, units: 24, abi: true,  psv: 2.80 },
  { brand: 'Importada', name: 'Modelo Especial',           pack: 'Lata',                  size: 355, units: 24, abi: true,  psv: 2.80 },
  { brand: 'Importada', name: 'Negra Modelo',              pack: 'Botella no retornable', size: 355, units: 24, abi: true,  psv: 3.00 },
  { brand: 'Importada', name: 'Stella Artois',             pack: 'Botella no retornable', size: 330, units: 24, abi: true,  psv: 3.50 },
  { brand: 'Importada', name: 'Stella Artois',             pack: 'Lata',                  size: 330, units: 24, abi: true,  psv: 3.50 },
  { brand: 'Importada', name: 'Estrella Galicia Especial', pack: 'Botella no retornable', size: 330, units: 24, abi: false, psv: 3.20 },
  { brand: 'Importada', name: 'Budweiser',                 pack: 'Botella no retornable', size: 355, units: 24, abi: true,  psv: 2.50 },
  { brand: 'Importada', name: 'Presidente',                pack: 'Botella no retornable', size: 355, units: 24, abi: false, psv: 2.00 },
  { brand: 'Importada', name: 'Presidente',                pack: 'Lata',                  size: 237, units: 24, abi: false, psv: 1.80 },
  { brand: 'Importada', name: 'Presidente',                pack: 'Lata',                  size: 355, units: 24, abi: false, psv: 2.00 },
  { brand: 'Importada', name: 'Presidente Light',          pack: 'Lata',                  size: 237, units: 24, abi: false, psv: 1.80 },
  { brand: 'Importada', name: 'Belga Star Lager (4,9%)',   pack: 'Lata',                  size: 330, units: 24, abi: false, psv: 2.20 },
].map(p => ({
  ...p,
  country: 'VE',
  sku: `${p.name} ${p.pack === 'Lata' ? 'Lata' : 'Bot.'} ${p.size}ml`,
}));

/* Catálogo indexado por país — agregar otros países aquí cuando estén disponibles */
export const PRODUCT_CATALOG = { VE: PRODUCTS_VE };

/* Helper: obtener catálogo para un país (fallback a lista vacía) */
export function getProductsForCountry(countryCode) {
  return PRODUCT_CATALOG[countryCode] || [];
}

/* Helper: construir lista de SKUs únicos para InventorySurvey */
export function getSkuList(countryCode) {
  return getProductsForCountry(countryCode).map(p => ({
    sku:   p.sku,
    brand: p.brand,
    abi:   p.abi,
    psv:   p.psv,
  }));
}

/* Helper: obtener SKUs ETX (propios) para el prompt de IA */
export function getEtxBrandNames(countryCode) {
  return [...new Set(
    getProductsForCountry(countryCode).filter(p => p.abi).map(p => p.name)
  )];
}

/* Imágenes de referencia extraídas del catálogo VE (Excel) */
export const PRODUCT_IMAGES = {
  'Polar Pilsen Bot. 222ml': {
    box: '/products/VE/Polar_Pilsen_Bot._222ml_box.png',
    unit: '/products/VE/Polar_Pilsen_Bot._222ml_unit.png',
  },
  'Polar Pilsen Bot. 330ml': {
    box: '/products/VE/Polar_Pilsen_Bot._330ml_box.png',
    unit: '/products/VE/Polar_Pilsen_Bot._330ml_unit.png',
  },
  'Polar Pilsen Lata 250ml': {
    unit: '/products/VE/Polar_Pilsen_Lata_250ml_unit.jpg',
  },
  'Polar Pilsen Lata 355ml': {
    unit: '/products/VE/Polar_Pilsen_Lata_355ml_unit.png',
    box: '/products/VE/Polar_Pilsen_Lata_355ml_box.png',
    sixpack: '/products/VE/Polar_Pilsen_Lata_355ml_sixpack.png',
  },
  'Polar Light Bot. 222ml': {
    box: '/products/VE/Polar_Light_Bot._222ml_box.png',
    unit: '/products/VE/Polar_Light_Bot._222ml_unit.png',
  },
  'Polar Light Bot. 355ml': {
    unit: '/products/VE/Polar_Light_Bot._355ml_unit.png',
  },
  'Polar Light Lata 250ml': {
    sixpack: '/products/VE/Polar_Light_Lata_250ml_sixpack.png',
    unit: '/products/VE/Polar_Light_Lata_250ml_unit.png',
  },
  'Polar Light Lata 355ml': {
    unit: '/products/VE/Polar_Light_Lata_355ml_unit.png',
  },
  'Solera Light (Azul) Lata 250ml': {
    unit: '/products/VE/Solera_Light_Azul_Lata_250ml_unit.jpg',
  },
  'Regional Pilsen Bot. 222ml': {
    box: '/products/VE/Regional_Pilsen_Bot._222ml_box.png',
  },
  'Regional Pilsen Lata 355ml': {
    box: '/products/VE/Regional_Pilsen_Lata_355ml_box.png',
    unit: '/products/VE/Regional_Pilsen_Lata_355ml_unit.png',
  },
  'Morena Bot. 222ml': {
    box: '/products/VE/Morena_Bot._222ml_box.png',
  },
  'Morena Lata 355ml': {
    box: '/products/VE/Morena_Lata_355ml_box.png',
    unit: '/products/VE/Morena_Lata_355ml_unit.jpg',
  },
  'Zulia Bot. 222ml': {
    unit: '/products/VE/Zulia_Bot._222ml_unit.png',
  },
  'Zulia Bot. 250ml': {
    box: '/products/VE/Zulia_Bot._250ml_box.png',
  },
  'Zulia Lata 295ml': {
    box: '/products/VE/Zulia_Lata_295ml_box.png',
    unit: '/products/VE/Zulia_Lata_295ml_unit.png',
  },
  'Cardenal Lata 250ml': {
    box: '/products/VE/Cardenal_Lata_250ml_box.png',
  },
  'Heineken Bot. 330ml': {
    sixpack: '/products/VE/Heineken_Bot._330ml_sixpack.jpg',
  },
  'Heineken Lata 330ml': {
    unit: '/products/VE/Heineken_Lata_330ml_unit.png',
    sixpack: '/products/VE/Heineken_Lata_330ml_sixpack.jpg',
  },
  'Corona Extra Bot. 355ml': {
    sixpack: '/products/VE/Corona_Extra_Bot._355ml_sixpack.png',
  },
  'Coronita Bot. 210ml': {
    unit: '/products/VE/Coronita_Bot._210ml_unit.png',
    sixpack: '/products/VE/Coronita_Bot._210ml_sixpack.png',
  },
  'Modelo Especial Bot. 355ml': {
    unit: '/products/VE/Modelo_Especial_Bot._355ml_unit.png',
    sixpack: '/products/VE/Modelo_Especial_Bot._355ml_sixpack.png',
  },
  'Modelo Especial Lata 355ml': {
    unit: '/products/VE/Modelo_Especial_Lata_355ml_unit.png',
    sixpack: '/products/VE/Modelo_Especial_Lata_355ml_sixpack.png',
  },
  'Negra Modelo Bot. 355ml': {
    unit: '/products/VE/Negra_Modelo_Bot._355ml_unit.png',
    sixpack: '/products/VE/Negra_Modelo_Bot._355ml_sixpack.png',
  },
  'Stella Artois Bot. 330ml': {
    unit: '/products/VE/Stella_Artois_Bot._330ml_unit.png',
    sixpack: '/products/VE/Stella_Artois_Bot._330ml_sixpack.png',
  },
  'Stella Artois Lata 330ml': {
    unit: '/products/VE/Stella_Artois_Lata_330ml_unit.png',
  },
  'Estrella Galicia Especial Bot. 330ml': {
    box: '/products/VE/Estrella_Galicia_Especial_Bot._330ml_box.jpg',
  },
  'Budweiser Bot. 355ml': {
    unit: '/products/VE/Budweiser_Bot._355ml_unit.jpg',
    box: '/products/VE/Budweiser_Bot._355ml_box.jpg',
  },
  'Presidente Bot. 355ml': {
    unit: '/products/VE/Presidente_Bot._355ml_unit.png',
    sixpack: '/products/VE/Presidente_Bot._355ml_sixpack.png',
  },
  'Presidente Lata 237ml': {
    box: '/products/VE/Presidente_Lata_237ml_box.png',
    unit: '/products/VE/Presidente_Lata_237ml_unit.png',
    sixpack: '/products/VE/Presidente_Lata_237ml_sixpack.png',
  },
  'Presidente Lata 355ml': {
    unit: '/products/VE/Presidente_Lata_355ml_unit.png',
  },
  'Presidente Light Lata 237ml': {
    unit: '/products/VE/Presidente_Light_Lata_237ml_unit.png',
    sixpack: '/products/VE/Presidente_Light_Lata_237ml_sixpack.png',
  },
};

/* Helper: obtener imagen de referencia de un SKU */
export function getProductImage(sku, prefer = 'unit') {
  const imgs = PRODUCT_IMAGES[sku];
  if (!imgs) return null;
  return imgs[prefer] || imgs.unit || imgs.box || imgs.sixpack || null;
}

export const haversine = (a, b) => {
  const R = 6371e3, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
};
