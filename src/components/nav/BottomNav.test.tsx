import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNav", () => {
  it("n'affiche pas Coach pour un participant", () => {
    render(<BottomNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Coach" })).not.toBeInTheDocument();
  });

  it("affiche Coach pour un coach", () => {
    render(<BottomNav role="coach" />);
    expect(screen.getByRole("link", { name: "Coach" })).toHaveAttribute("href", "/coach");
  });
});
