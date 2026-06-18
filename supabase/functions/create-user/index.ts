// Edge Function: create-user
// Crea un nuevo usuario en auth.users + profiles validando permisos del caller.
// Reglas:
//   - Admin: puede crear cualquier rol/país
//   - Supervisor: solo puede crear GVMs en su mismo país
//   - GVM: no puede crear nada
//
// Deploy: supabase functions deploy create-user
// Variables requeridas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (autoconfiguradas por Supabase)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Cliente autenticado como el caller (para resolver quién es)
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Resolver perfil del caller
    const { data: callerProfile } = await callerClient
      .from("profiles").select("*").eq("id", caller.id).single();
    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { email, password, profile } = await req.json();
    if (!email || !password || !profile?.role) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // === Validación de permisos ===
    if (callerProfile.role === "gvm") {
      return new Response(JSON.stringify({ error: "Sin permisos para crear usuarios" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (callerProfile.role === "supervisor") {
      if (profile.role !== "gvm") {
        return new Response(JSON.stringify({ error: "Supervisor solo puede crear GVMs" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      if (profile.country !== callerProfile.country) {
        return new Response(JSON.stringify({ error: "Supervisor solo puede crear usuarios en su mismo país" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }
    // Admin: sin restricciones

    // Cliente admin (service_role) para crear el auth.user
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: created, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // auto-confirmar email para entorno corporativo
    });
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Insertar perfil extendido
    const profileRow = {
      id: created.user.id,
      ...profile,
      email: email.toLowerCase(),
    };
    const { error: profileError } = await adminClient.from("profiles").insert(profileRow);
    if (profileError) {
      // rollback: borrar auth user
      await adminClient.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: profileRow }), {
      status: 201, headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Error desconocido" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
