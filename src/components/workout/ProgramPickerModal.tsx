import { useState, useEffect } from "react";
import { ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  name: string;
  description: string | null;
  total_days: number;
}

interface ProgramPickerModalProps {
  userId: string;
  onComplete: () => void;
  currentProgramId?: string | null;
}

export function ProgramPickerModal({ userId, onComplete, currentProgramId }: ProgramPickerModalProps) {
  const [step, setStep] = useState<"pick" | "date">("pick");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [enrolling, setEnrolling] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<{ id: string; current_day: number; assigned_at: string } | null>(null);

  useEffect(() => {
    supabase
      .from("programs")
      .select("id, name, description, total_days")
      .order("name")
      .then(({ data }) => {
        if (data) setPrograms(data as Program[]);
      });
  }, []);

  // When a program is selected, check if there's an existing (inactive) assignment for it
  useEffect(() => {
    if (!selected) return;
    setExistingAssignment(null);
    supabase
      .from("program_assignments")
      .select("id, current_day, assigned_at")
      .eq("user_id", userId)
      .eq("program_id", selected.id)
      .eq("is_active", false)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setExistingAssignment(data[0] as any);
        }
      });
  }, [selected, userId]);

  const handleEnroll = async () => {
    if (!selected) return;
    setEnrolling(true);

    // Deactivate all current active assignments
    await supabase
      .from("program_assignments")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (existingAssignment) {
      // Reactivate existing assignment — user returns to where they left off
      await supabase
        .from("program_assignments")
        .update({ is_active: true })
        .eq("id", existingAssignment.id);
    } else {
      // Create new assignment
      await supabase.from("program_assignments").insert({
        user_id: userId,
        program_id: selected.id,
        current_day: 1,
        assigned_by: userId,
        assigned_at: startDate.toISOString(),
        is_active: true,
      });
    }

    setEnrolling(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 mx-0 sm:mx-4 animate-in slide-in-from-bottom-4 duration-300">
        {step === "pick" ? (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💪</span>
              </div>
              <h2 className="text-xl font-black text-foreground">
                {currentProgramId ? "Switch Program" : "Welcome to the Team!"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentProgramId
                  ? "Pick a program. Your progress on each program is saved."
                  : "Pick a program to get started. You can always switch later."}
              </p>
            </div>
            <div className="space-y-3">
              {programs.map((p) => {
                const isCurrent = p.id === currentProgramId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isCurrent) return;
                      setSelected(p);
                      setStep("date");
                    }}
                    disabled={isCurrent}
                    className={cn(
                      "w-full flex items-center justify-between border rounded-xl p-4 transition-colors text-left",
                      isCurrent
                        ? "bg-primary/10 border-primary/40 opacity-60 cursor-default"
                        : "bg-secondary border-border hover:border-primary/40"
                    )}
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {p.name}
                        {isCurrent && <span className="text-xs text-primary ml-2">(current)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.total_days} days · {Math.round(p.total_days / 7)} weeks
                      </p>
                    </div>
                    {!isCurrent && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
            {currentProgramId && (
              <button
                onClick={onComplete}
                className="w-full mt-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setStep("pick")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {existingAssignment ? "Resume Program" : "Start Date"}
              </p>
              <div className="w-10" />
            </div>
            <div className="space-y-4">
              <div className="bg-secondary border border-border rounded-xl p-4">
                <p className="font-bold text-foreground">{selected?.name}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  {selected?.total_days} day program
                </p>
              </div>

              {existingAssignment ? (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <p className="text-sm font-bold text-foreground">Welcome back!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll pick up where you left off on Day {existingAssignment.current_day}.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                    When do you want to start?
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-left">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {format(startDate, "PPP")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => d && setStartDate(d)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {enrolling
                  ? "Switching..."
                  : existingAssignment
                  ? `Resume Day ${existingAssignment.current_day} 🔄`
                  : "Let's Go 🚀"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
