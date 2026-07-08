import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  // Service-role client to write to user_subscriptions (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing stripe-signature header", {
        headers: corsHeaders,
        status: 400,
      });
    }

    const event: Stripe.Event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    logStep("Webhook verified", { type: event.type });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const productId = sub.items.data[0]?.price?.product as string | undefined;

        logStep("Subscription event", { customerId, status: sub.status, productId });

        // Resolve user_id from customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) {
          logStep("Customer has no email, skipping DB write");
          break;
        }

        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const matchedUser = users?.users?.find((u) => u.email === customer.email);
        if (!matchedUser) {
          logStep("No matching Supabase user found", { email: customer.email });
          break;
        }

        let periodEnd: string | null = null;
        try {
          const endVal = sub.current_period_end;
          if (typeof endVal === "number") periodEnd = new Date(endVal * 1000).toISOString();
          else if (typeof endVal === "string") periodEnd = new Date(endVal).toISOString();
        } catch { /* ignore */ }

        const { error: upsertError } = await supabaseAdmin
          .from("user_subscriptions")
          .upsert(
            {
              user_id: matchedUser.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              status: sub.status,
              product_id: productId ?? null,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription upserted", { userId: matchedUser.id, status: sub.status });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Subscription canceled", { subscriptionId: sub.id, status: sub.status });

        const { error: updateError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);

        if (updateError) {
          logStep("Error updating canceled subscription", { error: updateError.message });
        } else {
          logStep("Subscription marked canceled in DB");
        }
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    console.error("[STRIPE-WEBHOOK] ERROR:", msg);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
