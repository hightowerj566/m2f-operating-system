Update the bottom navigation in `src/pages/Index.tsx` to match the requested tab identity:

1. Change the **Today** tab icon from `CalendarCheck` to a **dumbbell/barbell** icon (`Dumbbell`).
2. Rename the **Fuel** tab to **Macros** and switch its icon to `Utensils` (fork-and-knife, per user preference).
3. Update the `lucide-react` import line to add `Dumbbell` and `Utensils`, and remove now-unused `CalendarCheck` and `BarChart2`.
4. The `case "Fuel" / case "Macros"` render branch already handles both labels, so no extra routing logic is needed.

This keeps the tab bar clean: Home, Today (barbell), Macros, Progress, More.