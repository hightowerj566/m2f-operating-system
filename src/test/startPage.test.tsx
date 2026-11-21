import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Start from "@/pages/Start";

let authState: { user: { id: string } | null; loading: boolean } = { user: null, loading: false };
let profile: { journey: string; due_date: string | null } | null = null;
const from = vi.fn();
const eq = vi.fn();

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      from(table);
      return {
        select: () => ({
          eq: (field: string, value: string) => {
            eq(field, value);
            return { maybeSingle: async () => ({ data: profile }) };
          },
        }),
      };
    },
  },
}));

function renderStart() {
  return render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route path="/start" element={<Start />} />
        <Route path="/auth" element={<div data-testid="auth-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

function calendarDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

beforeEach(() => {
  authState = { user: null, loading: false };
  profile = null;
  from.mockClear();
  eq.mockClear();
});

describe("public Start page", () => {
  it("shows a public introduction with no countdown or profile read on a fresh device", () => {
    renderStart();
    expect(screen.queryByTestId("due-countdown")).not.toBeInTheDocument();
    expect(screen.queryByTestId("postpartum-message")).not.toBeInTheDocument();
    expect(from).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
  });

  it("uses only the signed-in member's valid saved date", async () => {
    authState = { user: { id: "member-1" }, loading: false };
    profile = { journey: "expecting", due_date: calendarDate(3) };
    renderStart();
    await waitFor(() => expect(eq).toHaveBeenCalledWith("user_id", "member-1"));

    fireEvent.click(screen.getByRole("button", { name: /begin my plan/i }));
    expect(screen.getByTestId("due-countdown")).toHaveAttribute("data-days", "3");
  });

  it("asks for a date instead of displaying zero for an invalid saved value", async () => {
    authState = { user: { id: "member-1" }, loading: false };
    profile = { journey: "expecting", due_date: "invalid" };
    renderStart();
    await waitFor(() => expect(eq).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /begin my plan/i }));
    expect(screen.getByRole("button", { name: /set the clock/i })).toBeInTheDocument();
    expect(screen.queryByTestId("due-countdown")).not.toBeInTheDocument();
  });

  it("shows postpartum guidance rather than a negative countdown after the due date", async () => {
    authState = { user: { id: "member-1" }, loading: false };
    profile = { journey: "expecting", due_date: calendarDate(-1) };
    renderStart();
    await waitFor(() => expect(eq).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /begin my plan/i }));
    expect(screen.getByTestId("postpartum-message")).toBeInTheDocument();
    expect(screen.queryByTestId("due-countdown")).not.toBeInTheDocument();
  });
});
