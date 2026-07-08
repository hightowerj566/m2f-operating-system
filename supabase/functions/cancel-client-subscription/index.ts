import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-CLIENT-SUB] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Verify caller is a coach
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "coach")
      .maybeSingle();

    if (!roleData) throw new Error("Not authorized — coach role required");
    logStep("Coach verified", { coachId: userData.user.id });

    // Get subscription_id from request body
    const { subscription_id } = await req.json();
    if (!subscription_id) throw new Error("subscription_id is required");
    logStep("Cancelling subscription", { subscription_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the subscription to get the customer email
    const subscription = await stripe.subscriptions.retrieve(subscription_id, {
      expand: ["customer"],
    });
    const customer = subscription.customer as any;
    const customerEmail = customer?.email;
    if (!customerEmail) throw new Error("Could not determine customer email for subscription");
    logStep("Subscription customer resolved", { customerEmail });

    // Use service role to check if this customer is an assigned client of the coach
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Look up the user by email
    const { data: targetUser, error: targetErr } = await serviceClient.auth.admin.listUsers();
    const matchedUser = targetUser?.users?.find((u: any) => u.email === customerEmail);
    if (!matchedUser) throw new Error("No user found for subscription customer");

    // Verify this coach has an active program assignment for this client
    const { data: assignment } = await serviceClient
      .from("program_assignments")
      .select("id")
      .eq("user_id", matchedUser.id)
      .eq("assigned_by", userData.user.id)
      .limit(1)
      .maybeSingle();

    if (!assignment) {
      logStep("Scope check failed — client not assigned to this coach", {
        coachId: userData.user.id,
        clientId: matchedUser.id,
      });
      throw new Error("Not authorized — this client is not assigned to you");
    }
    logStep("Scope check passed", { clientId: matchedUser.id });

    // Cancel at end of billing period
    const updated = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
    });

    logStep("Subscription set to cancel at period end", { subscriptionId: updated.id });

    let cancelAt: string | null = null;
    try {
      const endVal = updated.current_period_end;
      if (typeof endVal === "number") {
        cancelAt = new Date(endVal * 1000).toISOString();
      } else if (typeof endVal === "string") {
        cancelAt = new Date(endVal).toISOString();
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({
      success: true,
      cancel_at: cancelAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
