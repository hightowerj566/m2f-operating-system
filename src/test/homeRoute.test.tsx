import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/pages/Home";

let authState = {
  user: null as { id: string } | null,
  loading: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));
vi.mock("@/pages/Index", () => ({
  default: () => <div data-testid="member-dashboard" />,
}));
vi.mock("@/pages/LandingPage", () => ({
  default: () => <div data-testid="public-landing" />,
}));

describe("home route audience", () => {
  it("shows the public landing page to logged-out visitors", () => {
    authState = { user: null, loading: false };
    render(<Home />);
    expect(screen.getByTestId("public-landing")).toBeInTheDocument();
    expect(screen.queryByTestId("member-dashboard")).not.toBeInTheDocument();
  });

  it("keeps signed-in members on their existing dashboard", () => {
    authState = { user: { id: "member-1" }, loading: false };
    render(<Home />);
    expect(screen.getByTestId("member-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("public-landing")).not.toBeInTheDocument();
  });

  it("waits for session restoration before choosing a view", () => {
    authState = { user: null, loading: true };
    render(<Home />);
    expect(screen.queryByTestId("public-landing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("member-dashboard")).not.toBeInTheDocument();
  });
});
