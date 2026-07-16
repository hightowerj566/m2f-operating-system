import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_current_program_week",
  title: "Get current training program week",
  description:
    "Return the signed-in user's active live-schedule training program (Forge or Rebuild) and the currently unlocked week.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const db = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: assignment, error } = await db
      .from("program_assignments")
      .select("id, program_id, status, start_date, member_timezone, programs(name, uses_live_schedule)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!assignment) {
      return { content: [{ type: "text", text: "No active program." }], structuredContent: { assignment: null } };
    }

    const nowIso = new Date().toISOString();
    const { data: weeks } = await db
      .from("scheduled_program_weeks")
      .select("id, week_number, unlock_at, publish_status")
      .eq("assignment_id", assignment.id)
      .lte("unlock_at", nowIso)
      .order("week_number", { ascending: false })
      .limit(1);

    const current = weeks?.[0] ?? null;
    return {
      content: [
        { type: "text", text: JSON.stringify({ assignment, current_week: current }, null, 2) },
      ],
      structuredContent: { assignment, current_week: current },
    };
  },
});
