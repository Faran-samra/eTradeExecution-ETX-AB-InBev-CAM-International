// Edge Function: bootstrap-seed
// Crea las cuentas demo iniciales (admin, supervisores, GVMs) la PRIMERA vez.
// Solo puede ejecutarse si no hay ningún usuario en auth.users.
//
// Llamar UNA SOLA VEZ tras hacer deploy:
//   curl -X POST https://TU-PROYECTO.supabase.co/functions/v1/bootstrap-seed \
//        -H "apikey: TU_ANON_KEY"

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SEED_USERS = [
  { username: "admin",   email: "admin@abinbev.local",         password: "admin",  name: "Administrador",   role: "admin",      country: null, initials: "AD", color: "#26303A" },
  { username: "sup.ve",  email: "supervisor.ve@abinbev.local", password: "1234",  name: "María González",   role: "supervisor", country: "VE", initials: "MG", color: "#2C4256" },
  { username: "sup.pa",  email: "supervisor.pa@abinbev.local", password: "1234",  name: "Roberto Castillo", role: "supervisor", country: "PA", initials: "RC", color: "#2C4256" },
  { username: "sup.cr",  email: "supervisor.cr@abinbev.local", password: "1234",  name: "Andrea Solís",     role: "supervisor", country: "CR", initials: "AS", color: "#2C4256" },
  { username: "sup.gt",  email: "supervisor.gt@abinbev.local", password: "1234",  name: "Diego Morales",    role: "supervisor", country: "GT", initials: "DM", color: "#2C4256" },
  { username: "sup.hn",  email: "supervisor.hn@abinbev.local", password: "1234",  name: "Patricia Reyes",   role: "supervisor", country: "HN", initials: "PR", color: "#2C4256" },
  { username: "sup.sv",  email: "supervisor.sv@abinbev.local", password: "1234",  name: "Jorge Aguilar",    role: "supervisor", country: "SV", initials: "JA", color: "#2C4256" },
  { username: "eduardo", email: "eduardo.mendez@abinbev.local",password: "1234",  name: "Eduardo Méndez",   role: "gvm",        country: "VE", initials: "EM", color: "#C68A12", planned: 8 },
  { username: "carlos",  email: "carlos.vargas@abinbev.local", password: "1234",  name: "Carlos Vargas",    role: "gvm",        country: "PA", initials: "CV", color: "#2A9D63", planned: 6 },
  { username: "carla",   email: "carla.rodriguez@abinbev.local",password: "1234", name: "Carla Rodríguez",  role: "gvm",        country: "CR", initials: "CR", color: "#3E84C4", planned: 6 },
  { username: "jose",    email: "jose.pineda@abinbev.local",   password: "1234",  name: "José Pineda",      role: "gvm",        country: "GT", initials: "JP", color: "#D8443C", planned: 7 },
  { username: "maria",   email: "maria.lainez@abinbev.local",  password: "1234",  name: "María Lainez",     role: "gvm",        country: "HN", initials: "ML", color: "#2C4256", planned: 5 },
  { username: "luis",    email: "luis.bonilla@abinbev.local",  password: "1234",  name: "Luis Bonilla",     role: "gvm",        country: "SV", initials: "LB", color: "#A2700B", planned: 4 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verificar que no hay usuarios aún
  const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
  if ((count || 0) > 0) {
    return new Response(JSON.stringify({ error: "Ya existen usuarios. El bootstrap solo puede ejecutarse en BD vacía." }), {
      status: 403, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const results = [];
  for (const u of SEED_USERS) {
    try {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (error) { results.push({ username: u.username, error: error.message }); continue; }

      const profile = {
        id: created.user.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        country: u.country,
        initials: u.initials,
        color: u.color,
        planned: u.planned ?? 0,
      };
      const { error: pErr } = await admin.from("profiles").insert(profile);
      if (pErr) { results.push({ username: u.username, error: pErr.message }); continue; }

      results.push({ username: u.username, ok: true, id: created.user.id });
    } catch (e) {
      results.push({ username: u.username, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ created: results }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
