// Shared bottom nav — persists across standalone routes (e.g. /build-list).
// Non-Home/Roadmap tabs live inside Index; we route to "/?tab=<Label>" so
// Index can pick them up on mount.

import { useLocation, useNavigate } from "react-router-dom";
import { Home, Dumbbell, Map, Menu } from "lucide-react";

const NAV = [
  { icon: Home, label: "Home", route: "/" },
  { icon: Dumbbell, label: "Workout", route: "/?tab=Workout" },
  { icon: Map, label: "Roadmap", route: "/build-list" },
  { icon: Menu, label: "More", route: "/?tab=More" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeLabel =
    pathname.startsWith("/build-list") ? "Roadmap" : "Home"; // Home covers "/" and inner tabs

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40">
      <div className="flex justify-around">
        {NAV.map(({ icon: Icon, label, route }) => {
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
