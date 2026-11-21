import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LandingPage from "@/pages/LandingPage";

describe("public membership signup links", () => {
  it("carries the selected monthly plan into every free-trial signup link", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));

    const signupLinks = screen.getAllByRole("link").filter((link) =>
      link.getAttribute("href")?.includes("/auth?mode=signup"),
    );
    expect(signupLinks.length).toBeGreaterThan(0);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/auth?mode=signup&plan=monthly");
    }
  });
});
