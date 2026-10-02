import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    // Server-side allowlist of valid Stripe price IDs
    const DUE_DATE_PASS_PRICE_ID = Deno.env.get("DUE_DATE_PASS_PRICE_ID") ?? "";
    const ALLOWED_PRICE_IDS = new Set([
      "price_1T7DuEPukXMAfKKB4fC1yaLQ", // base monthly
      "price_1T7DvDPukXMAfKKBsnu28EIT", // base yearly
      "price_1T7DvWPukXMAfKKBWrAwIzDM", // performance monthly
      "price_1T7E6QPukXMAfKKBTuZzIUhY", // performance yearly
    ]);
    if (DUE_DATE_PASS_PRICE_ID) ALLOWED_PRICE_IDS.add(DUE_DATE_PASS_PRICE_ID);

    const stripeKey = (Deno.env.get("STRIPE_TEST_API_KEY") || Deno.env.get("STRIPE_SECRET_KEY"));
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.json().catch(() => ({}));
    let priceId: string | undefined = body.price_id;
    if (body.plan === "monthly" || body.plan === "annual") {
      priceId = await resolveMembershipPrice(stripe, body.plan);
    } else {
      if (!priceId) throw new Error("price_id or plan is required");
      if (!ALLOWED_PRICE_IDS.has(priceId)) throw new Error("Invalid price_id");
    }
    const isDueDatePass = DUE_DATE_PASS_PRICE_ID !== "" && priceId === DUE_DATE_PASS_PRICE_ID;
    logStep("Price resolved", { priceId, isDueDatePass });

    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isDueDatePass ? "payment" : "subscription",
      allow_promotion_codes: true,
      ...(isDueDatePass
        ? { metadata: { m2f_sku: "due_date_pass", user_id: userData.user.id } }
        : { subscription_data: { trial_period_days: 7 } }),
      success_url: `${origin}/?${isDueDatePass ? "pass" : "subscribed"}=true`,
      cancel_url: `${origin}/`,
    });

    logStep("Checkout session created", { sessionId: session.id });
    return new Response(JSON.stringify({ url: session.url }), {
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

// Membership prices are found by lookup key and created on first use, so no IDs are hardcoded.
const MEMBERSHIP_PRICES = {
  monthly: { lookup_key: "m2f_membership_monthly_2999", unit_amount: 2999, interval: "month" as const },
  annual: { lookup_key: "m2f_membership_annual_29988", unit_amount: 29988, interval: "year" as const },
};

async function resolveMembershipPrice(stripe: Stripe, plan: "monthly" | "annual"): Promise<string> {
  const cfg = MEMBERSHIP_PRICES[plan];
  const found = await stripe.prices.list({ lookup_keys: [cfg.lookup_key], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;

  const products = await stripe.products.search({ query: "metadata['m2f_sku']:'membership'" }).catch(() => ({ data: [] as Stripe.Product[] }));
  const product = products.data[0] ?? await stripe.products.create({ name: "M2F Membership", metadata: { m2f_sku: "membership" } });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: cfg.unit_amount,
    recurring: { interval: cfg.interval },
    lookup_key: cfg.lookup_key,
  });
  return price.id;
}
