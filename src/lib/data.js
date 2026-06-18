import { supabase } from './supabase.js';
import { enqueueOperation } from './offline.js';

// Pairs an offline survey with its items before flushing to IndexedDB
const _offlineSurveyBuf = new Map();

// =====================================================================
// CATÁLOGO DE PDVs
// =====================================================================
export async function fetchPdvs({ country = null, assignedTo = undefined } = {}) {
  let q = supabase.from('pdvs').select('*').order('order', { ascending: true });
  if (country) q = q.eq('country', country);
  if (assignedTo !== undefined) {
    if (assignedTo === null) q = q.is('assigned_to', null);
    else q = q.eq('assigned_to', assignedTo);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function assignPdv(pdvId, gvmId, order) {
  const { error } = await supabase
    .from('pdvs')
    .update({ assigned_to: gvmId, order: order ?? 0 })
    .eq('id', pdvId);
  if (error) throw error;
}

export async function unassignPdv(pdvId) {
  const { error } = await supabase
    .from('pdvs')
    .update({ assigned_to: null, order: 0 })
    .eq('id', pdvId);
  if (error) throw error;
}

export async function deletePdv(pdvId) {
  const { error } = await supabase.from('pdvs').delete().eq('id', pdvId);
  if (error) throw error;
}

export async function bulkUpsertPdvs(pdvs) {
  const { error } = await supabase.from('pdvs').upsert(pdvs, { onConflict: 'id' });
  if (error) throw error;
}

// =====================================================================
// USUARIOS / PROFILES
// =====================================================================
export async function fetchProfiles({ role = null, country = null } = {}) {
  let q = supabase.from('profiles').select('*').order('name', { ascending: true });
  if (role) q = q.eq('role', role);
  if (country) q = q.eq('country', country);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createUserAccount({ email, password, profile }) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password, profile }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || 'No se pudo crear el usuario');
  return json;
}

export async function updateProfile(id, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteUserAccount(id) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ userId: id }),
  });
  if (!resp.ok) {
    const json = await resp.json();
    throw new Error(json.error || 'No se pudo eliminar');
  }
}

// =====================================================================
// LEVANTAMIENTOS (surveys)
// =====================================================================
export async function createSurvey(survey) {
  if (!navigator.onLine) {
    const tempId = `offline_sv_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    _offlineSurveyBuf.set(tempId, { survey, items: [] });
    // Safety flush if no items/photo call follows within 2s
    setTimeout(() => _flushOfflineSurvey(tempId), 2000);
    return { id: tempId, ...survey };
  }
  const { data, error } = await supabase.from('surveys').insert(survey).select().single();
  if (error) throw error;
  return data;
}

async function _flushOfflineSurvey(tempId) {
  const entry = _offlineSurveyBuf.get(tempId);
  if (!entry) return;
  _offlineSurveyBuf.delete(tempId);
  await enqueueOperation({ type: 'survey', survey: entry.survey, items: entry.items });
}

export async function fetchSurveys({ pdvId, gvmId, country, limit = 500 } = {}) {
  let q = supabase
    .from('surveys')
    .select('*, photos:survey_photos(*), items:survey_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (pdvId) q = q.eq('pdv_id', pdvId);
  if (gvmId) q = q.eq('created_by', gvmId);
  if (country) q = q.eq('country', country);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// =====================================================================
// SURVEY ITEMS & PHOTOS
// =====================================================================
export async function createSurveyItems(items) {
  if (!items || items.length === 0) return;

  if (!navigator.onLine) {
    const surveyId = items[0]?.survey_id;
    if (surveyId && _offlineSurveyBuf.has(surveyId)) {
      const entry = _offlineSurveyBuf.get(surveyId);
      // Strip survey_id from items — will be re-attached after sync creates the real survey
      entry.items = items.map(({ survey_id: _id, ...rest }) => rest);
      // Items are now paired; flush triggered by createSurveyPhoto or timeout
    }
    return;
  }
  const { error } = await supabase.from('survey_items').insert(items);
  if (error) throw error;
}

export async function createSurveyPhoto({ survey_id, url, path = null }) {
  if (!navigator.onLine) {
    // When offline we can't upload storage; flush the buffered survey without photo
    if (_offlineSurveyBuf.has(survey_id)) {
      await _flushOfflineSurvey(survey_id);
    }
    return;
  }
  const { error } = await supabase.from('survey_photos').insert({ survey_id, url, path });
  if (error) throw error;
}

export async function updatePdvStatus(pdvId, status) {
  const { error } = await supabase.from('pdvs').update({ status }).eq('id', pdvId);
  if (error) throw error;
}

// =====================================================================
// CHECK-INS
// =====================================================================
export async function createCheckin({ pdvId, lat, lng, distanceMeters, photoUrl }) {
  if (!navigator.onLine) {
    const tempId = `offline_ci_${Date.now()}`;
    await enqueueOperation({ type: 'checkin', data: { pdvId, lat, lng, distanceMeters } });
    return { id: tempId, pdv_id: pdvId };
  }
  const { data, error } = await supabase.from('checkins').insert({
    pdv_id: pdvId,
    lat, lng,
    distance_meters: distanceMeters,
    photo_url: photoUrl,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchCheckins({ limit = 500 } = {}) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// =====================================================================
// APROBACIÓN DE NUEVAS TIENDAS — persistir PDV en Supabase
// =====================================================================
export async function createPdv(pdv) {
  const { data, error } = await supabase.from('pdvs').insert({
    id:          pdv.id,
    name:        pdv.name,
    cat:         pdv.cat    || null,
    channel:     pdv.channel || 'Off-trade',
    dist:        pdv.dist   || null,
    addr:        pdv.addr   || null,
    lat:         pdv.lat    || 0,
    lng:         pdv.lng    || 0,
    status:      'pending',
    order:       0,
    country:     pdv.country,
    assigned_to: pdv.assigned_to || null,
  }).select().single();
  if (error) throw error;
  return data;
}

// =====================================================================
// CHECK-OUT — cerrar visita formalmente
// =====================================================================
export async function checkoutPdv(pdvId) {
  const { error } = await supabase
    .from('pdvs')
    .update({ status: 'done' })
    .eq('id', pdvId);
  if (error) throw error;
}
