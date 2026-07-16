import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Supabase JS `auth.oauth` is beta; keep a small typed wrapper so TS is happy.
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load authorization request");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message);
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError("No redirect returned by the authorization server.");
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? "Request failed");
    }
  }

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full bg-secondary border border-border rounded-2xl p-6">
          <h1 className="text-xl font-bold text-foreground mb-2">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "an app";

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-6 py-12">
      <div className="max-w-md w-full bg-secondary border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Connect {clientName} to M2F
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {clientName} will be able to call this app's enabled tools while you are signed in.
          This does not bypass M2F's permissions or backend policies.
        </p>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Access</span>
            <span className="text-foreground">Read your Build List, Readiness, and program</span>
          </div>
          {details.client?.redirect_uris?.[0] && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Redirect</span>
              <span className="text-foreground text-xs break-all text-right">
                {details.client.redirect_uris[0]}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-background transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {busy ? "…" : "Approve"}
          </button>
        </div>
      </div>
    </main>
  );
}
