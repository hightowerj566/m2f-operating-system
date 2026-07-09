// M2F OS · Slice 5 · The Cohort — men on your exact countdown.
// Membership derives from due month ("September 2026 Dads"). Feed + composer.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Send, Users } from "lucide-react";
import { useLatestReadiness } from "@/hooks/useReadiness";
import {
  cohortMonthFromDueDate,
  cohortName,
  useCohortFeed,
  useCohortMemberCount,
  usePostToCohort,
} from "@/hooks/useM2fOs";

export default function Cohort() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: readiness } = useLatestReadiness(user?.id);
  const cohortMonth = cohortMonthFromDueDate(readiness?.dueDate);
  const name = cohortName(cohortMonth);
  const { data: posts = [], isLoading } = useCohortFeed(cohortMonth);
  const { data: memberCount = 0 } = useCohortMemberCount(cohortMonth);
  const postToCohort = usePostToCohort(user?.id, cohortMonth);

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const submit = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    const ok = await postToCohort(draft);
    if (ok) setDraft("");
    setPosting(false);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      {!cohortMonth ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center mt-10">
          <p className="font-bold text-lg mb-1">No cohort yet</p>
          <p className="text-muted-foreground text-sm mb-4">
            Your cohort is the men due the same month you are. Set your due date by taking the Readiness Assessment.
          </p>
          <Button
            onClick={() => navigate("/readiness/assessment")}
            className="gold-gradient text-primary-foreground font-bold rounded-xl px-6"
          >
            Get My Score
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">The Cohort</p>
            <h1 className="text-3xl font-black tracking-tight">{name}</h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {memberCount} {memberCount === 1 ? "man" : "men"} on your exact countdown
            </p>
          </div>

          {/* Composer */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Win, question, or confession — this room gets it."
              maxLength={500}
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{draft.length}/500</span>
              <Button
                size="sm"
                onClick={submit}
                disabled={!draft.trim() || posting}
                className="gold-gradient text-primary-foreground font-bold rounded-lg"
              >
                {posting ? "Posting..." : "Post"} <Send className="ml-1 w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Feed */}
          {isLoading ? (
            <p className="text-muted-foreground text-sm text-center py-8">Loading the room…</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-bold">Quiet in here.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Someone has to go first. Might as well be you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-foreground">{post.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
