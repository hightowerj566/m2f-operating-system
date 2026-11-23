// /coach/referrals — referral codes and monthly payout dashboard (coaches/admins).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCents, monthKey, normalizeReferralCode, suggestReferralCode, summarizeMonth } from "@/lib/referrals";

interface Code { id: string; code: string; referrer_name: string; referrer_contact: string | null; payout_cents: number; is_active: boolean; }
interface Member { id: string; code_id: string; display_name: string | null; email: string | null; signed_up_at: string; first_paid_at: string | null; payout_cents: number | null; }
interface Payout { code_id: string; month: string; amount_cents: number; paid_at: string; }

const thisMonth = () => monthKey(new Date().toISOString());
const monthLabel = (m: string) => new Date(m + "T12:00:00Z").toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
const shiftMonth = (m: string, d: number) => { const dt = new Date(m + "T12:00:00Z"); dt.setUTCMonth(dt.getUTCMonth() + d); return monthKey(dt.toISOString()); };
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

export default function CoachReferrals() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<Code[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [month, setMonth] = useState(thisMonth());
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", code: "", payout: "10" });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase.rpc("is_coach_or_admin", { _user_id: user.id }).then(({ data }) => setAllowed(!!data));
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    const { data: c } = await supabase.from("referral_codes").select("*").order("created_at", { ascending: false });
    const list = (c ?? []) as Code[];
    setCodes(list);
    const ids = list.map((x) => x.id);
    if (!ids.length) { setMembers([]); setPayouts([]); return; }
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.rpc("get_referral_members", { _code_ids: ids }),
      supabase.from("referral_payouts").select("code_id, month, amount_cents, paid_at"),
    ]);
    setMembers((m ?? []) as Member[]);
    setPayouts((p ?? []) as Payout[]);
  }, []);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const summary = useMemo(() => summarizeMonth(members, month), [members, month]);

  if (allowed === false) { navigate("/"); return null; }
  if (allowed === null) return <div className="min-h-dvh bg-background" />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeReferralCode(form.code || suggestReferralCode(form.name));
    const cents = Math.round(parseFloat(form.payout || "0") * 100);
    if (!form.name.trim() || !code || !(cents >= 0)) return toast.error("Add a name, code and payout amount.");
    const { error } = await supabase.from("referral_codes").insert({
      code, referrer_name: form.name.trim(), referrer_contact: form.contact.trim() || null, payout_cents: cents, created_by: user!.id,
    });
    if (error) return toast.error(error.message.includes("duplicate") ? "That code is already taken." : error.message);
    toast.success(`Code ${code} created`);
    setForm({ name: "", contact: "", code: "", payout: "10" });
    load();
  };

  const toggle = async (c: Code) => {
    await supabase.from("referral_codes").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  const markPaid = async (c: Code, owed: number, count: number) => {
    const { error } = await supabase.from("referral_payouts").insert({ code_id: c.id, month, amount_cents: owed, referral_count: count, paid_by: user!.id });
    if (error) return toast.error(error.message);
    window.__lovableEvents?.track?.("project.referral_payout_marked_paid", { amount_cents: owed, referral_count: count });
    toast.success(`Marked ${formatCents(owed)} paid to ${c.referrer_name}`);
    load();
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  const link = (code: string) => `${window.location.origin}/auth?mode=signup&ref=${code}`;

  const exportCsv = () => {
    const rows = [["Referrer", "Code", "Signups", "Paying members", "Owed", "Paid on"]];
    for (const c of codes) {
      const s = summary.get(c.id); if (!s) continue;
      const p = payouts.find((x) => x.code_id === c.id && x.month === month);
      rows.push([c.referrer_name, c.code, String(s.signups), String(s.paying), (s.owedCents / 100).toFixed(2), p ? day(p.paid_at) : ""]);
    }
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `referrals-${month.slice(0, 7)}.csv`; a.click();
  };

  const totalOwed = [...summary.values()].reduce((n, s) => n + s.owedCents, 0);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/coach")} aria-label="Back to coach dashboard"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="font-bold">Referrals</h1>
          <p className="text-xs text-muted-foreground">Payouts are earned when a referred member makes his first membership payment.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Create a referral code</h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-5">
            <Input placeholder="Referrer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email or phone" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input placeholder={form.name ? suggestReferralCode(form.name, () => 0.5) : "Code"} value={form.code} onChange={(e) => setForm({ ...form, code: normalizeReferralCode(e.target.value) })} />
            <Input type="number" min="0" step="0.01" aria-label="Payout per paying member ($)" value={form.payout} onChange={(e) => setForm({ ...form, payout: e.target.value })} />
            <Button type="submit">Create</Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>‹</Button>
              <h2 className="font-semibold w-40 text-center">{monthLabel(month)}</h2>
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= thisMonth()}>›</Button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>Owed this month: <strong className="text-primary">{formatCents(totalOwed)}</strong></span>
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </div>
          </div>

          {codes.length === 0 && <p className="text-sm text-muted-foreground">No referral codes yet.</p>}
          {codes.map((c) => {
            const s = summary.get(c.id) ?? { signups: 0, paying: 0, owedCents: 0 };
            const paid = payouts.find((p) => p.code_id === c.id && p.month === month);
            const list = members.filter((m) => m.code_id === c.id && (monthKey(m.signed_up_at) === month || (m.first_paid_at && monthKey(m.first_paid_at) === month)));
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card">
                <div className="p-4 flex flex-wrap items-center gap-4">
                  <button className="text-left flex-1 min-w-[180px]" onClick={() => setOpen(open === c.id ? null : c.id)}>
                    <div className="font-semibold">{c.referrer_name} {!c.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}</div>
                    <div className="text-xs text-muted-foreground">{c.code} · {formatCents(c.payout_cents)} per paying member{c.referrer_contact ? ` · ${c.referrer_contact}` : ""}</div>
                  </button>
                  <div className="text-sm">{s.signups} signups</div>
                  <div className="text-sm">{s.paying} paying</div>
                  <div className="text-sm font-semibold">{formatCents(s.owedCents)}</div>
                  {paid ? (
                    <span className="text-xs text-primary">Paid {formatCents(paid.amount_cents)} on {day(paid.paid_at)}</span>
                  ) : (
                    <Button size="sm" disabled={s.owedCents === 0} onClick={() => markPaid(c, s.owedCents, s.paying)}>Mark paid</Button>
                  )}
                  <Button size="icon" variant="ghost" aria-label="Copy share link" onClick={() => copy(link(c.code))}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(c)}>{c.is_active ? "Deactivate" : "Activate"}</Button>
                </div>
                {open === c.id && (
                  <div className="border-t border-border p-4 text-sm">
                    {list.length === 0 ? <p className="text-muted-foreground">No activity this month.</p> : (
                      <table className="w-full">
                        <thead className="text-xs text-muted-foreground text-left"><tr><th>Member</th><th>Signed up</th><th>First payment</th><th>Status</th></tr></thead>
                        <tbody>{list.map((m) => (
                          <tr key={m.id} className="border-t border-border/50">
                            <td className="py-1">{m.display_name || m.email}</td><td>{day(m.signed_up_at)}</td><td>{day(m.first_paid_at)}</td>
                            <td>{m.first_paid_at ? "Paying" : "Trial / signed up"}</td>
                          </tr>))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
