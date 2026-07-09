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
import BuildList from "./pages/BuildList";
import Start from "./pages/Start";
import Plan from "./pages/Plan";
import HerAndBaby from "./pages/HerAndBaby";
import DayOne from "./pages/DayOne";
import WeekReview from "./pages/WeekReview";
import Onboarding from "./pages/Onboarding";
import Readiness from "./pages/Readiness";
import Learn from "./pages/Learn";
import LearnCategory from "./pages/LearnCategory";
import LearnLesson from "./pages/LearnLesson";
import LearnSearch from "./pages/LearnSearch";
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
          <Route path="/readiness" element={<Readiness />} />
          <Route path="/readiness/assessment" element={<FatherAthleteQuiz />} />
          <Route path="/score-reveal" element={<ScoreReveal />} />
          <Route path="/cohort" element={<Cohort />} />
          <Route path="/build-list" element={<BuildList />} />
          <Route path="/start" element={<Start />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/her-and-baby" element={<HerAndBaby />} />
          <Route path="/day-one" element={<DayOne />} />
          <Route path="/week-review" element={<WeekReview />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/search" element={<LearnSearch />} />
          <Route path="/learn/category/:slug" element={<LearnCategory />} />
          <Route path="/learn/lesson/:slug" element={<LearnLesson />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
