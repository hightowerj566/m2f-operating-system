// Shared bottom nav — persists across standalone routes (e.g. /build-list).
// Tabs mirror the in-app nav on Index exactly (Home / Workout / Roadmap / More,
// plus Coach for coaches) so the bar never changes shape between routes.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Dumbbell, Map, Menu, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { icon: Home, label: "Home", route: "/" },
  { icon: Dumbbell, label: "Workout", route: "/?tab=Workout" },
  { icon: Map, label: "Roadmap", route: "/build-list" },
  { icon: Menu, label: "More", route: "/?tab=More" },
];

const COACH_ITEM = { icon: LayoutDashboard, label: "Coach", route: "/coach" };

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "coach")
      .then(({ data }) => {
        if (data && data.length > 0) setIsCoach(true);
      });
  }, [user]);

  const tabParam = new URLSearchParams(search).get("tab");
  const activeLabel =
    pathname.startsWith("/coach") ? "Coach" :
    pathname.startsWith("/build-list") ? "Roadmap" :
    pathname.startsWith("/programs") || pathname.startsWith("/program") ? "Workout" :
    tabParam === "More" ? "More" :
    tabParam === "Workout" ? "Workout" : "Home";

  const items = isCoach ? [...NAV, COACH_ITEM] : NAV;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40">
      <div className="flex justify-around">
        {items.map(({ icon: Icon, label, route }) => {
          const active = activeLabel === label;
          return (
            <button
              key={label}
              onClick={() => navigate(route)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {active ? (
                <span className="bg-primary p-2 rounded-xl">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </span>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
