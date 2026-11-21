import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoreTab } from "@/components/tabs/MoreTab";
import { savePreferredMembershipPlan } from "@/lib/membershipPlanPreference";

const invoke = vi.fn();
const authUser = { id: "member-1", email: "member@example.com" };
const signOut = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authUser, signOut }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/useM2fOs", () => ({
  useDueDatePass: () => ({ hasPass: false, passExpires: null }),
  useOnWaitlist: () => ({ data: false }),
  recordArrival: vi.fn(),
  clearArrival: vi.fn(),
  joinYearOneWaitlist: vi.fn(),
}));

vi.mock("@/components/settings/DemoModeCard", () => ({ DemoModeCard: () => null }));

describe("More tab membership entry point", () => {
  beforeEach(() => {
    localStorage.clear();
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { subscribed: false, subscription_end: null }, error: null });
  });

  it("opens the shared membership offer instead of starting a legacy checkout", async () => {
    const onOpenMembership = vi.fn();
    render(<MoreTab tier={null} onOpenMembership={onOpenMembership} />);

    const button = await screen.findByRole("button", { name: /view membership options/i });
    fireEvent.click(button);

    expect(onOpenMembership).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalledWith("create-checkout", expect.anything());
  });

  it("uses the visitor's monthly choice when the standalone fallback starts checkout", async () => {
    savePreferredMembershipPlan("monthly");
    render(<MoreTab tier={null} />);

    const button = await screen.findByRole("button", { name: /view membership options/i });
    fireEvent.click(button);

    await waitFor(() => expect(invoke).toHaveBeenCalledWith("create-checkout", {
      body: { plan: "monthly" },
    }));
  });
});
