// Shows children only to active 1:1 coaching clients. Database triggers
// enforce the same rule server-side; this just hides the UI.
import { useNavigate } from "react-router-dom";
import { useCoachingStatus } from "@/hooks/useCoachingStatus";
import { Button } from "@/components/ui/button";

export function CoachingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isActive, isLoading } = useCoachingStatus();
  if (isLoading) return <div className="min-h-dvh bg-background" />;
  if (isActive) return <>{children}</>;
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-lg font-bold">Weekly coaching is part of 1:1 Coaching</h1>
        <p className="text-sm text-muted-foreground">
          Your membership includes the full plan, training and nutrition. Weekly check-ins with a coach come with M2F 1:1 Coaching.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    </div>
  );
}
