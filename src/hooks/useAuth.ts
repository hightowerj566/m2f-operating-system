import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then restore session
    const init = async () => {
      // If user didn't check "Remember me", sign out on new browser session
      if (!sessionStorage.getItem("forget-session-checked")) {
        sessionStorage.setItem("forget-session-checked", "true");
        const shouldForget = localStorage.getItem("forget-session-flag");
        if (shouldForget) {
          localStorage.removeItem("forget-session-flag");
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
