// Coach/Admin: create and manage one-time client invitations.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Copy, Mail, Plus, Check, Clock, X } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  first_name: string | null;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  assigned_coach_id: string | null;
}

export function InvitationsTab({ isAdmin }: { isAdmin: boolean }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<"client" | "coach" | "admin">("client");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_invitations" as never)
      .select("*")
      .order("created_at", { ascending: false });
    setInvitations((data as never as Invitation[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inviteUrl = (token: string) => `${window.location.origin}/auth?invite=${token}`;

  const handleCreate = async () => {
    if (!email.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-invitation", {
      body: { email: email.trim(), first_name: firstName.trim() || null, role },
    });
    setCreating(false);
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error || error?.message || "Could not create invitation";
      toast({ title: "Invitation failed", description: msg, variant: "destructive" });
      return;
    }
    const url = (data as { invite_url: string }).invite_url;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast({ title: "Invitation created", description: "Link copied to clipboard." });
    setEmail(""); setFirstName(""); setRole("client");
    load();
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(inviteUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  };

  const revoke = async (id: string) => {
    // "Revoke" = expire immediately
    await supabase.from("client_invitations" as never)
      .update({ expires_at: new Date().toISOString() } as never)
      .eq("id", id);
    load();
  };

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-black text-foreground mb-1">Invitations</h2>
      <p className="text-sm text-muted-foreground mb-6">
        This platform is invite-only. Create an invitation and share the one-time link with the new member.
      </p>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">New invitation</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
          />
          <input
            type="text"
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
          />
          {isAdmin && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "client" | "coach" | "admin")}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
            >
              <option value="client">Client</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !email.trim()}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {creating ? "Creating…" : "Create invitation"}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">History</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => {
              const expired = !inv.accepted_at && new Date(inv.expires_at).getTime() < Date.now();
              const status = inv.accepted_at ? "accepted" : expired ? "expired" : "pending";
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate">{inv.email}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border uppercase tracking-wider text-muted-foreground">
                        {inv.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {status === "accepted" && <>Accepted {new Date(inv.accepted_at!).toLocaleDateString()}</>}
                      {status === "pending" && <>Expires {new Date(inv.expires_at).toLocaleDateString()}</>}
                      {status === "expired" && <>Expired</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status === "pending" && (
                      <>
                        <button
                          onClick={() => copyLink(inv.token)}
                          className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-secondary transition-colors"
                        >
                          {copied === inv.token ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
                        </button>
                        <button
                          onClick={() => revoke(inv.id)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1.5"
                          title="Revoke"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {status === "accepted" && <Check className="w-4 h-4 text-primary" />}
                    {status === "expired" && <Clock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
