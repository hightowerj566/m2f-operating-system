// M2F OS · Program track resolver.
// Pure decision of which "lane" the member's Workout tab should render:
//   1. An active, non-flagship coach-assigned program.
//   2. The due-date / baby-arrival-driven flagship Guided Journey — no
//      program_assignments row is required, and a flagship assignment row
//      (if one happens to exist) is never treated as a coach override.
//   3. Nothing yet (needs a due date and has no coach assignment).
// No Supabase calls here — callers resolve the assignment + isFlagshipProgram
// check first, so this stays trivially testable.

export interface ProgramAssignmentInput {
  id: string;
  program_id: string;
  current_day: number | null;
}

export interface ProgramTrackInput {
  assignment: ProgramAssignmentInput | null;
  /** Whether `assignment.program_id` (when present) is the flagship program. */
  assignmentIsFlagship: boolean;
  /** Whether the member has a due_date or baby_arrived_at set. */
  hasJourneyDate: boolean;
}

export type ProgramTrack =
  | { kind: "coach"; assignmentId: string; programId: string; currentDay: number }
  | { kind: "flagship"; assignmentId: string | null }
  | { kind: "none"; assignmentId: string | null };

export function decideProgramTrack(input: ProgramTrackInput): ProgramTrack {
  const { assignment, assignmentIsFlagship, hasJourneyDate } = input;

  // Priority 1: a real, non-flagship coach-assigned program always wins.
  if (assignment && !assignmentIsFlagship) {
    return {
      kind: "coach",
      assignmentId: assignment.id,
      programId: assignment.program_id,
      currentDay: assignment.current_day ?? 1,
    };
  }

  // Priority 2: due-date or baby-arrival-driven flagship journey. This
  // includes the case where the only assignment on file is a flagship one —
  // that assignment is preserved for compatibility but is not the source of
  // truth for the current day.
  if (hasJourneyDate) {
    return { kind: "flagship", assignmentId: assignment?.id ?? null };
  }

  // Priority 3: nothing to render yet.
  return { kind: "none", assignmentId: assignment?.id ?? null };
}
