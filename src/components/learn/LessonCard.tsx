import { Link } from "react-router-dom";
import { Clock, Check, Bookmark } from "lucide-react";
import type { Lesson } from "@/content/learn";

interface Props {
  lesson: Lesson;
  completed?: boolean;
  saved?: boolean;
  variant?: "row" | "card" | "wide";
  onSave?: (slug: string) => void;
}

export function LessonCard({ lesson, completed, saved, variant = "row", onSave }: Props) {
  if (variant === "card") {
    return (
      <Link
        to={`/learn/lesson/${lesson.slug}`}
        className="block min-w-[220px] max-w-[240px] p-4 rounded-2xl bg-card/60 backdrop-blur border border-white/5 hover:border-white/15 transition"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3" />
          {lesson.minutes} min
          {completed && <Check className="h-3 w-3 text-success ml-auto" />}
        </div>
        <div className="text-sm font-medium leading-snug line-clamp-3">{lesson.title}</div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</div>
      </Link>
    );
  }
  if (variant === "wide") {
    return (
      <Link
        to={`/learn/lesson/${lesson.slug}`}
        className="block p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-card/60 backdrop-blur border border-primary/20"
      >
        <div className="text-[10px] uppercase tracking-widest text-primary mb-2">Continue learning</div>
        <div className="text-lg font-semibold leading-snug">{lesson.title}</div>
        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
          <Clock className="h-3 w-3" /> {lesson.minutes} min · Resume →
        </div>
      </Link>
    );
  }
  return (
    <Link
      to={`/learn/lesson/${lesson.slug}`}
      className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-white/5 hover:border-white/15 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium leading-snug">{lesson.title}</div>
          {completed && <Check className="h-4 w-4 text-success shrink-0" />}
        </div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</div>
        <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {lesson.minutes} min
        </div>
      </div>
      {onSave && (
        <button
          onClick={(e) => { e.preventDefault(); onSave(lesson.slug); }}
          className="p-2 -m-2 text-muted-foreground hover:text-foreground"
          aria-label={saved ? "Remove bookmark" : "Save lesson"}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
        </button>
      )}
    </Link>
  );
}
