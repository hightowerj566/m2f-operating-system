// M2F OS · Resolves the current member's Programs view.
// Reads profile + active coach assignment from Supabase, then hands off to
// the pure `resolveJourney` engine so all logic stays testable.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveJourney, type CoachAssignmentInput } from "@/lib/programJourney";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useMemberProgram(userId: string | undefined) {
  return useQuery({
    queryKey: ["member-program", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: profile } = await db
        .from("profiles")
        .select("due_date, baby_arrived_at")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: assignment } = await db
        .from("program_assignments")
        .select("id, program_id, current_day, assigned_at, assigned_by")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      let coach: CoachAssignmentInput | null = null;
      if (assignment) {
        const { data: prog } = await db
          .from("programs")
          .select("name, total_days")
          .eq("id", assignment.program_id)
          .maybeSingle();

        // Coach lane only counts when the program was assigned by someone other
        // than the user themselves (the auto-enrollment sets a real coach id).
        // Even then, the journey resolver still prefers guided when a due date
        // or newborn age is set.
        coach = {
          programId: assignment.program_id,
          programName: prog?.name ?? "Assigned Program",
          currentDay: assignment.current_day ?? 1,
          totalDays: prog?.total_days ?? 84,
          assignedAt: assignment.assigned_at ?? new Date().toISOString(),
          assignedByCoachName: null,
        };
      }

      const input = {
        dueDate: profile?.due_date ?? null,
        babyArrivedAt: profile?.baby_arrived_at ?? null,
        coachAssignment: coach,
      };
      return {
        ...resolveJourney(input),
        flagshipDay: getFlagshipJourneyDay(input),
      };
    },
  });
}
