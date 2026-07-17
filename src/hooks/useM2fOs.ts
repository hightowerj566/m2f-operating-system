// M2F OS · Slices 4–6 data layer: due-date pass, cohorts, graduation.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─────────────────────────────────────────────
// Slice 4 · Due-date pass
// ─────────────────────────────────────────────
export function useDueDatePass(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["due-date-pass", userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await db
        .from("due_date_passes")
        .select("id, expires_at")
        .eq("user_id", userId)
        .gte("expires_at", today)
        .order("expires_at", { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });
  return { hasPass: !!query.data, passExpires: (query.data?.expires_at as string | undefined) ?? null, loading: query.isLoading };
}

// ─────────────────────────────────────────────
// Slice 5 · Due-month cohorts
// ─────────────────────────────────────────────
export interface CohortPost {
  id: string;
  user_id: string;
  cohort_month: string;
  content: string;
  created_at: string;
  author_name?: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function cohortMonthFromDueDate(dueDate: string | null | undefined): string | null {
  if (!dueDate || !/^\d{4}-\d{2}/.test(dueDate)) return null;
  return dueDate.slice(0, 7); // 'YYYY-MM'
}

export function cohortName(cohortMonth: string | null): string | null {
  if (!cohortMonth) return null;
  const [year, month] = cohortMonth.split("-").map(Number);
  const name = MONTHS[(month ?? 1) - 1];
  return name ? `${name} ${year} Dads` : null;
}

export function useCohortFeed(cohortMonth: string | null) {
  return useQuery<CohortPost[]>({
    queryKey: ["cohort-feed", cohortMonth],
    enabled: !!cohortMonth,
    queryFn: async () => {
      const { data: posts } = await db
        .from("cohort_posts")
        .select("id, user_id, cohort_month, content, created_at")
        .eq("cohort_month", cohortMonth)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!posts?.length) return [];

      // Resolve display names from profiles (best-effort)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userIds = [...new Set(posts.map((p: any) => p.user_id))];
      const { data: profiles } = await db
        .from("profiles")
        .select("user_id, display_name, first_name, name")
        .in("user_id", userIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameFor = (id: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pr = profiles?.find((x: any) => x.user_id === id);
        return pr?.display_name || pr?.first_name || pr?.name || "A dad in your cohort";
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return posts.map((p: any) => ({ ...p, author_name: nameFor(p.user_id) })) as CohortPost[];
    },
  });
}

export function useCohortMemberCount(cohortMonth: string | null) {
  return useQuery<number>({
    queryKey: ["cohort-count", cohortMonth],
    enabled: !!cohortMonth,
    queryFn: async () => {
      const [year, month] = (cohortMonth as string).split("-").map(Number);
      const start = `${cohortMonth}-01`;
      const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const { count } = await db
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .gte("due_date", start)
        .lt("due_date", nextMonth);
      return count ?? 0;
    },
  });
}

export function usePostToCohort(userId: string | undefined, cohortMonth: string | null) {
  const queryClient = useQueryClient();
  return async (content: string) => {
    const clean = content.trim().slice(0, 500);
    if (!clean || !userId || !cohortMonth) return false;
    const { error } = await db
      .from("cohort_posts")
      .insert({ user_id: userId, cohort_month: cohortMonth, content: clean });
    if (!error) queryClient.invalidateQueries({ queryKey: ["cohort-feed", cohortMonth] });
    return !error;
  };
}

// ─────────────────────────────────────────────
// Slice 6 · Graduation
// ─────────────────────────────────────────────
export async function recordArrival(userId: string, babyName: string, arrivedAt: string): Promise<boolean> {
  const { error } = await db
    .from("profiles")
    .update({ baby_name: babyName.trim().slice(0, 50), baby_arrived_at: arrivedAt })
    .eq("user_id", userId);
  return !error;
}

/** Correct a wrongly-entered arrival: clears the birth date and returns the
 * app to pregnancy mode. Due date and pregnancy history are untouched. */
export async function clearArrival(userId: string): Promise<boolean> {
  const { error } = await db
    .from("profiles")
    .update({ baby_arrived_at: null })
    .eq("user_id", userId);
  return !error;
}

export async function joinYearOneWaitlist(userId: string, email: string): Promise<boolean> {
  const { error } = await db
    .from("year_one_waitlist")
    .upsert({ user_id: userId, email: email.trim().toLowerCase() }, { onConflict: "user_id" });
  return !error;
}

export function useOnWaitlist(userId: string | undefined) {
  return useQuery<boolean>({
    queryKey: ["year-one-waitlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db
        .from("year_one_waitlist")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      return !!data;
    },
  });
}
