import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-CLIENT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify caller is a coach or admin
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["coach", "admin"]);
    if (!roles || roles.length === 0) throw new Error("Not authorized — coach role required");
    const isAdmin = roles.some((r: any) => r.role === "admin");
    logStep("Caller verified", { callerId: userData.user.id, isAdmin });

    const { client_user_id } = await req.json();
    if (!client_user_id) throw new Error("client_user_id is required");
    if (client_user_id === userData.user.id) throw new Error("You cannot delete your own account");

    // Scope check: admins can delete anyone; coaches only their assigned clients
    if (!isAdmin) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("assigned_coach_id")
        .eq("user_id", client_user_id)
        .maybeSingle();
      if (!profile || profile.assigned_coach_id !== userData.user.id) {
        throw new Error("Not authorized — this client is not assigned to you");
      }
    }

    // Safety: never delete another coach or admin through this function
    const { data: targetRoles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", client_user_id)
      .in("role", ["coach", "admin"]);
    if (targetRoles && targetRoles.length > 0) {
      throw new Error("Cannot delete a coach or admin account");
    }

    logStep("Deleting user", { client_user_id });
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(client_user_id);
    if (deleteError) throw deleteError;

    logStep("User deleted", { client_user_id });
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    const status = msg.includes("Not authorized") || msg.includes("Not authenticated") ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
