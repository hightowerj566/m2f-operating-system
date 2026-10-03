// Member's own 1:1 coaching status (read-only; changes are coach/admin-only,
// enforced by a database trigger).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CoachingStatus } from "@/lib/access";

export function useCoachingStatus() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["coaching-status", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles").select("coaching_status").eq("user_id", user!.id).maybeSingle();
      return ((data as { coaching_status?: string } | null)?.coaching_status ?? "none") as CoachingStatus;
    },
  });
  const status = data ?? "none";
  return { status, isActive: status === "active", isLoading: isLoading && !!user?.id };
}
