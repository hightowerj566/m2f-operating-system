import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Coach from "./pages/Coach";
import FatherAthleteQuiz from "./pages/FatherAthleteQuiz";
import ScoreReveal from "./pages/ScoreReveal";
import Cohort from "./pages/Cohort";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/father-athlete-quiz" element={<FatherAthleteQuiz />} />
          <Route path="/readiness" element={<FatherAthleteQuiz />} />
          <Route path="/score-reveal" element={<ScoreReveal />} />
          <Route path="/cohort" element={<Cohort />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
