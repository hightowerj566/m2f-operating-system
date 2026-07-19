// Transparent, rule-based coaching flags. No black-box scoring.
// Every flag carries a plain-language explanation of exactly which rule fired.
// M2F is a coaching platform — flags are coaching prompts, never diagnoses.

import { FLAG_SEVERITY, type FlagSeverity } from "./coachingConstants";
import type { WeeklyCheckIn, WeeklySnapshotInput } from "./coachingTypes";

export interface FlagCandidate {
  flag_type: string;
  severity: FlagSeverity;
  title: string;
  explanation: string;
}

const CONCERN_KEYWORDS = [
  "injur", "hurt myself", "depress", "panic", "hopeless", "unsafe",
  "can't go on", "self harm", "suicid", "divorce", "separat", "violence", "abuse",
];

export function evaluateCoachingFlags(
  checkIn: Partial<WeeklyCheckIn>,
  snapshot: Partial<WeeklySnapshotInput> | null,
  opts: { consecutiveMissedCheckIns?: number; overdueBuildTasks?: number } = {},
): FlagCandidate[] {
  const flags: FlagCandidate[] = [];
  const add = (flag_type: string, severity: FlagSeverity, title: string, explanation: string) =>
    flags.push({ flag_type, severity, title, explanation });

  const text = [
    checkIn.biggest_struggle, checkIn.training_notes, checkIn.nutrition_notes,
    checkIn.relationship_notes, checkIn.next_week_concern, checkIn.support_notes,
  ].filter(Boolean).join(" ").toLowerCase();

  // ── Critical ──
  if (checkIn.stress_rating === 5)
    add("stress_max", FLAG_SEVERITY.CRITICAL, "Stress at 5/5", "Member rated weekly stress 5 of 5.");
  if (checkIn.energy_rating === 1)
    add("energy_min", FLAG_SEVERITY.CRITICAL, "Energy at 1/5", "Member rated weekly energy 1 of 5.");
  if (checkIn.relationship_rating === 1)
    add("relationship_min", FLAG_SEVERITY.CRITICAL, "Relationship connection at 1/5", "Member rated partner connection 1 of 5.");
  const hit = CONCERN_KEYWORDS.find((k) => text.includes(k));
  if (hit)
    add("concern_keyword", FLAG_SEVERITY.CRITICAL, "Concerning language in answers",
      `Member's written answers include the phrase "${hit}". Read the full answer — this is a keyword match, not a diagnosis.`);
  if (snapshot?.readiness_delta != null && snapshot.readiness_delta <= -10)
    add("readiness_drop", FLAG_SEVERITY.CRITICAL, "Readiness dropped sharply",
      `Readiness score fell ${Math.abs(snapshot.readiness_delta)} points since the last assessment.`);
  if (snapshot?.workouts_completed === 0 && (snapshot.workouts_scheduled ?? 0) > 0)
    add("zero_workouts", FLAG_SEVERITY.CRITICAL, "No workouts completed", "Zero workouts were logged this week against an assigned program.");
  if ((opts.consecutiveMissedCheckIns ?? 0) >= 2)
    add("missed_checkins", FLAG_SEVERITY.CRITICAL, "Two missed check-ins",
      `${opts.consecutiveMissedCheckIns} consecutive weekly check-ins were not submitted.`);
  if (checkIn.support_notes?.toLowerCase().includes("urgent") || text.includes("need help now"))
    add("urgent_request", FLAG_SEVERITY.CRITICAL, "Member asked for urgent support", "Member explicitly used urgent language in a support request.");

  // ── Medium ──
  if (snapshot?.workout_compliance_pct != null && snapshot.workout_compliance_pct < 50)
    add("low_training", FLAG_SEVERITY.MEDIUM, "Training compliance below 50%", `Workout compliance was ${snapshot.workout_compliance_pct}%.`);
  if (snapshot?.nutrition_compliance_pct != null && snapshot.nutrition_compliance_pct < 50)
    add("low_nutrition", FLAG_SEVERITY.MEDIUM, "Nutrition compliance below 50%", `Nutrition compliance was ${snapshot.nutrition_compliance_pct}%.`);
  if (checkIn.sleep_range === "<5" || checkIn.sleep_range === "5-6")
    add("low_sleep", FLAG_SEVERITY.MEDIUM, "Sleep below 6 hours", `Member averaged ${checkIn.sleep_range} hours of sleep.`);
  if (checkIn.stress_rating === 4)
    add("high_stress", FLAG_SEVERITY.MEDIUM, "High stress reported", "Member rated stress 4 of 5.");
  if (snapshot?.build_tasks_completed === 0)
    add("no_fatherhood_tasks", FLAG_SEVERITY.MEDIUM, "No fatherhood tasks completed", "Zero Build List tasks were completed this week.");
  if ((opts.overdueBuildTasks ?? 0) >= 2)
    add("overdue_milestones", FLAG_SEVERITY.MEDIUM, "Multiple overdue Build List milestones", `${opts.overdueBuildTasks} Build List milestones are overdue.`);
  if (snapshot?.standards_completion_pct != null && snapshot.standards_completion_pct < 50)
    add("low_standards", FLAG_SEVERITY.MEDIUM, "Daily standards below 50%", `Standards completion was ${snapshot.standards_completion_pct}%.`);
  if (checkIn.overall_rating != null && checkIn.overall_rating <= 4)
    add("low_week_rating", FLAG_SEVERITY.MEDIUM, "Week rated 4/10 or lower", `Member rated the week ${checkIn.overall_rating}/10.`);
  // Weight moving against goal (needs goal from snapshot_json)
  const goal = (snapshot?.snapshot_json as Record<string, unknown> | undefined)?.goal as string | undefined;
  if (goal && snapshot?.weight_change != null) {
    if (goal === "fat_loss" && snapshot.weight_change >= 1)
      add("weight_vs_goal", FLAG_SEVERITY.MEDIUM, "Weight trending against goal", `Weight rose ${snapshot.weight_change} lb during a fat-loss phase.`);
    if (goal === "muscle_gain" && snapshot.weight_change <= -1)
      add("weight_vs_goal", FLAG_SEVERITY.MEDIUM, "Weight trending against goal", `Weight fell ${Math.abs(snapshot.weight_change)} lb during a muscle-gain phase.`);
  }

  // ── Informational ──
  const supportMap: Record<string, [string, string]> = {
    training: ["requests_training_change", "Member requested a program adjustment"],
    nutrition: ["requests_nutrition_change", "Member requested a nutrition change"],
    relationship: ["requests_relationship_support", "Member requested relationship support"],
    fatherhood: ["requests_fatherhood_guidance", "Member requested fatherhood guidance"],
  };
  if (checkIn.support_type && supportMap[checkIn.support_type]) {
    const [type, title] = supportMap[checkIn.support_type];
    add(type, FLAG_SEVERITY.INFO, title, `Selected "${checkIn.support_type}" as this week's primary support need.`);
  }
  if (snapshot?.days_until_due != null && snapshot.days_until_due <= 30)
    add("due_soon", FLAG_SEVERITY.INFO, "Due date within 30 days", `${snapshot.days_until_due} days until the due date.`);
  if (snapshot?.baby_age_days != null && snapshot.baby_age_days <= 28)
    add("newborn", FLAG_SEVERITY.INFO, "Baby recently arrived", `Baby is ${snapshot.baby_age_days} days old.`);

  return flags;
}
