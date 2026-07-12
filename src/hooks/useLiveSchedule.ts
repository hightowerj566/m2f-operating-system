// Live-schedule data hook. RLS already hides future/out-of-window weeks for
// members, so the client can trust what it receives — but we still compute the
// current week and accessible range locally for the UI.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ScheduledWeek = {
  id: string;
  assignment_id: string;
  display_week_number: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  unlock_at: string; // ISO
  publish_status: "draft" | "published";
  access_status: "locked" | "unlocked" | "completed";
  coach_notes: string | null;
  member_notes: string | null;
  source_day_start: number | null;
  source_day_end: number | null;
};

export type LiveAssignment = {
  id: string;
  user_id: string;
  program_id: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  member_timezone: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "ended";
  paused_at: string | null;
  program: { id: string; name: string; total_days: number; uses_live_schedule: boolean };
};

export function useLiveSchedule() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["live-schedule", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("program_assignments")
        .select("*, program:programs!inner(id,name,total_days,uses_live_schedule)")
        .eq("user_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;

      const live = (assignments ?? []).find(
        (a: any) => a.program?.uses_live_schedule
      ) as LiveAssignment | undefined;
      if (!live) return { assignment: null, weeks: [] as ScheduledWeek[] };

      const { data: weeks, error: wErr } = await supabase
        .from("scheduled_program_weeks")
        .select("*")
        .eq("assignment_id", live.id)
        .order("display_week_number", { ascending: true });
      if (wErr) throw wErr;

      return {
        assignment: live,
        weeks: (weeks ?? []) as ScheduledWeek[],
      };
    },
  });
}

// The current week is the highest-numbered week whose unlock_at <= now().
export function currentWeekNumber(weeks: ScheduledWeek[]): number | null {
  const now = Date.now();
  const unlocked = weeks.filter((w) => new Date(w.unlock_at).getTime() <= now);
  if (!unlocked.length) return null;
  return Math.max(...unlocked.map((w) => w.display_week_number));
}

// Members can browse [current-4 .. current]. Everything else is either locked
// (future) or hidden (older history — RLS strips it too).
export function accessibleRange(weeks: ScheduledWeek[]) {
  const cur = currentWeekNumber(weeks);
  if (cur == null) return { min: null, max: null };
  return { min: Math.max(1, cur - 4), max: cur };
}
