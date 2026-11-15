import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import LandingPage from "@/pages/LandingPage";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return user ? <Index /> : <LandingPage />;
}
