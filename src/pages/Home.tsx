import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import LandingPage from "@/pages/LandingPage";
import { Navigate } from "react-router-dom";
import { isRecognizedMemberDevice } from "@/lib/memberDevice";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return <Index />;
  if (isRecognizedMemberDevice()) return <Navigate to="/auth?next=%2F" replace />;
  return <LandingPage />;
}
