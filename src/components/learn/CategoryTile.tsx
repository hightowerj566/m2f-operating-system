import { Link } from "react-router-dom";
import type { Category } from "@/content/learn";

interface Props {
  category: Category;
  done: number;
  total: number;
  pct: number;
}

export function CategoryTile({ category, done, total, pct }: Props) {
  return (
    <Link
      to={`/learn/category/${category.slug}`}
      className="block p-4 rounded-2xl border border-white/5 backdrop-blur"
      style={{
        backgroundImage: `linear-gradient(140deg, hsl(${category.tint} / 0.18), hsl(var(--card) / 0.6))`,
      }}
    >
      <div className="text-2xl mb-2">{category.emoji}</div>
      <div className="text-sm font-medium leading-snug">{category.title}</div>
      <div className="text-[11px] text-muted-foreground mt-1">
        {done}/{total} complete
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: `hsl(${category.tint})` }}
        />
      </div>
    </Link>
  );
}
