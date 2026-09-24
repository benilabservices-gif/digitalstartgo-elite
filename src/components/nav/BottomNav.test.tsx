import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNav", () => {
  it("n'affiche pas Revue pour un participant", () => {
    render(<BottomNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Revue" })).not.toBeInTheDocument();
  });

  it("affiche Revue pour un coach", () => {
    render(<BottomNav role="coach" />);
    expect(screen.getByRole("link", { name: "Revue" })).toHaveAttribute("href", "/coach");
  });

  it("affiche Ressources", () => {
    render(<BottomNav role="participant" />);
    expect(screen.getByRole("link", { name: "Ressources" })).toHaveAttribute("href", "/ressources");
  });
});
