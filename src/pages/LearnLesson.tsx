import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { findLesson, findCategory } from "@/content/learn";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { useAuth } from "@/hooks/useAuth";
import { useToggleMilestone } from "@/hooks/useBuildList";
import { ArrowLeft, Bookmark, Check, Clock, AlertTriangle } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[11px] uppercase tracking-widest text-primary">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export default function LearnLesson() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const taskId = params.get("task");
  const { user } = useAuth();
  const completeTask = useToggleMilestone(user?.id);
  const lesson = findLesson(slug);
  const category = lesson ? findCategory(lesson.categorySlug) : null;
  const { completed, saved, toggleComplete, toggleSaved, markViewed, completeLesson } = useLearnProgress();
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (lesson) markViewed(lesson.slug); }, [lesson?.slug]);

  const checklistKey = `learn:${slug}:checklist`;
  const [checked, setChecked] = useState<boolean[]>([]);
  useEffect(() => {
    if (!lesson?.sections) return;
    const stored = localStorage.getItem(checklistKey);
    if (stored) {
      try { setChecked(JSON.parse(stored)); return; } catch { /* fall through */ }
    }
    setChecked(new Array(lesson.sections.actionChecklist.length).fill(false));
  }, [lesson?.slug]);

  function toggleChecklist(i: number) {
    const next = checked.slice();
    next[i] = !next[i];
    setChecked(next);
    localStorage.setItem(checklistKey, JSON.stringify(next));
  }

  const relatedLessons = useMemo(() => (lesson?.related ?? []).map(findLesson).filter(Boolean), [lesson?.slug]);

  if (!lesson || !category) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        Lesson not found. <Link to="/learn" className="text-primary underline">Back to Learn</Link>
      </div>
    );
  }

  const isDone = completed.has(lesson.slug);
  const isSaved = saved.has(lesson.slug);
  const s = lesson.sections;
  const q = lesson.quick;

  // From the Roadmap: completing the lesson completes the linked task, then returns.
  async function handleComplete() {
    if (!lesson) return;
    if (!taskId) {
      if (q) await completeLesson(lesson.slug);
      else toggleComplete(lesson.slug);
      return;
    }
    setBusy(true);
    try {
      await completeLesson(lesson.slug);
      await completeTask(taskId, true);
      navigate(`/build-list?task=${taskId}`, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  const ctaLabel = taskId
    ? "Got It — Complete Lesson"
    : isDone ? "Completed" : q ? "Got It — Complete Lesson" : "Mark Complete";

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to={`/learn/category/${category.slug}`} className="text-sm text-muted-foreground">
            {category.emoji} {category.title}
          </Link>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <Clock className="h-3 w-3" /> {lesson.minutes} min
            {isDone && <span className="ml-2 text-success flex items-center gap-1"><Check className="h-3 w-3" /> Completed</span>}
          </div>
          <h1 className="text-2xl font-semibold leading-tight">{lesson.title}</h1>
          <p className="text-muted-foreground">{lesson.summary}</p>
        </header>

        {q && (
          <>
            <Section title="The Situation">{q.situation}</Section>
            <Section title="Know This">
              <div className="grid gap-3">
                {q.knowThis.map((k, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border">
                    <div className="text-sm font-semibold">{k.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{k.body}</div>
                  </div>
                ))}
              </div>
            </Section>
            {q.safety?.length ? (
              <section className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
                <h2 className="text-[11px] uppercase tracking-widest text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Get Help
                </h2>
                <ul className="space-y-2 text-sm">
                  {q.safety.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </section>
            ) : null}
            <section className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-1.5">
              <h2 className="text-[11px] uppercase tracking-widest text-primary">Your Job</h2>
              <p className="text-sm font-medium leading-relaxed">{q.yourJob}</p>
            </section>
            <Section title="Bottom Line">
              <p className="text-base font-semibold text-foreground">{q.bottomLine}</p>
            </Section>
          </>
        )}

        {s && (
          <>
            <Section title="Overview">{s.overview}</Section>
            <Section title="Why It Matters">{s.whyItMatters}</Section>

            <Section title="Step-by-Step">
              <ol className="space-y-3">
                {s.steps.map((st, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs grid place-items-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{st}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {s.visualExamples?.length ? (
              <Section title="Visual Examples">
                <div className="grid gap-3">
                  {s.visualExamples.map((v, i) => (
                    <div key={i} className="p-4 rounded-xl bg-card/60 border border-border">
                      <div className="text-sm font-medium">{v.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{v.body}</div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section title="Common Mistakes">
              <ul className="space-y-2">
                {s.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-destructive">✕</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {s.safetyTips?.length ? (
              <Section title="Safety Tips">
                <ul className="space-y-2 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  {s.safetyTips.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span>⚠️</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <Section title="Your Job">
              <ul className="space-y-2">
                {s.actionChecklist.map((a, i) => (
                  <li key={i}>
                    <button
                      onClick={() => toggleChecklist(i)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-border"
                    >
                      <span
                        className={`shrink-0 w-5 h-5 rounded border ${checked[i] ? "bg-primary border-primary" : "border-border"} grid place-items-center mt-0.5`}
                      >
                        {checked[i] && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span className={checked[i] ? "text-muted-foreground line-through" : ""}>{a}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Bottom Line">
              <ul className="space-y-1 list-disc list-inside">
                {s.keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </Section>
          </>
        )}

        {relatedLessons.length ? (
          <Section title="Related Lessons">
            <div className="flex flex-wrap gap-2">
              {relatedLessons.map((r) => r && (
                <Link
                  key={r.slug}
                  to={`/learn/lesson/${r.slug}`}
                  className="px-3 py-2 rounded-full bg-card/60 border border-border text-sm hover:border-primary/40"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </Section>
        ) : null}
      </article>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={() => toggleSaved(lesson.slug)}
            className="flex-1 h-12 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleComplete}
            disabled={busy}
            className={`flex-[2] h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${
              isDone && !taskId ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            <Check className="h-4 w-4" />
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
