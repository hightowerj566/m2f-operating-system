import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { findLesson, findCategory } from "@/content/learn";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { ArrowLeft, Bookmark, Check, Clock } from "lucide-react";

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
  const lesson = findLesson(slug);
  const category = lesson ? findCategory(lesson.categorySlug) : null;
  const { completed, saved, toggleComplete, toggleSaved, markViewed } = useLearnProgress();

  useEffect(() => { if (lesson) markViewed(lesson.slug); }, [lesson?.slug]);

  const checklistKey = `learn:${slug}:checklist`;
  const [checked, setChecked] = useState<boolean[]>([]);
  useEffect(() => {
    if (!lesson) return;
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-white/5">
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {lesson.minutes} min read
          </div>
          <h1 className="text-2xl font-semibold leading-tight">{lesson.title}</h1>
          <p className="text-muted-foreground">{lesson.summary}</p>
        </header>

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
                <div key={i} className="p-4 rounded-xl bg-card/60 border border-white/5">
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

        <Section title="Action Checklist">
          <ul className="space-y-2">
            {s.actionChecklist.map((a, i) => (
              <li key={i}>
                <button
                  onClick={() => toggleChecklist(i)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-white/5"
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded border ${checked[i] ? "bg-primary border-primary" : "border-white/20"} grid place-items-center mt-0.5`}
                  >
                    {checked[i] && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <span className={checked[i] ? "text-muted-foreground line-through" : ""}>{a}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Key Takeaways">
          <ul className="space-y-1 list-disc list-inside">
            {s.keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        </Section>

        {relatedLessons.length ? (
          <Section title="Related Lessons">
            <div className="flex flex-wrap gap-2">
              {relatedLessons.map((r) => r && (
                <Link
                  key={r.slug}
                  to={`/learn/lesson/${r.slug}`}
                  className="px-3 py-2 rounded-full bg-card/60 border border-white/10 text-sm hover:border-white/30"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </Section>
        ) : null}
      </article>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={() => toggleSaved(lesson.slug)}
            className="flex-1 h-12 rounded-xl border border-white/15 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => toggleComplete(lesson.slug)}
            className={`flex-[2] h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
              isDone ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            <Check className="h-4 w-4" />
            {isDone ? "Completed" : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
