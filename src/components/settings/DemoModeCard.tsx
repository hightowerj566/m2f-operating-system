// Demo mode: lets the owner account switch its own profile into pre-baby with
// an example due date, then restore the real dates. The original values are
// saved on the account (auth user metadata) so they survive any device/browser.
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MonitorPlay } from "lucide-react";

export const DEMO_EMAIL = "hightowerj566@gmail.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Backup = { due_date: string | null; baby_arrived_at: string | null; baby_name: string | null };

function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 16 * 7);
  return d.toISOString().slice(0, 10);
}

export function DemoModeCard({ userId, email }: { userId: string; email?: string | null }) {
  const qc = useQueryClient();
  const [backup, setBackup] = useState<Backup | null>(null);
  const [due, setDue] = useState(defaultDue());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setBackup((data.user?.user_metadata?.demo_backup as Backup) ?? null);
    });
  }, []);
  if (email?.toLowerCase() !== DEMO_EMAIL) return null;

  const refresh = () => { qc.invalidateQueries(); setTimeout(() => window.location.assign("/"), 300); };

  const start = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    let saved = (u.user?.user_metadata?.demo_backup as Backup) ?? null;
    if (!saved) {
      const { data: p } = await db.from("profiles").select("due_date, baby_arrived_at, baby_name").eq("user_id", userId).maybeSingle();
      saved = { due_date: p?.due_date ?? null, baby_arrived_at: p?.baby_arrived_at ?? null, baby_name: p?.baby_name ?? null };
      const { error: mErr } = await supabase.auth.updateUser({ data: { demo_backup: saved } });
      if (mErr) { setBusy(false); return toast({ title: "Couldn't save your real dates", description: mErr.message, variant: "destructive" }); }
    }
    const { error } = await db.from("profiles").update({ due_date: due, baby_arrived_at: null }).eq("user_id", userId);
    setBusy(false);
    if (error) return toast({ title: "Couldn't start demo", description: error.message, variant: "destructive" });
    setBackup(saved);
    toast({ title: "Demo mode on", description: `Pre-baby, due ${due}` });
    refresh();
  };

  const exit = async () => {
    if (!backup) return;
    setBusy(true);
    const { error } = await db.from("profiles").update(backup).eq("user_id", userId);
    if (error) { setBusy(false); return toast({ title: "Couldn't exit demo", description: error.message, variant: "destructive" }); }
    await supabase.auth.updateUser({ data: { demo_backup: null } });
    setBusy(false);
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
