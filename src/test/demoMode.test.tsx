import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoModeCard, DEMO_EMAIL } from "@/components/settings/DemoModeCard";
import { clearDemoRoadmap, readDemoRoadmap, setDemoMilestone } from "@/lib/demoRoadmap";

const getUser = vi.fn();
const updateUser = vi.fn();
const profileUpdate = vi.fn();
const milestoneUpsert = vi.fn();
const milestoneDeleteEq = vi.fn();
const assign = vi.fn();

const realDates = { due_date: "2027-08-20", baby_arrived_at: null, baby_name: null };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => getUser(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: realDates, error: null }) }) }),
          update: (values: unknown) => {
            profileUpdate(values);
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      if (table === "user_milestones") {
        return {
          delete: () => ({ eq: (...args: unknown[]) => {
            milestoneDeleteEq(...args);
            return Promise.resolve({ error: null });
          } }),
          upsert: (...args: unknown[]) => {
            milestoneUpsert(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

describe("Demo Mode roadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } } });
    updateUser.mockResolvedValue({ error: null });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign },
    });
  });

  it("starts with every roadmap task unchecked without deleting real completions", async () => {
    setDemoMilestone("owner-1", "old-demo-task", true);
    render(<DemoModeCard userId="owner-1" email={DEMO_EMAIL} />);

    fireEvent.click(await screen.findByRole("button", { name: "Switch to Pre-Baby Demo" }));

    await waitFor(() => expect(profileUpdate).toHaveBeenCalled());
    expect(readDemoRoadmap("owner-1")).toEqual({});
    expect(updateUser).toHaveBeenCalledWith({ data: { demo_backup: realDates } });
    expect(milestoneDeleteEq).not.toHaveBeenCalled();
    expect(milestoneUpsert).not.toHaveBeenCalled();
    await waitFor(() => expect(assign).toHaveBeenCalledOnce());
  });

  it("keeps real roadmap records untouched when demo exits", async () => {
    getUser.mockResolvedValue({ data: { user: { user_metadata: { demo_backup: realDates } } } });
    setDemoMilestone("owner-1", "demo-task", true);
    render(<DemoModeCard userId="owner-1" email={DEMO_EMAIL} />);

    fireEvent.click(await screen.findByRole("button", { name: "Exit Demo & Restore My Progress" }));

    await waitFor(() => expect(profileUpdate).toHaveBeenCalledWith(realDates));
    expect(milestoneDeleteEq).not.toHaveBeenCalled();
    expect(milestoneUpsert).not.toHaveBeenCalled();
    expect(readDemoRoadmap("owner-1")).toEqual({});
    expect(updateUser).toHaveBeenCalledWith({ data: { demo_backup: null } });
    await waitFor(() => expect(assign).toHaveBeenCalledOnce());
  });

  it("checks and unchecks only the separate demo checklist", () => {
    setDemoMilestone("owner-1", "task-1", true);
    expect(readDemoRoadmap("owner-1")["task-1"]).toEqual(expect.any(String));
    setDemoMilestone("owner-1", "task-1", false);
    expect(readDemoRoadmap("owner-1")).toEqual({});
    setDemoMilestone("owner-1", "task-2", true);
    clearDemoRoadmap("owner-1");
    expect(readDemoRoadmap("owner-1")).toEqual({});
  });
});
