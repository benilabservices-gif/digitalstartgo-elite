import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock Supabase client for SidebarNav
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })),
  })),
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

describe("SidebarNav", () => {
  it("n'affiche pas le lien Livrables à revoir pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Livrables à revoir" })).not.toBeInTheDocument();
  });

  it("affiche le lien Livrables à revoir pour un coach", () => {
    render(<SidebarNav role="coach" />);
    expect(screen.getByRole("link", { name: "Livrables à revoir" })).toHaveAttribute("href", "/coach");
  });

  it("n'affiche pas les liens Admin pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Vue d'ensemble" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Membres" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cohortes" })).not.toBeInTheDocument();
  });

  it("affiche les liens Admin pour un admin", () => {
    render(<SidebarNav role="admin" />);
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Membres" })).toHaveAttribute("href", "/admin/membres");
    expect(screen.getByRole("link", { name: "Cohortes" })).toHaveAttribute("href", "/admin/cohorts");
    expect(screen.getByRole("link", { name: "Abonnements" })).toHaveAttribute("href", "/admin/abonnements");
    expect(screen.getByRole("link", { name: "Livrables" })).toHaveAttribute("href", "/admin/livrables");
  });

  it("n'affiche pas le menu Parcours pour un admin", () => {
    render(<SidebarNav role="admin" />);
    expect(screen.queryByText("Le Parcours")).not.toBeInTheDocument();
  });

  it("affiche le menu Parcours pour un participant", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.getByText("Le Parcours")).toBeInTheDocument();
  });

  it("affiche Mes participants pour un coach", () => {
    render(<SidebarNav role="coach" />);
    expect(screen.getByRole("link", { name: "Mes participants" })).toHaveAttribute("href", "/coach/participants");
  });
});
