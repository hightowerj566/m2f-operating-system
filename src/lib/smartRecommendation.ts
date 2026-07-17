// M2F OS · Smart workout-version recommender.
// Pure. Given recent context, return which version (Full / Express / Minimum)
// to nudge the member toward — and why. UI treats it as a hint, never as a
// gate. Supportive, not punitive.

import type { WorkoutVersion } from "@/content/postBirthTraining";

export interface RecommendationInput {
  /** Hours of sleep last night, if known. */
  sleepHours?: number | null;
  /** Was yesterday's workout skipped? */
  missedYesterday?: boolean;
  /** Count of hard sessions in the last 7 days. */
  hardSessions7d?: number;
  /** Days since baby arrived (null when pre-birth or unknown). */
  babyAgeDays?: number | null;
}

export interface Recommendation {
  version: WorkoutVersion;
  reason: string;
  /** Whether to surface this to the user or stay silent. */
  visible: boolean;
}

export function recommendVersion(input: RecommendationInput): Recommendation {
  // Newborn window: default to Minimum for the first two weeks.
  if (input.babyAgeDays != null && input.babyAgeDays < 14) {
    return {
      version: "minimum",
      reason: "Newborn phase. Minimum still counts.",
      visible: true,
    };
  }

  if (typeof input.sleepHours === "number" && input.sleepHours < 5) {
    return {
      version: "minimum",
      reason: "Under 5 hours of sleep. Save the recovery.",
      visible: true,
    };
  }

  if (typeof input.sleepHours === "number" && input.sleepHours < 7) {
    return {
      version: "express",
      reason: "Rough night. Express keeps the streak alive.",
      visible: true,
    };
  }

  if ((input.hardSessions7d ?? 0) >= 3) {
    return {
      version: "express",
      reason: "Three hard sessions this week. Ease up today.",
      visible: true,
    };
  }

  if (input.missedYesterday) {
    return {
      version: "full",
      reason: "You missed yesterday — pick it up today.",
      visible: true,
    };
  }

  return { version: "full", reason: "Green light. Run the full session.", visible: false };
}
