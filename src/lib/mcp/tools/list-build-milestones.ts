import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_build_milestones",
  title: "List Build List milestones",
  description:
    "List the signed-in user's Build List milestones (active tasks) with completion status. Use this to see what fatherhood-prep tasks are active or completed.",
  inputSchema: {
    only_incomplete: z
      .boolean()
      .optional()
      .describe("If true, return only milestones not yet completed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_incomplete }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const db = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: milestones, error: mErr } = await db
      .from("build_milestones")
      .select("id, title, why_it_matters, phase, priority, recommended_week, required, est_minutes, is_active")
      .eq("is_active", true)
      .order("recommended_week", { ascending: true });

    if (mErr) return { content: [{ type: "text", text: mErr.message }], isError: true };

    const { data: completions } = await db
      .from("user_milestones")
      .select("milestone_id, completed_at")
      .eq("user_id", userId);

    const completedMap = new Map((completions ?? []).map((c) => [c.milestone_id, c.completed_at]));
    let rows = (milestones ?? []).map((m) => ({
      ...m,
      completed: completedMap.has(m.id),
      completed_at: completedMap.get(m.id) ?? null,
    }));
    if (only_incomplete) rows = rows.filter((r) => !r.completed);

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { milestones: rows },
    };
  },
});
