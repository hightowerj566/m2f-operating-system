import type {
  CheckInStatus, PriorityCategory, PriorityStatus, FlagSeverity, FlagStatus,
} from "./coachingConstants";

export interface WeeklyCheckIn {
  id: string;
  user_id: string;
  coach_id: string | null;
  week_start: string;
  status: CheckInStatus;
  overall_rating: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  energy_rating: number | null;
  stress_rating: number | null;
  sleep_range: string | null;
  training_rating: string | null;
  training_notes: string | null;
  nutrition_rating: string | null;
  nutrition_notes: string | null;
  relationship_rating: number | null;
  relationship_notes: string | null;
  fatherhood_confidence: number | null;
  fatherhood_task_notes: string | null;
  next_week_concern: string | null;
  support_type: string | null;
  support_notes: string | null;
  submitted_at: string | null;
  review_started_at: string | null;
  response_sent_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklySnapshot {
  id: string;
  check_in_id: string;
  workouts_scheduled: number | null;
  workouts_completed: number | null;
  workout_compliance_pct: number | null;
  nutrition_days_logged: number | null;
  nutrition_compliance_pct: number | null;
  avg_calories: number | null;
  avg_protein_g: number | null;
  weekly_avg_weight: number | null;
  previous_week_avg_weight: number | null;
  weight_change: number | null;
  readiness_score: number | null;
  previous_readiness_score: number | null;
  readiness_delta: number | null;
  standards_completion_pct: number | null;
  build_tasks_completed: number | null;
  lessons_completed: number | null;
  mission_completed: boolean | null;
  days_until_due: number | null;
  baby_age_days: number | null;
  phase_slug: string | null;
  program_id: string | null;
  snapshot_json: Record<string, unknown>;
  created_at: string;
}

export type WeeklySnapshotInput = Omit<WeeklySnapshot, "id" | "created_at">;

export interface CoachWeeklyResponse {
  id: string;
  check_in_id: string;
  coach_id: string;
  written_response: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  video_duration_seconds: number | null;
  status: "draft" | "sent";
  draft_saved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPriority {
  id: string;
  check_in_id: string | null;
  response_id: string | null;
  user_id: string;
  coach_id: string;
  week_start: string;
  category: PriorityCategory;
  title: string;
  description: string | null;
  completion_criteria: string | null;
  due_date: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  status: PriorityStatus;
  na_reason: string | null;
  completed_at: string | null;
  coach_verified_at: string | null;
  coach_note: string | null;
  carried_from_priority_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachingFlag {
  id: string;
  user_id: string;
  check_in_id: string | null;
  week_start: string;
  flag_type: string;
  severity: FlagSeverity;
  title: string;
  explanation: string;
  source: string;
  status: FlagStatus;
  coach_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Queue row = check-in + joined summary fields for the coach queue. */
export interface CoachQueueRow extends WeeklyCheckIn {
  profile: { full_name: string | null; due_date: string | null } | null;
  snapshot: Pick<WeeklySnapshot,
    "workout_compliance_pct" | "nutrition_compliance_pct" | "weight_change" |
    "readiness_delta" | "build_tasks_completed" | "days_until_due" | "baby_age_days" | "phase_slug"
  > | null;
  flagCounts: { critical: number; medium: number; info: number };
}
