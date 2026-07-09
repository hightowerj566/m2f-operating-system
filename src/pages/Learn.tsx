import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { LEARN_CATEGORIES, recommendedForWeek, ALL_LESSONS } from "@/content/learn";
import { daysRemaining, pregnancyWeek } from "@/lib/phases";
import { LessonCard } from "@/components/learn/LessonCard";
import { CategoryTile } from "@/components/learn/CategoryTile";
import { ArrowLeft, Search } from "lucide-react";

export default function Learn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState<string | null>(null);
  const { completed, saved, recent, savedLessons, overallPercent, percentByCategory, toggleSaved } =
    useLearnProgress();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("due_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setDueDate((data?.due_date as string) ?? null));
  }, [user]);

  const week = pregnancyWeek(daysRemaining(dueDate));
  const recommended = recommendedForWeek(week, 6);
  const continueLesson = recent[0];
  const donePct = overallPercent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">M2F Learn</div>
            <div className="text-lg font-semibold leading-tight">Fatherhood School</div>
          </div>
          <Link to="/learn/search" className="p-2" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <div
            className="w-11 h-11 rounded-full grid place-items-center bg-card border border-white/10 text-xs font-semibold"
            aria-label={`${donePct}% complete`}
          >
            {donePct}%
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {/* Continue */}
        {continueLesson ? (
          <LessonCard lesson={continueLesson} variant="wide" completed={completed.has(continueLesson.slug)} />
        ) : (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-card/60 border border-primary/20">
            <div className="text-[10px] uppercase tracking-widest text-primary mb-2">Start here</div>
            <div className="text-lg font-semibold">The Pregnancy Timeline, Week by Week</div>
            <div className="text-sm text-muted-foreground mt-1">
              A 40-week map — so nothing sneaks up on you.
            </div>
            <Link
              to="/learn/lesson/pregnancy-timeline"
              className="inline-block mt-3 text-sm font-medium text-primary"
            >
              Begin lesson →
            </Link>
          </div>
        )}

        {/* Recommended */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">
              {week ? `Recommended · Week ${week}` : "Recommended for you"}
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {recommended.map((l) => (
              <div key={l.slug} className="snap-start">
                <LessonCard lesson={l} variant="card" completed={completed.has(l.slug)} />
              </div>
            ))}
          </div>
        </section>

        {/* Recently viewed */}
        {recent.length > 1 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Recently viewed</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {recent.slice(1).map((l) => (
                <div key={l.slug} className="snap-start">
                  <LessonCard lesson={l} variant="card" completed={completed.has(l.slug)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved */}
        <section>
          <h2 className="text-base font-semibold mb-3">Saved</h2>
          {savedLessons.length ? (
            <div className="space-y-2">
              {savedLessons.map((l) => (
                <LessonCard
                  key={l.slug}
                  lesson={l}
                  completed={completed.has(l.slug)}
                  saved
                  onSave={toggleSaved}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card/40 border border-dashed border-white/10 text-sm text-muted-foreground">
              Bookmark lessons to revisit them here.
            </div>
          )}
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {LEARN_CATEGORIES.map((c) => {
              const p = percentByCategory(c.slug);
              return <CategoryTile key={c.slug} category={c} done={p.done} total={p.total} pct={p.pct} />;
            })}
          </div>
        </section>

        <div className="text-center text-xs text-muted-foreground pt-2 pb-6">
          {ALL_LESSONS.length} lessons · {completed.size} complete · {saved.size} saved
        </div>
      </div>
    </div>
  );
}
