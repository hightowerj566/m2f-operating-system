/**
 * Week-Aware Adjustments
 * Applies week-specific rep overrides and cleans coaching notes based on the current week.
 * Used by both Express and Standard (6-day) workout loading.
 */

/**
 * Apply week-specific rep overrides based on coaching notes.
 * E.g. "Cluster sets (2+2+2/15s rest) wk 6–7. Heavy doubles wk 8-9"
 */
export function getWeekAdjustedReps(reps: string, notes: string, week: number): string {
  // Cluster sets for weeks 6-7
  if (week >= 6 && week <= 7 && /cluster\s*set/i.test(notes)) {
    return "2+2+2 (cluster)";
  }
  // Heavy doubles/triples for weeks 8-9
  if (week >= 8 && week <= 9 && /heavy\s*doubles\/triples/i.test(notes)) {
    return "2–3";
  }
  if (week >= 8 && week <= 9 && /heavy\s*doubles/i.test(notes)) {
    return "2";
  }
  return reps;
}

/**
 * Build week-specific technique tag for the current week.
 */
export function getWeekTechnique(notes: string, week: number): string | null {
  if (week >= 8 && week <= 9) {
    if (/drop\s*set\s*(final\s*set\s*)?(wk|week)\s*8/i.test(notes)) return "Drop set on final set";
    if (/myo[\s-]*reps?\s*(final\s*set\s*)?(wk|week)\s*8/i.test(notes)) return "Myo-reps on final set";
  }
  return null;
}

/**
 * Clean coaching notes by removing week-range directives that don't apply.
 * Surfaces the relevant technique for the current week.
 */
export function cleanNotesForWeek(notes: string, week: number): string {
  let cleaned = notes;

  if (week >= 6 && week <= 7) {
    // Remove "Heavy doubles" directive — doesn't apply yet
    cleaned = cleaned.replace(/Heavy\s*doubles[\/\w]*\s*(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
    // Remove "Cluster sets wk X–Y" but keep the cluster context
    cleaned = cleaned.replace(/Cluster\s*sets\s*(\([^)]*\))?\s*(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
    cleaned = "Cluster: 2+2+2 w/ 15s intra-set rest. " + cleaned.trim();
  } else if (week >= 8 && week <= 9) {
    cleaned = cleaned.replace(/Cluster\s*sets\s*(\([^)]*\))?\s*(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
    cleaned = cleaned.replace(/Heavy\s*doubles[\/\w]*\s*(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
    cleaned = cleaned.replace(/Drop\s*set\s*(final\s*set\s*)?(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
    cleaned = cleaned.replace(/Myo[\s-]*reps?\s*(final\s*set\s*)?(wk|week)\s*\d+[–-]\d+\.?.?\s*/gi, '');
  }

  return cleaned.replace(/\.\s*\./g, '.').replace(/\.\s*$/, '').replace(/^\.\s*/, '').trim();
}

/**
 * Get the current week number from a program day number (1-indexed).
 */
export function getWeekFromDay(dayNum: number): number {
  return Math.ceil(dayNum / 7);
}
