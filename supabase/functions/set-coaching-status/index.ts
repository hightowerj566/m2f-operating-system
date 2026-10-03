// Coach/admin sets a client's 1:1 coaching status. Admins: any client.
// Coaches: their assigned clients, or unassigned clients (Start claims them).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import { z } from "npm:zod@3.23.8";

const Body = z.object({
  client_id: z.string().uuid(),
  status: z.enum(["active", "paused", "ended"]),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u, error: uErr } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (uErr || !u.user) return json({ error: "Unauthorized" }, 401);
    const callerId = u.user.id;

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { client_id, status } = parsed.data;

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const r = new Set((roles ?? []).map((x) => x.role));
    const isAdmin = r.has("admin");
    if (!isAdmin && !r.has("coach")) return json({ error: "Forbidden" }, 403);

    const { data: prof } = await admin.from("profiles")
      .select("assigned_coach_id, coaching_status, coaching_started_at").eq("user_id", client_id).maybeSingle();
    if (!prof) return json({ error: "Client not found" }, 404);
    if (!isAdmin && prof.assigned_coach_id && prof.assigned_coach_id !== callerId) {
      return json({ error: "Not your client" }, 403);
    }
    if (!isAdmin && !prof.assigned_coach_id && status !== "active") {
      return json({ error: "Not your client" }, 403);
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { coaching_status: status, coaching_status_changed_at: now };
    if (status === "active") {
      if (prof.coaching_status !== "active" && prof.coaching_status !== "paused") patch.coaching_started_at = now;
      if (!prof.assigned_coach_id) patch.assigned_coach_id = callerId;
    }
    const { error } = await admin.from("profiles").update(patch).eq("user_id", client_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, status });
  } catch (e) {
    console.error("[set-coaching-status]", e);
    return json({ error: "An internal error occurred" }, 500);
  }
});
