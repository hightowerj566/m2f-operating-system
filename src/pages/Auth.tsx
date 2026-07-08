import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import logoImage from "@/assets/refined-performance-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (forgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a password reset link!");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        if (!rememberMe) {
          localStorage.setItem("forget-session-flag", "true");
        } else {
          localStorage.removeItem("forget-session-flag");
        }
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background max-w-md mx-auto px-6 justify-center pt-safe pb-safe">
      <div className="flex flex-col items-center mb-8">
        <img src={logoImage} alt="Refined Performance" className="w-24 h-24 mb-4 object-contain" />
        <h1 className="text-3xl font-black text-foreground">MAN TO FATHER</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {forgotMode ? "Reset your password" : isLogin ? "Welcome back" : "Create your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && !forgotMode && (
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          required
        />
        {!forgotMode && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            required
            minLength={6}
          />
        )}
        {isLogin && !forgotMode && (
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
          {loading ? "..." : forgotMode ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>

      {forgotMode ? (
        <button
          onClick={() => { setForgotMode(false); setError(""); setMessage(""); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Back to Sign In
        </button>
      ) : (
        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      )}
    </div>
  );
}
