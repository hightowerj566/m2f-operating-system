// M2F OS · Conversation guide viewer for TALK Roadmap tasks.
import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Clock, MessageCircle } from "lucide-react";
import { findGuide } from "@/content/conversations";
import { useAuth } from "@/hooks/useAuth";
import { useToggleMilestone } from "@/hooks/useBuildList";

export default function TalkGuide() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const taskId = params.get("task");
  const navigate = useNavigate();
  const { user } = useAuth();
  const completeTask = useToggleMilestone(user?.id);
  const guide = findGuide(slug);
  const [busy, setBusy] = useState(false);

  if (!guide) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        Conversation not found. <Link to="/build-list" className="text-primary underline">Back to Roadmap</Link>
      </div>
    );
  }

  async function done() {
    setBusy(true);
    try {
      if (taskId) await completeTask(taskId, true);
      navigate(taskId ? `/build-list?task=${taskId}` : "/build-list", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted-foreground">Talk · {guide.pillar}</span>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <Clock className="h-3 w-3" /> {guide.minutes} min conversation
          </div>
          <h1 className="text-2xl font-semibold leading-tight">{guide.title}</h1>
        </header>

        <section className="p-5 rounded-2xl bg-primary/10 border border-primary/30 space-y-2">
          <h2 className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Ask Her This
          </h2>
          <p className="text-xs text-muted-foreground">Start here:</p>
          <p className="text-lg font-semibold leading-snug">“{guide.opener}”</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-widest text-primary">If It Opens Up</h2>
          <ul className="space-y-2">
            {guide.followUps.map((f, i) => (
              <li key={i} className="p-3 rounded-xl bg-card border border-border text-sm">{f}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Optional. Listen more than you talk — you don't need to fix anything.</p>
        </section>

        <section className="p-4 rounded-xl bg-card border border-border space-y-1.5">
          <h2 className="text-[11px] uppercase tracking-widest text-primary">One Thing to Decide</h2>
          <p className="text-sm font-medium">{guide.decide}</p>
        </section>
      </article>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={done}
            disabled={busy}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Conversation Done
          </button>
        </div>
      </div>
    </div>
  );
}
