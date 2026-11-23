export function normalizeReferralCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
}

export function suggestReferralCode(name: string, rand: () => number = Math.random): string {
  const base = normalizeReferralCode(name.split(/\s+/)[0] ?? "").replace(/-/g, "").slice(0, 8) || "M2F";
  return `${base}${10 + Math.floor(rand() * 90)}`;
}

/** First day of the month (YYYY-MM-01) in which a timestamp falls, in UTC. */
export function monthKey(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export interface ReferralRow {
  code_id: string;
  signed_up_at: string;
  first_paid_at: string | null;
  payout_cents: number | null;
}

export interface MonthSummary {
  signups: number;
  paying: number;
  owedCents: number;
}

/** Signups count by signup month; payouts are owed in the month of the first real payment. */
export function summarizeMonth(rows: ReferralRow[], month: string): Map<string, MonthSummary> {
  const out = new Map<string, MonthSummary>();
  const get = (id: string) => {
    if (!out.has(id)) out.set(id, { signups: 0, paying: 0, owedCents: 0 });
    return out.get(id)!;
  };
  for (const r of rows) {
    if (monthKey(r.signed_up_at) === month) get(r.code_id).signups++;
    if (r.first_paid_at && monthKey(r.first_paid_at) === month) {
      const s = get(r.code_id);
      s.paying++;
      s.owedCents += r.payout_cents ?? 0;
    }
  }
  return out;
}

export const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;
