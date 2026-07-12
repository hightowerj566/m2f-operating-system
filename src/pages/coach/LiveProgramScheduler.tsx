// Minimal coach scheduler: pick a member, pick Forge/Rebuild, pick a start date,
// generate the weekly schedule. Full weekly-edit UI is intentionally scoped
// small in this first pass; publish/pause/resume live here so coaches have a
// single surface.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDateRange, unlockLabel } from "@/lib/liveSchedule";
import { Lock, Unlock, Pause, Play } from "lucide-react";

type Member = { user_id: string; display_name: string | null };
type Program = { id: string; name: string; total_days: number };
type Assignment = {
  id: string; user_id: string; program_id: string; status: string;
  scheduled_start_date: string | null; scheduled_end_date: string | null;
  member_timezone: string; paused_at: string | null;
};
type Week = {
  id: string; display_week_number: number; start_date: string; end_date: string;
  unlock_at: string; publish_status: "draft" | "published"; access_status: string;
};

export default function LiveProgramScheduler() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [tz, setTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: mems }, { data: progs }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name").order("display_name"),
        supabase.from("programs").select("id,name,total_days").eq("uses_live_schedule", true).order("name"),
      ]);
      setMembers((mems ?? []) as Member[]);
      setPrograms((progs ?? []) as Program[]);
    })();
  }, []);

  useEffect(() => {
    if (!memberId) return;
    (async () => {
      const { data } = await supabase
        .from("program_assignments")
        .select("*, program:programs!inner(uses_live_schedule)")
        .eq("user_id", memberId)
        .eq("is_active", true);
      const live = (data ?? []).find((a: any) => a.program?.uses_live_schedule);
      setAssignment(live ?? null);
      if (live) {
        setProgramId(live.program_id);
        setStartDate(live.scheduled_start_date ?? "");
        setTz(live.member_timezone);
        const { data: w } = await supabase
          .from("scheduled_program_weeks")
          .select("*")
          .eq("assignment_id", live.id)
          .order("display_week_number");
        setWeeks((w ?? []) as Week[]);
      } else {
        setWeeks([]);
      }
    })();
  }, [memberId]);

  async function saveSchedule() {
    if (!memberId || !programId || !startDate) return;
    setBusy(true);
    try {
      const payload = {
        user_id: memberId,
        program_id: programId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        is_active: true,
        scheduled_start_date: startDate,
        member_timezone: tz,
        status: "active" as const,
      };
      // Upsert on (user_id, program_id) unique constraint.
      const { data: up, error } = await supabase
        .from("program_assignments")
        .upsert(payload, { onConflict: "user_id,program_id" })
        .select()
        .single();
      if (error) throw error;

      // Regenerate weekly schedule server-side.
      const { error: rpcErr } = await supabase.rpc("generate_scheduled_weeks", { _assignment_id: up.id });
      if (rpcErr) throw rpcErr;

      toast({ title: "Schedule saved", description: `Weekly schedule generated for ${up.scheduled_start_date}.` });
      // Reload
      setMemberId(memberId);
      const { data: w } = await supabase
        .from("scheduled_program_weeks").select("*").eq("assignment_id", up.id)
        .order("display_week_number");
      setWeeks((w ?? []) as Week[]);
      setAssignment(up as Assignment);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function togglePublish(week: Week) {
    const next = week.publish_status === "published" ? "draft" : "published";
    await supabase.from("scheduled_program_weeks").update({ publish_status: next }).eq("id", week.id);
    setWeeks((ws) => ws.map((w) => w.id === week.id ? { ...w, publish_status: next as any } : w));
  }

  async function togglePause() {
    if (!assignment) return;
    const paused = assignment.status === "paused";
    const patch = paused
      ? { status: "active" as const, resumed_at: new Date().toISOString() }
      : { status: "paused" as const, paused_at: new Date().toISOString() };
    await supabase.from("program_assignments").update(patch).eq("id", assignment.id);
    await supabase.from("schedule_change_log").insert({
      assignment_id: assignment.id,
      coach_id: (await supabase.auth.getUser()).data.user?.id,
      field: "status",
      prev_value: { status: assignment.status },
      new_value: patch,
    });
    setAssignment({ ...assignment, ...patch });
  }

  const now = Date.now();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Live Program Scheduler</h1>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Forge or Rebuild" /></SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Member timezone</Label>
              <Input value={tz} onChange={(e) => setTz(e.target.value)} placeholder="America/Denver" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSchedule} disabled={busy || !memberId || !programId || !startDate}>
              {assignment ? "Reschedule" : "Assign & generate"}
            </Button>
            {assignment && (
              <Button variant="secondary" onClick={togglePause}>
                {assignment.status === "paused" ? <><Play className="w-4 h-4 mr-1" /> Resume</> : <><Pause className="w-4 h-4 mr-1" /> Pause</>}
              </Button>
            )}
          </div>
        </div>

        {weeks.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Weekly timeline</h2>
            {weeks.map((w) => {
              const isCurrent =
                new Date(w.unlock_at).getTime() <= now &&
                !weeks.some(x => x.display_week_number > w.display_week_number && new Date(x.unlock_at).getTime() <= now);
              const unlocked = new Date(w.unlock_at).getTime() <= now;
              return (
                <div key={w.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div>
                    <div className="text-sm font-medium">Week {w.display_week_number} · {formatDateRange(w.start_date, w.end_date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {unlocked ? "Unlocked" : `Unlocks ${unlockLabel(w.unlock_at, tz)}`}
                      {" · "}{w.publish_status}
                      {isCurrent && " · current"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(w)}>
                    {w.publish_status === "published" ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
