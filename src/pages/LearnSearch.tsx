import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { searchLessons, LEARN_CATEGORIES, findCategory } from "@/content/learn";
import { LessonCard } from "@/components/learn/LessonCard";

export default function LearnSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => searchLessons(q), [q]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const l of results) {
      const arr = map.get(l.categorySlug) ?? [];
      arr.push(l);
      map.set(l.categorySlug, arr);
    }
    return map;
  }, [results]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-card border border-white/10 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search lessons..."
              className="bg-transparent flex-1 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!q && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Browse by category</div>
            {LEARN_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/learn/category/${c.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-white/5"
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-sm font-medium">{c.title}</span>
              </Link>
            ))}
          </div>
        )}
        {q && results.length === 0 && (
          <div className="text-sm text-muted-foreground">No lessons match "{q}".</div>
        )}
        {[...grouped.entries()].map(([cat, list]) => {
          const category = findCategory(cat);
          return (
            <section key={cat}>
              <div className="text-xs text-muted-foreground mb-2">
                {category?.emoji} {category?.title}
              </div>
              <div className="space-y-2">
                {list.map((l) => <LessonCard key={l.slug} lesson={l} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
