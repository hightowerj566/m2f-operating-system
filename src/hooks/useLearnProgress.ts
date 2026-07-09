import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ALL_LESSONS, findLesson, type Lesson } from "@/content/learn";
import { useMemo } from "react";

interface ProgressRow {
  lesson_slug: string;
  completed_at: string | null;
  saved: boolean;
  last_viewed_at: string;
}

export function useLearnProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["learn-progress", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProgressRow[]> => {
      const { data, error } = await supabase
        .from("learn_progress")
        .select("lesson_slug, completed_at, saved, last_viewed_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const completed = useMemo(() => new Set(rows.filter((r) => r.completed_at).map((r) => r.lesson_slug)), [rows]);
  const saved = useMemo(() => new Set(rows.filter((r) => r.saved).map((r) => r.lesson_slug)), [rows]);

  const recent: Lesson[] = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => new Date(b.last_viewed_at).getTime() - new Date(a.last_viewed_at).getTime())
      .map((r) => findLesson(r.lesson_slug))
      .filter((l): l is Lesson => !!l)
      .slice(0, 8);
  }, [rows]);

  const savedLessons: Lesson[] = useMemo(
    () => Array.from(saved).map((s) => findLesson(s)).filter((l): l is Lesson => !!l),
    [saved],
  );

  const overallPercent = ALL_LESSONS.length
    ? Math.round((completed.size / ALL_LESSONS.length) * 100)
    : 0;

  const percentByCategory = (slug: string): { done: number; total: number; pct: number } => {
    const list = ALL_LESSONS.filter((l) => l.categorySlug === slug);
    const done = list.filter((l) => completed.has(l.slug)).length;
    return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  };

  async function upsert(slug: string, patch: Partial<Omit<ProgressRow, "lesson_slug">>) {
    if (!user) return;
    const { error } = await supabase
      .from("learn_progress")
      .upsert(
        { user_id: user.id, lesson_slug: slug, last_viewed_at: new Date().toISOString(), ...patch },
        { onConflict: "user_id,lesson_slug" },
      );
    if (error) throw error;
  }

  const markViewed = useMutation({
    mutationFn: (slug: string) => upsert(slug, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learn-progress", user?.id] }),
  });

  const toggleComplete = useMutation({
    mutationFn: async (slug: string) => {
      const isDone = completed.has(slug);
      await upsert(slug, { completed_at: isDone ? null : new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learn-progress", user?.id] }),
  });

  const toggleSaved = useMutation({
    mutationFn: async (slug: string) => {
      await upsert(slug, { saved: !saved.has(slug) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learn-progress", user?.id] }),
  });

  return {
    completed,
    saved,
    recent,
    savedLessons,
    overallPercent,
    percentByCategory,
    markViewed: (slug: string) => markViewed.mutate(slug),
    toggleComplete: (slug: string) => toggleComplete.mutate(slug),
    toggleSaved: (slug: string) => toggleSaved.mutate(slug),
  };
}
