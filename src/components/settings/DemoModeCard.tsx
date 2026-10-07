// Demo mode: lets the owner account switch its own profile into pre-baby with
// an example due date, then restore the real dates. Writes the real profile so
// every screen reflects it; the original values are kept in localStorage.
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MonitorPlay } from "lucide-react";

export const DEMO_EMAIL = "hightowerj566@gmail.com";
const KEY = "m2f-demo-backup";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 16 * 7);
  return d.toISOString().slice(0, 10);
}

export function DemoModeCard({ userId, email }: { userId: string; email?: string | null }) {
  const qc = useQueryClient();
  const [backup, setBackup] = useState<string | null>(() => localStorage.getItem(KEY));
  const [due, setDue] = useState(defaultDue());
  const [busy, setBusy] = useState(false);

  useEffect(() => setBackup(localStorage.getItem(KEY)), []);
  if (email?.toLowerCase() !== DEMO_EMAIL) return null;

  const refresh = () => { qc.invalidateQueries(); setTimeout(() => window.location.assign("/"), 300); };

  const start = async () => {
    setBusy(true);
    const { data: p } = await db.from("profiles").select("due_date, baby_arrived_at, baby_name").eq("user_id", userId).maybeSingle();
    if (!backup) localStorage.setItem(KEY, JSON.stringify(p ?? {}));
    const { error } = await db.from("profiles").update({ due_date: due, baby_arrived_at: null }).eq("user_id", userId);
    setBusy(false);
    if (error) return toast({ title: "Couldn't start demo", description: error.message, variant: "destructive" });
    setBackup(localStorage.getItem(KEY));
    toast({ title: "Demo mode on", description: `Pre-baby, due ${due}` });
    refresh();
  };

  const exit = async () => {
    if (!backup) return;
    setBusy(true);
    const b = JSON.parse(backup);
    const { error } = await db.from("profiles").update({
      due_date: b.due_date ?? null, baby_arrived_at: b.baby_arrived_at ?? null, baby_name: b.baby_name ?? null,
    }).eq("user_id", userId);
    setBusy(false);
    if (error) return toast({ title: "Couldn't exit demo", description: error.message, variant: "destructive" });
    localStorage.removeItem(KEY);
    setBackup(null);
    toast({ title: "Demo mode off", description: "Your real dates are back." });
    refresh();
  };

  return (
    <div className="bg-card border border-primary/40 rounded-xl p-4 mb-2 space-y-3">
      <div className="flex items-center gap-3">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm text-foreground flex-1">Demo Mode</span>
        {backup && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ON</span>}
      </div>
      <p className="text-xs text-muted-foreground">Show the app as an expecting dad. Pick any example due date.</p>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
      <button onClick={start} disabled={busy || !due}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-50">
        {backup ? "Update Demo Due Date" : "Switch to Pre-Baby Demo"}
      </button>
      {backup && (
        <button onClick={exit} disabled={busy}
          className="w-full py-2.5 rounded-lg border border-border text-foreground font-semibold text-xs disabled:opacity-50">
          Exit Demo & Restore My Dates
        </button>
      )}
    </div>
  );
}
