// Coach response: structured prompts feed one open editor, optional video,
// four-priority editor, preview screen, and transaction-safe send.
import { useEffect, useMemo, useState } from "react";
import { Send, Eye, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSaveCoachResponse, useSendCoachResponse } from "@/hooks/useCoachCheckIns";
import { VideoResponseUploader } from "./VideoResponseUploader";
import { WeeklyPriorityEditor } from "./WeeklyPriorityEditor";
import { PRIORITY_CATEGORIES, PRIORITY_CATEGORY_LABELS, PRIORITY_STATUS } from "@/lib/coaching/coachingConstants";
import type { CoachWeeklyResponse, CoachingFlag, WeeklyCheckIn, WeeklyPriority } from "@/lib/coaching/coachingTypes";

const PROMPTS = [
  "What went well",
  "What needs attention",
  "What I want you to understand",
  "What changes this week",
  "Final encouragement or challenge",
];

export function CoachResponseEditor({ checkIn, response, priorities, previousPriorities, flags, onSent }: {
  checkIn: WeeklyCheckIn;
  response: CoachWeeklyResponse | null;
  priorities: WeeklyPriority[];
  previousPriorities: WeeklyPriority[];
  flags: CoachingFlag[];
  onSent: () => void;
}) {
  const save = useSaveCoachResponse(checkIn.id);
  const send = useSendCoachResponse(checkIn.id);
  const [written, setWritten] = useState(response?.written_response ?? "");
  const [previewing, setPreviewing] = useState(false);
  const sent = response?.status === "sent";

  // Debounced draft save of written response
  useEffect(() => {
    if (sent || written === (response?.written_response ?? "")) return;
    const t = setTimeout(() => save.mutate({ written_response: written }), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [written]);

  const prioritiesComplete = useMemo(() => {
    const ok = new Set(priorities
      .filter((p) => p.title?.trim() && (p.completion_criteria?.trim() || p.status === PRIORITY_STATUS.NOT_APPLICABLE))
      .map((p) => p.category));
    return PRIORITY_CATEGORIES.every((c) => ok.has(c));
  }, [priorities]);
  const hasContent = !!written.trim() || !!response?.video_url || !!response?.video_storage_path;

  const handleSend = async () => {
    try {
      await send.mutateAsync();
      toast({ title: "Response sent", description: "The member will see their review on Home." });
      setPreviewing(false);
      onSent();
    } catch (e) {
      toast({ title: "Cannot send", description: e instanceof Error ? e.message : "Check the response.", variant: "destructive" });
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-primary/40 bg-card p-4 text-sm">
        <p className="font-medium gold-text">Response sent {response?.sent_at ? new Date(response.sent_at).toLocaleString() : ""}</p>
        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{response?.written_response}</p>
      </div>
    );
  }

  if (previewing) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Preview before sending</h3>
          <button onClick={() => setPreviewing(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {written.trim() && <p className="text-sm whitespace-pre-wrap border-l-2 border-primary/40 pl-3">{written}</p>}
        {(response?.video_storage_path || response?.video_url) && <p className="text-xs text-primary">Video attached: {response.video_storage_path ?? response.video_url}</p>}
        <div className="space-y-1.5">
          {PRIORITY_CATEGORIES.map((c) => {
            const p = priorities.find((x) => x.category === c);
            return (
              <p key={c} className="text-sm">
                <span className="text-muted-foreground">{PRIORITY_CATEGORY_LABELS[c]}:</span>{" "}
                {p ? (p.status === PRIORITY_STATUS.NOT_APPLICABLE ? `N/A — ${p.na_reason}` : p.title) : <span className="text-destructive">missing</span>}
              </p>
            );
          })}
        </div>
        {flags.length > 0 && <p className="text-xs text-muted-foreground">{flags.length} flag(s) still open — resolve or carry them forward as needed.</p>}
        <button onClick={handleSend} disabled={send.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-60">
          <Send className="h-4 w-4" /> {send.isPending ? "Sending…" : "Send to Member"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Written Response</h3>
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => setWritten((w) => (w ? `${w}\n\n${p}:\n` : `${p}:\n`))}
              className="px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground hover:border-primary/50">+ {p}</button>
          ))}
        </div>
        <textarea value={written} onChange={(e) => setWritten(e.target.value)} rows={8}
          placeholder="Write to him like you talked all week. Specific, human, direct."
          className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary" />
        {save.isPending && <p className="text-[10px] text-muted-foreground">Saving draft…</p>}
      </div>

      <VideoResponseUploader
        memberUserId={checkIn.user_id} checkInId={checkIn.id}
        videoPath={response?.video_storage_path ?? null} videoUrl={response?.video_url ?? null}
        onChange={(v) => save.mutate(v)} />

      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Four Weekly Priorities</h3>
        <WeeklyPriorityEditor checkInId={checkIn.id} userId={checkIn.user_id} weekStart={checkIn.week_start}
          priorities={priorities} previousPriorities={previousPriorities} />
      </div>

      <button
        onClick={() => setPreviewing(true)}
        disabled={!hasContent || !prioritiesComplete}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-primary/50 text-primary font-semibold text-sm disabled:opacity-40"
      >
        <Eye className="h-4 w-4" /> Review & Send
      </button>
      {(!hasContent || !prioritiesComplete) && (
        <p className="text-xs text-muted-foreground text-center">
          {!hasContent && "Add a written or video response. "}
          {!prioritiesComplete && "All four priorities need a title + completion criteria (or N/A with a reason)."}
        </p>
      )}
    </div>
  );
}
