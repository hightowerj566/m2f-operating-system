import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_readiness_summary",
  title: "Get Readiness score",
  description:
    "Return the signed-in user's most recent Father Readiness assessment: total score, category scores, and weakest category.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const db = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: assessment, error } = await db
      .from("assessments")
      .select("id, total_score, weakest_category, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!assessment) {
      return {
        content: [{ type: "text", text: "No assessment completed yet." }],
        structuredContent: { assessment: null },
      };
    }

    const { data: categories } = await db
      .from("assessment_category_scores")
      .select("category, score")
      .eq("assessment_id", assessment.id);

    const result = { ...assessment, categories: categories ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { assessment: result },
    };
  },
});
