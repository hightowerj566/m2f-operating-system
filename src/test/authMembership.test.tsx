import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Auth from "@/pages/Auth";
import { readPreferredMembershipPlan } from "@/lib/membershipPlanPreference";

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

describe("signup membership plan", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/auth?mode=signup&plan=monthly");
    localStorage.clear();
    signUp.mockReset();
  });

  it("stores the public monthly selection without creating an account early", async () => {
    render(
      <MemoryRouter initialEntries={["/auth?mode=signup&plan=monthly"]}>
        <Routes><Route path="/auth" element={<Auth />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    await waitFor(() => expect(readPreferredMembershipPlan()).toBe("monthly"));
    expect(signUp).not.toHaveBeenCalled();
  });
});
