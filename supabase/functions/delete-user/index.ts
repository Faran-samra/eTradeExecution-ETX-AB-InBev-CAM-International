// Edge Function: delete-user
// Elimina un usuario (auth + profile) validando permisos del caller.
// Reglas:
//   - Admin: puede eliminar a cualquiera (excepto a sí mismo)
//   - Supervisor: solo puede eliminar GVMs de su país
//   - GVM: no puede eliminar nada

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

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

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await callerClient
      .from("profiles").select("*").eq("id", caller.id).single();

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Falta userId" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: targetProfile } = await adminClient
      .from("profiles").select("*").eq("id", userId).single();
    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Validación de permisos
    if (callerProfile.role === "gvm") {
      return new Response(JSON.stringify({ error: "Sin permisos" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (callerProfile.role === "supervisor") {
      if (targetProfile.role !== "gvm" || targetProfile.country !== callerProfile.country) {
        return new Response(JSON.stringify({ error: "Supervisor solo puede eliminar GVMs de su país" }), {
          status: 403, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    // El perfil se elimina por la cascada (on delete cascade)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Error desconocido" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
