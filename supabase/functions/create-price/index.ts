import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_ID = "prod_U1WDBNEi6LXfHx";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    const userId = userData.user.id;

    // Verify coach role
    const { data: isCoach } = await supabaseClient.rpc("has_role", { _user_id: userId, _role: "coach" });
    if (!isCoach) throw new Error("Only coaches can set subscription pricing");

    const { amount_cents } = await req.json();
    if (!amount_cents || amount_cents < 100) throw new Error("Amount must be at least $1.00");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create new price on the existing product
    const price = await stripe.prices.create({
      product: PRODUCT_ID,
      unit_amount: amount_cents,
      currency: "usd",
      recurring: { interval: "month" },
    });

    // Upsert subscription_settings
    const { data: existing } = await supabaseClient
      .from("subscription_settings")
      .select("id")
      .eq("coach_id", userId)
      .limit(1)
      .single();

    if (existing) {
      await supabaseClient.from("subscription_settings").update({
        stripe_price_id: price.id,
        stripe_product_id: PRODUCT_ID,
        amount_cents: amount_cents,
      }).eq("id", existing.id);
    } else {
      await supabaseClient.from("subscription_settings").insert({
        coach_id: userId,
        stripe_price_id: price.id,
        stripe_product_id: PRODUCT_ID,
        amount_cents: amount_cents,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      price_id: price.id,
      amount_cents 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CREATE-PRICE] ERROR:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
