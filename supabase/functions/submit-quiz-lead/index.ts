import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-\+\(\)]{0,20}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, phone, archetype_type, quiz_answers, source, total_score, category_scores, weakest_category, due_date } = body;

    // Validate required fields
    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.trim().length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    if (cleanPhone && !PHONE_RE.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof archetype_type !== "string" || archetype_type.trim().length === 0 || archetype_type.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid archetype" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Optional Readiness Score payload (M2F OS)
    const cleanTotal = typeof total_score === "number" && total_score >= 0 && total_score <= 70
      ? Math.round(total_score) : null;
    const cleanCategoryScores = category_scores && typeof category_scores === "object"
      ? category_scores : null;
    const cleanWeakest = typeof weakest_category === "string" && weakest_category.length <= 20
      ? weakest_category : null;
    const cleanDueDate = typeof due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(due_date)
      ? due_date : null;

    const { error: dbError } = await supabase.from("father_athlete_leads").insert({
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 255),
      phone: cleanPhone.slice(0, 20),
      archetype_type: archetype_type.trim(),
      quiz_answers: quiz_answers ?? [],
      source: typeof source === "string" ? source.slice(0, 100) : "M2F Readiness Assessment",
      total_score: cleanTotal,
      category_scores: cleanCategoryScores,
      weakest_category: cleanWeakest,
      due_date: cleanDueDate,
    });

    if (dbError) {
      console.error("[SUBMIT-QUIZ-LEAD] DB error:", dbError.message);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SUBMIT-QUIZ-LEAD] Error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
