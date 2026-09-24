import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SidebarNav", () => {
  it("n'affiche pas le lien Revue coach pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Revue coach" })).not.toBeInTheDocument();
  });

  it("affiche le lien Revue coach pour un coach", () => {
    render(<SidebarNav role="coach" />);
    expect(screen.getByRole("link", { name: "Revue coach" })).toHaveAttribute("href", "/coach");
  });

  it("affiche les sections à venir comme non cliquables", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.getByText("Virtuose AI")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Virtuose AI/ })).not.toBeInTheDocument();
  });

  it("affiche Ressources comme lien actif, plus dans les sections à venir", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.getByRole("link", { name: "Ressources" })).toHaveAttribute("href", "/ressources");
  });

  it("n'affiche pas les liens Admin pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Cohortes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abonnements" })).not.toBeInTheDocument();
  });

  it("affiche les liens Admin pour un admin", () => {
    render(<SidebarNav role="admin" />);
    expect(screen.getByRole("link", { name: "Cohortes" })).toHaveAttribute("href", "/admin/cohorts");
    expect(screen.getByRole("link", { name: "Abonnements" })).toHaveAttribute("href", "/admin/abonnements");
  });
});
