import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SidebarNav", () => {
  it("n'affiche pas le lien Coach pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Coach" })).not.toBeInTheDocument();
  });

  it("affiche le lien Coach pour un coach", () => {
    render(<SidebarNav role="coach" />);
    expect(screen.getByRole("link", { name: "Coach" })).toHaveAttribute("href", "/coach");
  });

  it("affiche les sections à venir comme non cliquables", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.getByText("Virtuose AI")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Virtuose AI/ })).not.toBeInTheDocument();
  });
});
