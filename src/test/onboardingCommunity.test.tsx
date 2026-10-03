import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Onboarding from "@/pages/Onboarding";

const navigate = vi.fn();
const update = vi.fn();
const open = vi.fn();
let preview = false;
let email = "dad@example.com";

vi.mock("react-router-dom", () => ({
  Navigate: () => null,
  useNavigate: () => navigate,
  useSearchParams: () => [new URLSearchParams(preview ? "preview=community" : "")],
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "member-1", email }, loading: false }),
}));
vi.mock("@/hooks/useReadiness", () => ({ useAssessmentQuestions: () => ({ data: [] }) }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: table === "profiles" ? { display_name: "Dad", due_date: "2026-11-01" } : null }) }),
      }),
      update: (values: Record<string, unknown>) => {
        update(table, values);
        return { eq: async () => ({ error: null }) };
      },
    }),
  },
}));

beforeEach(() => {
  navigate.mockClear();
  update.mockClear();
  open.mockClear();
  preview = false;
  email = "dad@example.com";
  vi.stubGlobal("open", open);
});

afterEach(() => vi.unstubAllGlobals());

async function reachCommunity() {
  render(<Onboarding />);
  fireEvent.click(await screen.findByRole("button", { name: /continue/i }));
  expect(await screen.findByText("Don’t Do Fatherhood Alone.")).toBeInTheDocument();
  expect(update).toHaveBeenCalledWith("profiles", expect.not.objectContaining({ onboarding_complete: true }));
}

describe("first-login community invitation", () => {
  it("opens the group in a new tab, then lets the member finish", async () => {
    await reachCommunity();
    fireEvent.click(screen.getByRole("button", { name: /join the m2f community/i }));
    expect(open).toHaveBeenCalledWith(
      "https://www.facebook.com/share/g/19MNgZXwkw/?mibextid=wwXIfr",
      "_blank",
      "noopener,noreferrer",
    );
    expect(screen.getByText("You’re Ready.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /enter the app/i }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("profiles", { onboarding_complete: true }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/", { replace: true }));
  });

  it("lets the member skip the group and finish without opening it", async () => {
    await reachCommunity();
    fireEvent.click(screen.getByRole("button", { name: /join later/i }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText("You’re Ready.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /enter the app/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/", { replace: true }));
  });

  it("shows the community directly only for the requested account without changing its setup", async () => {
    preview = true;
    email = "hightowerj566@gmail.com";
    render(<Onboarding />);
    expect(await screen.findByText("Don’t Do Fatherhood Alone.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /join later/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter the app/i }));
    expect(update).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("does not show the preview to another account", async () => {
    preview = true;
    render(<Onboarding />);
    expect(await screen.findByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByText("Don’t Do Fatherhood Alone.")).not.toBeInTheDocument();
  });
});