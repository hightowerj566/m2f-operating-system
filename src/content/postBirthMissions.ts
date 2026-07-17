// M2F OS · Post-birth mission definitions.
// Content lives in TS (same pattern as content/fatherhood.ts and content/learn)
// so it ships without a deploy of new tables. Completion is tracked per-day in
// localStorage using the exact override pattern HomeTab already uses for its
// pregnancy missions — no schema changes, no risk to production data.
//
// Sample set only: enough per phase to prove the system. Expand freely.

import type { PostBirthPhase } from "@/lib/phases";

export type MissionCategory = "fitness" | "family" | "baby" | "home";

export const MISSION_CATEGORY_LABELS: Record<MissionCategory, string> = {
  fitness: "Fitness",
  family: "Family",
  baby: "Baby Care",
  home: "Home",
};

export interface PostBirthMission {
  /** Stable key — used in the localStorage completion key. Never reuse. */
  key: string;
  phase: PostBirthPhase["slug"];
  category: MissionCategory;
  title: string;
  description: string;
  estMinutes: number;
}

export const POST_BIRTH_MISSIONS: PostBirthMission[] = [
  // ── SURVIVAL · birth – 6 weeks ──
  { key: "sv-workout",    phase: "survival", category: "fitness", title: "Complete a 15-minute workout", description: "Minimum mode counts. Done beats perfect right now.", estMinutes: 15 },
  { key: "sv-ask-handle", phase: "survival", category: "family",  title: "Ask your partner what you can fully handle today", description: "Then own it completely — she never thinks about it again.", estMinutes: 5 },
  { key: "sv-bottles",    phase: "survival", category: "baby",    title: "Prepare bottles or feeding supplies", description: "Washed, assembled, staged wherever the feeds happen.", estMinutes: 10 },
  { key: "sv-walk",       phase: "survival", category: "fitness", title: "Take the baby for a 15-minute walk", description: "Fresh air for you both. She gets the house to herself.", estMinutes: 15 },
  { key: "sv-household",  phase: "survival", category: "home",    title: "Complete one household task without being asked", description: "Dishes, laundry, trash — see it, do it, say nothing.", estMinutes: 15 },
  { key: "sv-appts",      phase: "survival", category: "baby",    title: "Review upcoming appointments", description: "Pediatrician, her follow-up — know what's next and who's driving.", estMinutes: 5 },
  { key: "sv-protein",    phase: "survival", category: "home",    title: "Prepare one high-protein meal", description: "For both of you. Recovery and sanity run on protein.", estMinutes: 20 },
  { key: "sv-30min",      phase: "survival", category: "family",  title: "Give your partner 30 uninterrupted minutes", description: "You've got the baby. She's off the clock — shower, nap, nothing.", estMinutes: 30 },

  // ── FOUNDATION · 6 – 12 weeks ──
  { key: "fd-workout",  phase: "foundation", category: "fitness", title: "Complete a 20-minute strength workout", description: "Structured training is back. Consistency over intensity.", estMinutes: 20 },
  { key: "fd-meals",    phase: "foundation", category: "home",    title: "Plan tomorrow's meals", description: "Decide once tonight so nobody's negotiating dinner at 6pm.", estMinutes: 10 },
  { key: "fd-read",     phase: "foundation", category: "baby",    title: "Read or talk to the baby for 10 minutes", description: "Your voice is the curriculum. Any book, any topic.", estMinutes: 10 },
  { key: "fd-question", phase: "foundation", category: "family",  title: "Ask your partner one meaningful question", description: "About her — not the baby, not logistics.", estMinutes: 5 },
  { key: "fd-station",  phase: "foundation", category: "home",    title: "Organize one baby-care station", description: "Changing station, feeding corner, or the diaper bag — restocked and reset.", estMinutes: 15 },
  { key: "fd-week",     phase: "foundation", category: "family",  title: "Review the upcoming week", description: "Appointments, work, coverage gaps — five minutes together tonight.", estMinutes: 5 },

  // ── RHYTHM · 3 – 6 months ──
  { key: "ry-workout",  phase: "rhythm", category: "fitness", title: "Complete the scheduled workout", description: "Follow the program. Switch to Express or Minimum if the night was rough.", estMinutes: 30 },
  { key: "ry-read",     phase: "rhythm", category: "baby",    title: "Read to the baby for 10 minutes", description: "Start the streak that lasts eighteen years.", estMinutes: 10 },
  { key: "ry-activity", phase: "rhythm", category: "family",  title: "Plan one family activity", description: "A walk, a park, a visit — on the calendar, not in your head.", estMinutes: 10 },
  { key: "ry-fintask",  phase: "rhythm", category: "home",    title: "Complete one financial or household task", description: "Budget check, bill audit, or the house task you keep deferring.", estMinutes: 20 },
  { key: "ry-checkin",  phase: "rhythm", category: "family",  title: "Hold a weekly relationship check-in", description: "Twenty minutes, phones down. How are WE doing?", estMinutes: 20 },

  // ── GROWTH · 6 – 12 months ──
  { key: "gr-proof",     phase: "growth", category: "home",    title: "Baby-proof one area of the home", description: "Get on the floor at crawl height. Fix what you find.", estMinutes: 20 },
  { key: "gr-workout",   phase: "growth", category: "fitness", title: "Complete the scheduled workout", description: "Long-term strength — train for the airport carry that's coming.", estMinutes: 35 },
  { key: "gr-floorplay", phase: "growth", category: "baby",    title: "Plan intentional floor play", description: "Fifteen minutes, phone in another room. Full attention.", estMinutes: 15 },
  { key: "gr-milestone", phase: "growth", category: "baby",    title: "Review an upcoming milestone", description: "Know what's next — crawling, standing, first words — and how to support it.", estMinutes: 10 },
  { key: "gr-memory",    phase: "growth", category: "family",  title: "Plan one family memory or activity", description: "First trip, first tradition, first photo worth framing.", estMinutes: 15 },
];

export function missionsForPhase(slug: PostBirthPhase["slug"]): PostBirthMission[] {
  return POST_BIRTH_MISSIONS.filter((m) => m.phase === slug);
}
