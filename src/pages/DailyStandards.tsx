// Standalone route for Daily Standards, opened from Readiness dashboard.
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DailyStandardsTab } from "@/components/tabs/DailyStandardsTab";

export default function DailyStandardsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-2 px-4 pt-5 pb-2 sticky top-0 z-10 bg-background border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
      <DailyStandardsTab />
    </div>
  );
}
