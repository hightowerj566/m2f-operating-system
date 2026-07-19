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
import TrainingProfile from "./pages/TrainingProfile";
import Readiness from "./pages/Readiness";
import DailyStandardsPage from "./pages/DailyStandards";
import Learn from "./pages/Learn";
import LearnCategory from "./pages/LearnCategory";
import LearnLesson from "./pages/LearnLesson";
import LearnSearch from "./pages/LearnSearch";
import NotFound from "./pages/NotFound";
import LiveProgram from "./pages/LiveProgram";
import PostBirthWorkout from "./pages/PostBirthWorkout";
import Programs from "./pages/Programs";
import ProgramWorkout from "./pages/ProgramWorkout";
import ProgramStage from "./pages/ProgramStage";
import LiveProgramScheduler from "./pages/coach/LiveProgramScheduler";
import OAuthConsent from "./pages/OAuthConsent";
import WeeklyCheckIn from "./pages/WeeklyCheckIn";
import WeeklyReview from "./pages/WeeklyReview";
import CoachCheckIns from "./pages/coach/CoachCheckIns";
import CoachCheckInReview from "./pages/coach/CoachCheckInReview";

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
          <Route path="/training-profile" element={<TrainingProfile />} />
          <Route path="/father-athlete-quiz" element={<FatherAthleteQuiz />} />
          <Route path="/readiness" element={<Readiness />} />
          <Route path="/readiness/assessment" element={<FatherAthleteQuiz />} />
          <Route path="/daily-standards" element={<DailyStandardsPage />} />
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
          <Route path="/program" element={<LiveProgram />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/workout/:slug" element={<ProgramWorkout />} />
          <Route path="/programs/stage/:slug" element={<ProgramStage />} />
          <Route path="/post-birth-workout" element={<PostBirthWorkout />} />
          <Route path="/coach/scheduler" element={<LiveProgramScheduler />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/weekly-check-in" element={<WeeklyCheckIn />} />
          <Route path="/weekly-review/:weekStart" element={<WeeklyReview />} />
          <Route path="/coach/check-ins" element={<CoachCheckIns />} />
          <Route path="/coach/check-ins/:checkInId" element={<CoachCheckInReview />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
