// Create a one-time invitation. Callable by coaches (client only) or admins (any role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Not authenticated" }, 401);
    const caller = userRes.user;

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const firstName = body.first_name ? String(body.first_name).trim() : null;
    const role = String(body.role || "client");
    const assignedCoachId = body.assigned_coach_id ?? null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Valid email required" }, 400);
    }
    if (!["client", "coach", "admin"].includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }

    const admin = createClient(url, serviceKey);

    // Verify caller privileges
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
    const isAdmin = roleSet.has("admin");
    const isCoach = roleSet.has("coach");
    if (!isAdmin && !isCoach) return json({ error: "Forbidden" }, 403);
    if (!isAdmin && role !== "client") return json({ error: "Only admins can invite this role" }, 403);

    // If email already belongs to a user, block re-invite
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    // Better: query auth.users via SQL for exact match
    const { data: existingUser } = await admin
      .rpc("get_user_by_email", { _email: email })
      .maybeSingle()
      .then(() => ({ data: null }))
      .catch(() => ({ data: null }));
    // fallback: direct search
    const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authList?.users?.some((u) => u.email?.toLowerCase() === email)) {
      return json({ error: "A user with this email already exists" }, 409);
    }

    // Generate secure token
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    const coachId = role === "client"
      ? (assignedCoachId ?? (isCoach ? caller.id : null))
      : null;

    const { data: invite, error: insertErr } = await admin
      .from("client_invitations")
      .insert({
        email,
        first_name: firstName,
        role,
        token,
        invited_by: caller.id,
        assigned_coach_id: coachId,
      })
      .select()
      .single();
    if (insertErr) return json({ error: insertErr.message }, 500);

    // Build absolute URL if origin present
    const origin = req.headers.get("origin") || "";
    const invite_url = origin ? `${origin}/auth?invite=${token}` : `/auth?invite=${token}`;

    return json({ invitation: invite, invite_url });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
