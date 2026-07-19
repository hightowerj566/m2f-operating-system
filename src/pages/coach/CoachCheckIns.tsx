// /coach/check-ins — coach review queue (desktop-first, tablet-friendly).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CoachCheckInQueue } from "@/components/coaching/CoachCheckInQueue";

export default function CoachCheckIns() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isCoach, setIsCoach] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle()
      .then(({ data }) => setIsCoach(!!data));
  }, [user, loading, navigate]);

  if (isCoach === false) { navigate("/"); return null; }
  if (isCoach === null) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/coach")} aria-label="Back to coach dashboard"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="font-bold">Weekly Check-Ins</h1>
          <p className="text-xs text-muted-foreground">Review, respond, and set the week for every client.</p>
        </div>
      </header>
      <CoachCheckInQueue />
    </div>
  );
}
