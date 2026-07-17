import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    // Verify caller is a coach using anon client (respects RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "coach")
      .maybeSingle();

    if (!roleData) throw new Error("Not authorized — coach role required");

    // Use service role to look up this coach's assigned client emails
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all user_ids assigned to this coach
    const { data: assignments, error: assignErr } = await serviceClient
      .from("program_assignments")
      .select("user_id")
      .eq("assigned_by", userData.user.id);

    if (assignErr) throw new Error("Failed to fetch assignments");

    const clientUserIds = [...new Set((assignments ?? []).map((a: any) => a.user_id))];

    if (clientUserIds.length === 0) {
      return new Response(JSON.stringify({ subscriptions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve emails for assigned clients
    const { data: usersData, error: usersErr } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw new Error("Failed to list users");

    const clientIdSet = new Set(clientUserIds);
    const clientEmails = new Set(
      (usersData?.users ?? [])
        .filter((u: any) => clientIdSet.has(u.id) && u.email)
        .map((u: any) => u.email!.toLowerCase())
    );

    if (clientEmails.size === 0) {
      return new Response(JSON.stringify({ subscriptions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all active + trialing subscriptions (paginate up to 200)
    const allSubs: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore && allSubs.length < 200) {
      const params: any = { status: "active", limit: 100, expand: ["data.customer"] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      allSubs.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Also get trialing
    hasMore = true;
    startingAfter = undefined;
    while (hasMore && allSubs.length < 300) {
      const params: any = { status: "trialing", limit: 100, expand: ["data.customer"] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      allSubs.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Filter to only this coach's assigned clients
    const scopedSubs = allSubs.filter((sub) => {
      const customer = sub.customer as any;
      const email = customer?.email?.toLowerCase();
      return email && clientEmails.has(email);
    });

    const subscriptions = scopedSubs.map((sub) => {
      const customer = sub.customer as any;
      const item = sub.items.data[0];
      const price = item?.price;
      const interval = price?.recurring?.interval ?? "unknown";
      const productId = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;

      let periodEnd: string | null = null;
      try {
        const endVal = sub.current_period_end;
        periodEnd = typeof endVal === "number"
          ? new Date(endVal * 1000).toISOString()
          : typeof endVal === "string"
          ? new Date(endVal).toISOString()
          : null;
      } catch { /* ignore */ }

      return {
        subscription_id: sub.id,
        status: sub.status,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        customer_email: customer?.email ?? null,
        customer_name: customer?.name ?? null,
        product_id: productId,
        interval,
        amount_cents: price?.unit_amount ?? null,
        currency: price?.currency ?? "usd",
        current_period_end: periodEnd,
        created: new Date(sub.created * 1000).toISOString(),
      };
    });

    return new Response(JSON.stringify({ subscriptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[LIST-SUBSCRIPTIONS] ERROR:", msg);
    // Return 200 with fallback so the coach dashboard renders instead of crashing.
    return new Response(
      JSON.stringify({ subscriptions: [], error: msg, fallback: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
