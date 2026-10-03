// Coach/admin: sanitized access + Stripe summary for one client (no card data).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "npm:zod@3.23.8";

const Body = z.object({ client_id: z.string().uuid() });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const iso = (n?: number | null) => (typeof n === "number" ? new Date(n * 1000).toISOString() : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid client_id" }, 400);
    const { client_id } = parsed.data;

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    const r = new Set((roles ?? []).map((x) => x.role));
    const isAdmin = r.has("admin");
    if (!isAdmin && !r.has("coach")) return json({ error: "Forbidden" }, 403);

    const { data: prof } = await admin.from("profiles")
      .select("assigned_coach_id, coaching_status, coaching_started_at").eq("user_id", client_id).maybeSingle();
    if (!prof) return json({ error: "Client not found" }, 404);
    if (!isAdmin && prof.assigned_coach_id && prof.assigned_coach_id !== u.user.id) return json({ error: "Forbidden" }, 403);

    const { data: clientRoles } = await admin.from("user_roles").select("role").eq("user_id", client_id);
    const clientIsStaff = (clientRoles ?? []).some((x) => x.role === "coach" || x.role === "admin");

    let coachName: string | null = null;
    if (prof.assigned_coach_id) {
      const { data: c } = await admin.from("profiles").select("display_name").eq("user_id", prof.assigned_coach_id).maybeSingle();
      coachName = c?.display_name ?? null;
    }

    let subscription: Record<string, unknown> | null = null;
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    const { data: target } = await admin.auth.admin.getUserById(client_id);
    const email = target?.user?.email;
    if (key && email) {
      const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
      const cust = await stripe.customers.list({ email, limit: 1 });
      if (cust.data[0]) {
        const subs = await stripe.subscriptions.list({ customer: cust.data[0].id, status: "all", limit: 10 });
        const order = ["active", "trialing", "past_due", "unpaid", "canceled"];
        const sub = [...subs.data].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))[0];
        if (sub) {
          const item = sub.items.data[0];
          const price = item?.price;
          subscription = {
            status: sub.status,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            interval: price?.recurring?.interval ?? null,
            amount_cents: price?.unit_amount ?? null,
            currency: price?.currency ?? "usd",
            started_at: iso(sub.start_date),
            trial_end: iso(sub.trial_end),
            current_period_end: iso((sub as any).current_period_end ?? (item as any)?.current_period_end),
          };
        }
      }
    }

    return json({
      coaching_status: prof.coaching_status,
      coaching_started_at: prof.coaching_started_at,
      coach_name: coachName,
      is_staff: clientIsStaff,
      subscription,
    });
  } catch (e) {
    console.error("[client-access-details]", e);
    return json({ error: "An internal error occurred" }, 500);
  }
});
