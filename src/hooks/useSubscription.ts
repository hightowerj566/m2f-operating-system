import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTierFromProductId, type SubscriptionTier } from "@/lib/subscriptionTiers";

interface SubscriptionState {
  loading: boolean;
  subscribed: boolean;
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
}

// TEMP: Free-access flag. Set to `false` to re-enable subscription gating.
// Search for FREE_ACCESS_TEMP to find every gate we opened up.
export const FREE_ACCESS_TEMP = true;

export function useSubscription(userId: string | undefined): SubscriptionState {
  const [loading, setLoading] = useState(!FREE_ACCESS_TEMP);
  const [subscribed, setSubscribed] = useState(FREE_ACCESS_TEMP);
  const [tier, setTier] = useState<SubscriptionTier>(FREE_ACCESS_TEMP ? "performance" : null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setSubscribed(data.subscribed ?? false);
        setTier(getTierFromProductId(data.product_id ?? null));
        setSubscriptionEnd(data.subscription_end ?? null);
        setCancelAtPeriodEnd(data.cancel_at_period_end ?? false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [userId, refresh]);

  // Aggressive polling after checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      let attempts = 0;
      const maxAttempts = 10;
      const poll = async () => {
        attempts++;
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            setSubscribed(true);
            setTier(getTierFromProductId(data.product_id ?? null));
            setSubscriptionEnd(data.subscription_end ?? null);
            setCancelAtPeriodEnd(data.cancel_at_period_end ?? false);
            setLoading(false);
            return;
          }
        } catch {}
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      };
      setLoading(true);
      setTimeout(poll, 2000);
    }
  }, []);

  return { loading, subscribed, tier, subscriptionEnd, cancelAtPeriodEnd, refresh };
}
