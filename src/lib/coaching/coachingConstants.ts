// Centralized status constants + question option sets for the weekly coaching system.
// Never scatter raw strings through components — import from here.

export const CHECK_IN_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  IN_REVIEW: "in_review",
  RESPONSE_READY: "response_ready",
  ACKNOWLEDGED: "acknowledged",
  CLOSED: "closed",
} as const;
export type CheckInStatus = (typeof CHECK_IN_STATUS)[keyof typeof CHECK_IN_STATUS];

export const PRIORITY_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  VERIFIED: "verified",
  CARRIED_FORWARD: "carried_forward",
  NOT_APPLICABLE: "not_applicable",
} as const;
export type PriorityStatus = (typeof PRIORITY_STATUS)[keyof typeof PRIORITY_STATUS];

export const FLAG_STATUS = {
  OPEN: "open",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;
export type FlagStatus = (typeof FLAG_STATUS)[keyof typeof FLAG_STATUS];

export const FLAG_SEVERITY = { CRITICAL: "critical", MEDIUM: "medium", INFO: "info" } as const;
export type FlagSeverity = (typeof FLAG_SEVERITY)[keyof typeof FLAG_SEVERITY];

export const PRIORITY_CATEGORIES = ["fitness", "nutrition", "relationship", "fatherhood"] as const;
export type PriorityCategory = (typeof PRIORITY_CATEGORIES)[number];

export const PRIORITY_CATEGORY_LABELS: Record<PriorityCategory, string> = {
  fitness: "Fitness",
  nutrition: "Nutrition",
  relationship: "Relationship",
  fatherhood: "Fatherhood Prep",
};

// ── Check-in option sets ──
export const SLEEP_OPTIONS = [
  { value: "<5", label: "Less than 5" },
  { value: "5-6", label: "5–6" },
  { value: "6-7", label: "6–7" },
  { value: "7-8", label: "7–8" },
  { value: "8+", label: "More than 8" },
];

export const TRAINING_OPTIONS = [
  { value: "all", label: "Completed everything" },
  { value: "most", label: "Completed most workouts" },
  { value: "some", label: "Completed some workouts" },
  { value: "barely", label: "Barely trained" },
  { value: "none", label: "Did not train" },
];

export const NUTRITION_OPTIONS = [
  { value: "90-100", label: "90–100%" },
  { value: "75-89", label: "75–89%" },
  { value: "50-74", label: "50–74%" },
  { value: "<50", label: "Below 50%" },
  { value: "not_tracked", label: "Did not track" },
];

export const ENERGY_LABELS = ["Very low", "Low", "Average", "Good", "Excellent"];
export const STRESS_LABELS = ["Very low", "Low", "Moderate", "High", "Very high"];
export const CONNECTION_LABELS = ["Distant", "Strained", "Okay", "Connected", "Strong"];

export const SUPPORT_OPTIONS = [
  { value: "accountability", label: "Accountability" },
  { value: "training", label: "Training adjustment" },
  { value: "nutrition", label: "Nutrition adjustment" },
  { value: "stress", label: "Stress or schedule support" },
  { value: "relationship", label: "Relationship guidance" },
  { value: "fatherhood", label: "Fatherhood prep guidance" },
  { value: "motivation", label: "Motivation" },
  { value: "other", label: "Other" },
];

// Priority templates the coach can pick from
export const PRIORITY_TEMPLATES: Record<PriorityCategory, { title: string; criteria: string }[]> = {
  fitness: [
    { title: "Complete 3 workouts", criteria: "Log 3 workouts this week" },
    { title: "Express workouts on duty days", criteria: "Use the express option any day you can't do the full session" },
    { title: "Walk 20 min on 2 recovery days", criteria: "Two logged 20-minute walks" },
    { title: "Reduce lower-body intensity", criteria: "Drop lower-body loads 10–15% this week" },
  ],
  nutrition: [
    { title: "Hit protein 5 days", criteria: "Protein target hit at least 5 of 7 days" },
    { title: "Log food before dinner", criteria: "Daily log entered before 6pm each day" },
    { title: "Prep 3 work lunches", criteria: "Three lunches prepped and eaten" },
    { title: "Stay within calorie range", criteria: "Within target range at least 5 days" },
  ],
  relationship: [
    { title: "Ask her the weekly M2F question", criteria: "One intentional conversation this week" },
    { title: "One no-phone dinner", criteria: "One dinner, phones away, this week" },
    { title: "Discuss the hospital support plan", criteria: "Plan discussed and one decision made" },
    { title: "Take one task off her plate", criteria: "Own one recurring task she's carrying" },
  ],
  fatherhood: [
    { title: "Install and inspect the car seat", criteria: "Car seat installed, checked against manual" },
    { title: "Finish the hospital bag", criteria: "Bag packed and staged" },
    { title: "Confirm insurance + pediatrician", criteria: "Both confirmed in writing" },
    { title: "Complete infant CPR training", criteria: "Course completed" },
  ],
};
