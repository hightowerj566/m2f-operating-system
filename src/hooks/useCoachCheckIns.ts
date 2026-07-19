// Coach-side data layer: queue, single review, flags, response + priorities send.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CHECK_IN_STATUS, FLAG_STATUS, PRIORITY_CATEGORIES, type FlagStatus } from "@/lib/coaching/coachingConstants";
import type { CoachingFlag, CoachQueueRow, WeeklyCheckIn, WeeklyPriority, WeeklySnapshot, CoachWeeklyResponse } from "@/lib/coaching/coachingTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const coachKeys = {
  queue: ["coach", "check-in-queue"] as const,
  review: (id: string) => ["coach", "check-in-review", id] as const,
  flags: (userId?: string) => ["coach", "flags", userId] as const,
};

/** Queue: summarized rows only — no per-client history loads here. */
export function useCoachCheckInQueue() {
  return useQuery({
    queryKey: coachKeys.queue,
    queryFn: async () => {
      const { data: checkIns, error } = await db
        .from("weekly_check_ins")
        .select("*")
        .neq("status", CHECK_IN_STATUS.DRAFT)
        .order("week_start", { ascending: false })
        .order("submitted_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      const rows = (checkIns ?? []) as WeeklyCheckIn[];
      if (!rows.length) return [] as CoachQueueRow[];

      const ids = rows.map((r) => r.id);
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const [profRes, snapRes, flagRes] = await Promise.all([
        db.from("profiles").select("user_id, display_name, due_date").in("user_id", userIds),
        db.from("weekly_check_in_snapshots")
          .select("check_in_id, workout_compliance_pct, nutrition_compliance_pct, weight_change, readiness_delta, build_tasks_completed, days_until_due, baby_age_days, phase_slug")
          .in("check_in_id", ids),
        db.from("coaching_flags").select("check_in_id, severity, status").in("check_in_id", ids).in("status", ["open", "reviewing"]),
      ]);

      type Prof = { user_id: string; display_name: string | null; due_date: string | null };
      const profiles = new Map<string, Prof>((profRes.data ?? []).map((p: Prof) => [p.user_id, p]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snaps = new Map<string, any>((snapRes.data ?? []).map((s: { check_in_id: string }) => [s.check_in_id, s]));
      const flagCounts = new Map<string, { critical: number; medium: number; info: number }>();
      for (const f of flagRes.data ?? []) {
        const c = flagCounts.get(f.check_in_id) ?? { critical: 0, medium: 0, info: 0 };
        c[f.severity as "critical" | "medium" | "info"]++;
        flagCounts.set(f.check_in_id, c);
      }

      return rows.map((r) => {
        const p = profiles.get(r.user_id);
        return {
          ...r,
          profile: p ? { full_name: p.display_name, due_date: p.due_date } : null,
          snapshot: snaps.get(r.id) ?? null,
          flagCounts: flagCounts.get(r.id) ?? { critical: 0, medium: 0, info: 0 },
        } as CoachQueueRow;
      });
    },
  });
}

/** Full consolidated review payload for one check-in. */
export function useCoachCheckInReview(checkInId: string) {
  return useQuery({
    queryKey: coachKeys.review(checkInId),
    enabled: !!checkInId,
    queryFn: async () => {
      const { data: checkIn, error } = await db.from("weekly_check_ins").select("*").eq("id", checkInId).single();
      if (error) throw error;
      const ci = checkIn as WeeklyCheckIn;

      const [snapRes, flagRes, respRes, priRes, profRes, historyRes, weightsRes, macrosRes, prevPriRes, prevRespRes] = await Promise.all([
        db.from("weekly_check_in_snapshots").select("*").eq("check_in_id", ci.id).maybeSingle(),
        db.from("coaching_flags").select("*").eq("user_id", ci.user_id).in("status", ["open", "reviewing"]).order("severity"),
        db.from("coach_weekly_responses").select("*").eq("check_in_id", ci.id).maybeSingle(),
        db.from("weekly_priorities").select("*").eq("check_in_id", ci.id).order("category"),
        db.from("profiles").select("*").eq("user_id", ci.user_id).maybeSingle(),
        // trend history: previous check-ins + their snapshots (last 8 weeks)
        db.from("weekly_check_ins")
          .select("id, week_start, overall_rating, status, weekly_check_in_snapshots(weekly_avg_weight, workout_compliance_pct, nutrition_compliance_pct, readiness_score)")
          .eq("user_id", ci.user_id).lte("week_start", ci.week_start)
          .order("week_start", { ascending: false }).limit(8),
        db.from("daily_weights").select("weigh_date, weight_lbs").eq("user_id", ci.user_id).order("weigh_date", { ascending: false }).limit(56),
        db.from("macro_targets").select("*").eq("user_id", ci.user_id).maybeSingle(),
        db.from("weekly_priorities").select("*").eq("user_id", ci.user_id).lt("week_start", ci.week_start).order("week_start", { ascending: false }).limit(4),
        db.from("coach_weekly_responses")
          .select("written_response, sent_at, weekly_check_ins!inner(user_id, week_start)")
          .eq("weekly_check_ins.user_id", ci.user_id)
          .lt("weekly_check_ins.week_start", ci.week_start)
          .eq("status", "sent")
          .order("sent_at", { ascending: false }).limit(1),
      ]);

      return {
        checkIn: ci,
        snapshot: (snapRes.data ?? null) as WeeklySnapshot | null,
        flags: (flagRes.data ?? []) as CoachingFlag[],
        response: (respRes.data ?? null) as CoachWeeklyResponse | null,
        priorities: (priRes.data ?? []) as WeeklyPriority[],
        profile: profRes.data ?? null,
        history: historyRes.data ?? [],
        weights: weightsRes.data ?? [],
        macros: macrosRes.data ?? null,
        previousPriorities: (prevPriRes.data ?? []) as WeeklyPriority[],
        previousResponse: prevRespRes.data?.[0] ?? null,
      };
    },
  });
}

/** Begin review: locks the member submission. */
export function useBeginReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkInId: string) => {
      const { error } = await db.from("weekly_check_ins")
        .update({ status: CHECK_IN_STATUS.IN_REVIEW, review_started_at: new Date().toISOString(), coach_id: user!.id })
        .eq("id", checkInId).is("review_started_at", null);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: coachKeys.queue });
      qc.invalidateQueries({ queryKey: coachKeys.review(id) });
    },
  });
}

export function useUpdateFlag() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, coach_note, severity, resolution_reason }: {
      id: string; status?: FlagStatus; coach_note?: string; severity?: string; resolution_reason?: string;
    }) => {
      const patch: Record<string, unknown> = {};
      if (status) {
        patch.status = status;
        if (status === FLAG_STATUS.RESOLVED || status === FLAG_STATUS.DISMISSED) {
          patch.resolved_at = new Date().toISOString();
          patch.resolved_by = user!.id;
          if (resolution_reason) patch.resolution_reason = resolution_reason;
        }
      }
      if (coach_note !== undefined) patch.coach_note = coach_note;
      if (severity) patch.severity = severity;
      const { error } = await db.from("coaching_flags").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach"] }),
  });
}

/** Save coach response draft (written/video fields). */
export function useSaveCoachResponse(checkInId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Partial<CoachWeeklyResponse>) => {
      const { data, error } = await db.from("coach_weekly_responses")
        .upsert({ check_in_id: checkInId, coach_id: user!.id, status: "draft", draft_saved_at: new Date().toISOString(), ...fields },
          { onConflict: "check_in_id" })
        .select().single();
      if (error) throw error;
      return data as CoachWeeklyResponse;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.review(checkInId) }),
  });
}

/** Upsert one priority for the review being edited. */
export function useSavePriority(checkInId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<WeeklyPriority> & { user_id: string; week_start: string; category: string; title: string }) => {
      const { error } = await db.from("weekly_priorities")
        .upsert({ ...p, check_in_id: checkInId, coach_id: user!.id }, { onConflict: "user_id,week_start,category" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.review(checkInId) }),
  });
}

/**
 * Send: validates written-or-video + all four priorities, then marks response
 * sent and check-in response_ready. Sequenced so a failure leaves a resumable draft.
 */
export function useSendCoachResponse(checkInId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [{ data: resp }, { data: pris }] = await Promise.all([
        db.from("coach_weekly_responses").select("*").eq("check_in_id", checkInId).maybeSingle(),
        db.from("weekly_priorities").select("category, title, completion_criteria, status").eq("check_in_id", checkInId),
      ]);
      if (!resp || (!resp.written_response?.trim() && !resp.video_url && !resp.video_storage_path)) {
        throw new Error("Add a written or video response before sending.");
      }
      const have = new Set((pris ?? []).filter((p: WeeklyPriority) => p.title?.trim() && (p.completion_criteria?.trim() || p.status === "not_applicable")).map((p: WeeklyPriority) => p.category));
      const missing = PRIORITY_CATEGORIES.filter((c) => !have.has(c));
      if (missing.length) throw new Error(`Missing priorities (title + completion criteria): ${missing.join(", ")}.`);

      const now = new Date().toISOString();
      const { error: e1 } = await db.from("coach_weekly_responses").update({ status: "sent", sent_at: now }).eq("id", resp.id);
      if (e1) throw e1;
      const { error: e2 } = await db.from("weekly_check_ins").update({ status: CHECK_IN_STATUS.RESPONSE_READY, response_sent_at: now }).eq("id", checkInId);
      if (e2) throw e2;
      await db.from("weekly_priorities").update({ response_id: resp.id }).eq("check_in_id", checkInId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coachKeys.queue });
      qc.invalidateQueries({ queryKey: coachKeys.review(checkInId) });
    },
  });
}

/** Coach verifies a completed priority. */
export function useVerifyPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("weekly_priorities")
        .update({ status: "verified", coach_verified_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach"] }),
  });
}
