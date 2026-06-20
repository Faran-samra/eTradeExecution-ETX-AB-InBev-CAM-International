import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Faltan variables de entorno. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
});

// =====================================================================
// Helpers de autenticación
// =====================================================================
export async function signIn(emailOrUsername, password) {
  let email = emailOrUsername.trim();
  if (!email.includes('@')) {
    // Look up real email from username via public RPC (SECURITY DEFINER bypasses RLS)
    const { data: found } = await supabase.rpc('get_email_by_username', {
      p_username: email.toLowerCase(),
    });
    email = found || `${email}@ETX.local`;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Cargar el perfil extendido desde nuestra tabla `profiles`
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

// =====================================================================
// Subida de fotos — Cloudflare R2 via Netlify Function
// =====================================================================
export async function uploadPhoto(file, surveyId, kind) {
  const ext      = (file.type?.split('/')[1] || 'jpg').replace(/[^a-z0-9]/g, '');
  const filename = `${surveyId}/${kind}-${Date.now()}.${ext}`;

  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(String(reader.result).split(',')[1]);
    reader.onerror = () => rej(new Error('Error al leer imagen'));
    reader.readAsDataURL(file);
  });

  const resp = await fetch('/.netlify/functions/upload-photo', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ base64, contentType: file.type || 'image/jpeg', filename }),
  });

  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`Error al subir foto: ${msg}`);
  }

  return resp.json(); // { url, path }
}

// =====================================================================
// Llamada al análisis IA via Edge Function
// =====================================================================
export async function analyzeShelfImage(file) {
  const base = import.meta.env.VITE_AI_PROXY_URL;
  if (!base) throw new Error('VITE_AI_PROXY_URL no configurado');

  // Support both full URL and base-only URL
  const proxyUrl = base.endsWith('/analyze-shelf') ? base : `${base.replace(/\/$/, '')}/analyze-shelf`;

  const b64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(new Error('Error al leer la imagen'));
    r.readAsDataURL(file);
  });

  const { data: { session } } = await supabase.auth.getSession();
  const resp = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({ image: b64, mimeType: file.type || 'image/jpeg' }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Análisis IA falló (${resp.status}): ${text.slice(0, 120)}`);
  }
  return resp.json();
}

// ── Análisis de inventario con IA ─────────────────────────────────────────
// Envía múltiples fotos a analyze-shelf en modo 'inventory',
// acumula y promedia los conteos entre fotos.
export async function analyzeInventoryPhotos(files) {
  if (!files || files.length === 0) throw new Error('No hay fotos para analizar');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-shelf`;
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` } : {};

  // Resultados acumulados por SKU
  const accumulated = {}; // { sku: { total: number, count: number } }

  for (const file of files) {
    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = () => res(reader.result.split(',')[1]);
      reader.onerror = () => rej(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });

    const mimeType = file.type || 'image/jpeg';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, ...authHeader },
      body: JSON.stringify({ image: base64, mimeType, mode: 'inventory' }),
    });

    if (!resp.ok) continue; // Silently skip failed photos

    const result = await resp.json();
    if (!Array.isArray(result.items)) continue;

    for (const item of result.items) {
      if (!item.sku || item.qty == null || item.qty <= 0) continue;
      if (!accumulated[item.sku]) accumulated[item.sku] = { total: 0, count: 0 };
      accumulated[item.sku].total += item.qty;
      accumulated[item.sku].count += 1;
    }
  }

  // Convertir a array sumando todos (no promediando — múltiples fotos pueden mostrar distintas zonas)
  const items = Object.entries(accumulated).map(([sku, { total }]) => ({
    sku,
    qty: Math.round(total), // suma de todas las fotos
  }));

  return items; // [{ sku, qty }]
}

// ── Análisis de PRECIOS con IA — múltiples fotos ─────────────────────────
// Envía cada foto a analyze-shelf en modo 'prices', acumula por SKU
// (última foto gana si el mismo SKU aparece en varias)
export async function analyzePricePhotos(files) {
  if (!files || files.length === 0) throw new Error('No hay fotos para analizar');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-shelf`;
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` } : {};

  const priceMap = {}; // { sku: price }

  for (const file of files) {
    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = () => res(reader.result.split(',')[1]);
      reader.onerror = () => rej(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...authHeader,
      },
      body: JSON.stringify({
        image: base64,
        mimeType: file.type || 'image/jpeg',
        mode: 'prices',
      }),
    });

    if (!resp.ok) continue;
    const result = await resp.json();
    if (!Array.isArray(result.items)) continue;

    for (const item of result.items) {
      if (item.sku && item.price != null && item.price > 0) {
        priceMap[item.sku] = item.price; // última foto gana
      }
    }
  }

  return Object.entries(priceMap).map(([sku, price]) => ({ sku, price }));
}
