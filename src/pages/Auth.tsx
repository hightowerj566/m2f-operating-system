import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import m2fLogo from "@/assets/m2f-logo.png.asset.json";
import { Lock } from "lucide-react";

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

interface InvitationPreview {
  id: string;
  email: string;
  first_name: string | null;
  role: string;
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const inviteToken = searchParams.get("invite");

  // Invitation state
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteToken);

  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      const { data, error } = await (supabase as never as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: InvitationPreview[] | null; error: unknown }>;
      }).rpc("get_invitation_by_token", { _token: inviteToken });
      const inv = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (error || !inv) {
        setInvitationError("This invitation link is invalid, already used, or expired.");
      } else {
        setInvitation(inv);
        // Pre-fill as suggestions only — the client can change either field
        setEmail(inv.email);
        setDisplayName(inv.first_name || "");
      }
      setCheckingInvite(false);
    })();
  }, [inviteToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    if (forgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a password reset link.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      if (!rememberMe) localStorage.setItem("forget-session-flag", "true");
      else localStorage.removeItem("forget-session-flag");
      window.location.href = next;
    }
    setLoading(false);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setError(""); setMessage(""); setLoading(true);

    const signupEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke("accept-invitation", {
      body: {
        token: inviteToken,
        email: signupEmail,
        password,
        display_name: displayName || invitation.first_name || undefined,
      },
    });
    if (error || (data as { error?: string })?.error) {
      setError((data as { error?: string })?.error || error?.message || "Could not create account");
      setLoading(false);
      return;
    }

    // Sign in with the just-created credentials
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: signupEmail,
      password,
    });
    if (signInErr) {
      setError("Account created. Please sign in.");
      setLoading(false);
      return;
    }
    window.location.href = "/onboarding";
  };

  if (checkingInvite) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <p className="text-muted-foreground text-sm">Checking invitation…</p>
      </div>
    );
  }

  // Invitation-accept mode
  if (inviteToken) {
    return (
      <div className="flex flex-col min-h-dvh bg-background max-w-md mx-auto px-6 justify-center pt-safe pb-safe">
        <div className="flex flex-col items-center mb-8">
          <img src={m2fLogo.url} alt="M2F" className="w-40 h-40 object-contain mb-2" />
          <p className="text-muted-foreground text-sm mt-1">
            {invitation ? "Set your password to activate your account" : "Invitation"}
          </p>
        </div>

        {invitationError ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-semibold mb-1">Invitation unavailable</p>
            <p className="text-xs text-muted-foreground mb-4">{invitationError}</p>
            <button
              onClick={() => navigate("/auth", { replace: true })}
              className="text-sm text-primary hover:underline"
            >
              Go to sign in
            </button>
          </div>
        ) : invitation ? (
          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="bg-secondary border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Invited email</p>
              <p className="text-sm text-foreground font-semibold mt-0.5">{invitation.email}</p>
            </div>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              required
            />
            <input
              type="password"
              placeholder="Create a password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              required
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up…" : "Activate account"}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  // Sign-in only mode (public signup disabled)
  return (
    <div className="flex flex-col min-h-dvh bg-background max-w-md mx-auto px-6 justify-center pt-safe pb-safe">
      <div className="flex flex-col items-center mb-8">
        <img src={m2fLogo.url} alt="M2F" className="w-56 h-56 object-contain mb-2" />
        <p className="text-muted-foreground text-sm mt-1">
          {forgotMode ? "Reset your password" : "Welcome back"}
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          required
        />
        {!forgotMode && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            required
          />
        )}
        {!forgotMode && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => { setForgotMode(true); setError(""); setMessage(""); }}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {message && <p className="text-primary text-sm">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : forgotMode ? "Send reset link" : "Sign in"}
        </button>
      </form>

      {forgotMode ? (
        <button
          onClick={() => { setForgotMode(false); setError(""); setMessage(""); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Back to sign in
        </button>
      ) : (
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p>
              M2F is invite-only. If you don't have an account, ask your coach for an invitation link.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
