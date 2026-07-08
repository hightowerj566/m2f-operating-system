// M2F OS · Readiness data layer.
// New tables aren't in the generated Database types yet (regenerate after
// running the migration); queries go through an untyped client cast, contained here.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  APPENDIX_A,
  CATEGORIES,
  type AssessmentQuestion,
  type CategorySlug,
  type ScoreResult,
  type TrackName,
} from "@/lib/readiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Fetch the assessment from the CMS tables; fall back to the bundled copy. */
export function useAssessmentQuestions() {
  return useQuery<AssessmentQuestion[]>({
    queryKey: ["assessment-questions"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { data: questions, error: qErr } = await db
          .from("assessment_questions")
          .select("id, code, category_id, prompt, kind, sort_order")
          .eq("is_active", true)
          .order("sort_order");
        if (qErr || !questions?.length) return APPENDIX_A;

        const { data: options, error: oErr } = await db
          .from("assessment_options")
          .select("id, question_id, label, points, routing_value, sort_order")
          .order("sort_order");
        if (oErr || !options?.length) return APPENDIX_A;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return questions.map((question: any) => ({
          id: question.id,
          code: question.code,
          category_id: question.category_id,
          prompt: question.prompt,
          kind: question.kind,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options: options.filter((o: any) => o.question_id === question.id),
        })) as AssessmentQuestion[];
      } catch {
        return APPENDIX_A;
      }
    },
  });
}

export interface SavedAssessment {
  id: string;
  taken_at: string;
  total_score: number;
  weeks_remaining: number | null;
  byCategory?: Record<CategorySlug, number>;
}

/** Persist a snapshot for a logged-in user and stamp the profile. */
export async function saveAssessment(params: {
  userId: string;
  result: ScoreResult;
  weeksRemaining: number | null;
  answers: Record<string, unknown>;
  dueDate: string | null; // yyyy-mm-dd
  track?: TrackName; // Slice 3: auto-assign the routed program
}): Promise<string | null> {
  const { userId, result, weeksRemaining, answers, dueDate, track } = params;
  const { data: inserted, error } = await db
    .from("assessments")
    .insert({
      user_id: userId,
      total_score: result.total,
      weeks_remaining: weeksRemaining,
      answers,
    })
    .select("id")
    .single();
  if (error || !inserted) return null;

  const rows = CATEGORIES.map((c) => ({
    assessment_id: inserted.id,
    category_id: c.id,
    score: result.byCategory[c.slug],
  }));
  await db.from("assessment_category_scores").insert(rows);

  const profileUpdate: Record<string, unknown> = { last_assessment_id: inserted.id };
  if (dueDate) profileUpdate.due_date = dueDate;
  await db.from("profiles").update(profileUpdate).eq("user_id", userId);

  if (track) await ensureTrackAssignment(userId, track);

  return inserted.id as string;
}

/**
 * Slice 3 · Track routing: if the user has no active program, enroll them in
 * their routed track (M2F Rebuild / M2F Perform). Never overrides an active
 * program — re-tests don't yank a man mid-block.
 */
export async function ensureTrackAssignment(userId: string, track: TrackName): Promise<void> {
  try {
    const { data: active } = await db
      .from("program_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1);
    if (active && active.length > 0) return;

    const { data: programs } = await db
      .from("programs")
      .select("id, name")
      .ilike("name", `%${track}%`)
      .limit(1);
    let programId = programs?.[0]?.id as string | undefined;
    if (!programId) {
      // Fallback: match on Rebuild/Perform keyword
      const keyword = track.includes("Perform") ? "Perform" : "Rebuild";
      const { data: fallback } = await db
        .from("programs")
        .select("id, name")
        .ilike("name", `%${keyword}%`)
        .limit(1);
      programId = fallback?.[0]?.id;
    }
    if (!programId) return;

    // Reactivate a prior assignment if one exists, else create fresh
    const { data: prior } = await db
      .from("program_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("program_id", programId)
      .limit(1);
    if (prior && prior.length > 0) {
      await db.from("program_assignments").update({ is_active: true }).eq("id", prior[0].id);
    } else {
      await db.from("program_assignments").insert({
        user_id: userId,
        program_id: programId,
        current_day: 1,
        assigned_by: userId,
        assigned_at: new Date().toISOString(),
        is_active: true,
      });
    }
  } catch {
    // Assignment is best-effort; the ProgramPicker remains the manual fallback
  }
}

/** Latest snapshot + due date for the Home tab. */
export function useLatestReadiness(userId: string | undefined) {
  return useQuery({
    queryKey: ["latest-readiness", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profile } = await db
        .from("profiles")
        .select("due_date, baby_arrived_at, baby_name, last_assessment_id, journey")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: assessments } = await db
        .from("assessments")
        .select("id, taken_at, total_score, weeks_remaining")
        .eq("user_id", userId)
        .order("taken_at", { ascending: false })
        .limit(2);

      const latest = assessments?.[0] ?? null;
      const previous = assessments?.[1] ?? null;

      let byCategory: Record<CategorySlug, number> | null = null;
      if (latest) {
        const { data: cats } = await db
          .from("assessment_category_scores")
          .select("category_id, score")
          .eq("assessment_id", latest.id);
        if (cats?.length) {
          byCategory = Object.fromEntries(
            CATEGORIES.map((c) => [
              c.slug,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cats.find((r: any) => r.category_id === c.id)?.score ?? 0,
            ]),
          ) as Record<CategorySlug, number>;
        }
      }

      return {
        journey: (profile?.journey as "expecting" | "training" | null) ?? null,
        dueDate: (profile?.due_date as string | null) ?? null,
        babyArrivedAt: (profile?.baby_arrived_at as string | null) ?? null,
        babyName: (profile?.baby_name as string | null) ?? null,
        latest: latest
          ? ({ ...latest, byCategory: byCategory ?? undefined } as SavedAssessment)
          : null,
        previousTotal: (previous?.total_score as number | undefined) ?? null,
      };
    },
  });
}
