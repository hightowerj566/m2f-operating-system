import { useParams, Link, useNavigate } from "react-router-dom";
import { findCategory, lessonsByCategory } from "@/content/learn";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { LessonCard } from "@/components/learn/LessonCard";
import { ArrowLeft } from "lucide-react";

export default function LearnCategory() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const category = findCategory(slug);
  const lessons = lessonsByCategory(slug);
  const { completed, saved, toggleSaved, percentByCategory } = useLearnProgress();
  const p = percentByCategory(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        Category not found.{" "}
        <Link to="/learn" className="text-primary underline">Back to Learn</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-medium">Learn</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div
          className="p-6 rounded-2xl border border-white/5"
          style={{ backgroundImage: `linear-gradient(140deg, hsl(${category.tint} / 0.22), hsl(var(--card) / 0.6))` }}
        >
          <div className="text-4xl mb-3">{category.emoji}</div>
          <h1 className="text-xl font-semibold leading-tight">{category.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{category.tagline}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: `hsl(${category.tint})` }} />
            </div>
            <div className="text-xs text-muted-foreground">{p.done}/{p.total}</div>
          </div>
        </div>

        <div className="space-y-2">
          {lessons.map((l) => (
            <LessonCard
              key={l.slug}
              lesson={l}
              completed={completed.has(l.slug)}
              saved={saved.has(l.slug)}
              onSave={toggleSaved}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
