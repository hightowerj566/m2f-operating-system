// Accept an invitation: creates the auth user (email pre-confirmed) with the
// invited email and provided password, assigns the invited role, and links
// the client to the inviting coach when applicable.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, password, display_name } = await req.json();
    if (!token || typeof token !== "string") return json({ error: "Missing token" }, 400);
    if (!password || String(password).length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    const { data: invite, error: inviteErr } = await admin
      .from("client_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (inviteErr || !invite) return json({ error: "Invalid invitation" }, 404);
    if (invite.accepted_at) return json({ error: "Invitation already used" }, 410);
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return json({ error: "Invitation expired" }, 410);
    }

    // Create the auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name || invite.first_name || invite.email.split("@")[0],
      },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "Could not create account" }, 500);
    }
    const newUserId = created.user.id;

    // Assign invited role (+ client role so app access works)
    const rolesToInsert: { user_id: string; role: string }[] = [
      { user_id: newUserId, role: invite.role },
    ];
    if (invite.role !== "client") {
      rolesToInsert.push({ user_id: newUserId, role: "client" });
    }
    await admin.from("user_roles").upsert(rolesToInsert, { onConflict: "user_id,role" });

    // Link to coach
    if (invite.assigned_coach_id) {
      await admin
        .from("profiles")
        .update({ assigned_coach_id: invite.assigned_coach_id })
        .eq("user_id", newUserId);
    }

    // Mark invitation accepted
    await admin
      .from("client_invitations")
      .update({ accepted_at: new Date().toISOString(), accepted_by: newUserId })
      .eq("id", invite.id);

    return json({ ok: true, email: invite.email });
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
