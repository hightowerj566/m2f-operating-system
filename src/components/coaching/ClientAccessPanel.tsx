// Coach/admin view of a client's access, 1:1 coaching status and Stripe
// subscription, with Start / Pause / Resume / End coaching actions.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ACCESS_SOURCE_LABEL, COACHING_STATUS_LABEL, resolveAccess, type CoachingStatus } from "@/lib/access";

interface Sub {
  status: string; cancel_at_period_end: boolean; interval: string | null;
  amount_cents: number | null; currency: string; started_at: string | null;
  trial_end: string | null; current_period_end: string | null;
}
interface Details {
  coaching_status: CoachingStatus; coaching_started_at: string | null;
  coach_name: string | null; is_staff: boolean; subscription: Sub | null;
}

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
function stripeLabel(s: Sub | null) {
  if (!s) return "None";
  if (s.status === "active" && s.cancel_at_period_end) return "Canceling";
  return ({ active: "Active", trialing: "Trialing", past_due: "Past Due", canceled: "Canceled", unpaid: "Past Due" } as Record<string, string>)[s.status] ?? s.status;
}

export function ClientAccessPanel({ clientId, isAdmin, onChanged }: { clientId: string; isAdmin: boolean; onChanged?: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<Details | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const load = useCallback(async () => {
    setD(null);
    const { data, error } = await supabase.functions.invoke("client-access-details", { body: { client_id: clientId } });
    if (!error && data && !data.error) setD(data as Details);
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: "active" | "paused" | "ended") => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("set-coaching-status", { body: { client_id: clientId, status } });
    setBusy(false);
    if (error || data?.error) { toast({ title: "Couldn't update coaching", variant: "destructive" }); return; }
    toast({ title: COACHING_STATUS_LABEL[status] });
    await load();
    onChanged?.();
  };

  if (!d) return <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">Loading access…</div>;

  const access = resolveAccess({ isCoachOrAdmin: d.is_staff, coachingStatus: d.coaching_status, stripeStatus: d.subscription?.status });
  const s = d.subscription;
  const status = d.coaching_status;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Access</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${status === "active" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {status === "none" && access.source === "stripe" ? "Regular Member" : COACHING_STATUS_LABEL[status]}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-muted-foreground">M2F Access</dt><dd className="font-semibold">{access.hasAccess ? "Active" : "None"}</dd>
        <dt className="text-muted-foreground">Access Source</dt><dd className="font-semibold">{ACCESS_SOURCE_LABEL[access.source]}</dd>
        <dt className="text-muted-foreground">Coach</dt><dd>{d.coach_name ?? "—"}</dd>
        <dt className="text-muted-foreground">Coaching started</dt><dd>{fmtDate(d.coaching_started_at)}</dd>
      </dl>

      {access.duplicateBillingWarning && (
        <p className="text-xs font-semibold text-destructive border border-destructive/40 rounded-md px-2 py-1.5">
          Active Stripe subscription while 1:1 coaching is active
        </p>
      )}

      {isAdmin && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">Subscription</p>
          <dl className="grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Stripe Status</dt><dd className="font-semibold">{stripeLabel(s)}</dd>
            <dt className="text-muted-foreground">Plan</dt><dd>{s?.interval === "year" ? "Annual" : s?.interval === "month" ? "Monthly" : "—"}</dd>
            {s ? (
              <>
                <dt className="text-muted-foreground">Price</dt>
                <dd>{s.amount_cents != null ? `$${(s.amount_cents / 100).toFixed(2)}/${s.interval === "year" ? "year" : "month"}` : "—"}</dd>
                <dt className="text-muted-foreground">Started</dt><dd>{fmtDate(s.started_at)}</dd>
                <dt className="text-muted-foreground">Trial ends</dt><dd>{fmtDate(s.trial_end)}</dd>
                <dt className="text-muted-foreground">{s.cancel_at_period_end ? "Ends" : "Renews"}</dt><dd>{fmtDate(s.current_period_end)}</dd>
              </>
            ) : status === "active" ? (
              <><dt className="text-muted-foreground">Billing</dt><dd>Included with 1:1 Coaching</dd></>
            ) : null}
          </dl>
        </div>
      )}

      {!d.is_staff && (
        <div className="flex flex-wrap gap-2">
          {(status === "none" || status === "ended") && (
            <Button size="sm" disabled={busy} onClick={() => setStatus("active")}>Start 1:1 Coaching</Button>
          )}
          {status === "active" && (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus("paused")}>Pause</Button>
          )}
          {status === "paused" && (
            <Button size="sm" disabled={busy} onClick={() => setStatus("active")}>Resume</Button>
          )}
          {(status === "active" || status === "paused") && (
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => setConfirmEnd(true)}>End 1:1 Coaching</Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End 1:1 coaching?</AlertDialogTitle>
            <AlertDialogDescription>
              Weekly check-ins and coach feedback stop. Their coaching history and nutrition stay.
              {s && ["active", "trialing"].includes(s.status)
                ? " They have an active Stripe membership, so their app access continues."
                : " They have no active Stripe membership, so they'll see the membership page to keep using the app."}
              {" "}Stripe billing is not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setStatus("ended")}>End Coaching</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
