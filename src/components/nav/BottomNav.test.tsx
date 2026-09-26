import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

describe("BottomNav", () => {
  it("n'affiche pas Livrables pour un participant", () => {
    render(<BottomNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Livrables" })).not.toBeInTheDocument();
  });

  it("affiche Livrables pour un coach", () => {
    render(<BottomNav role="coach" />);
    expect(screen.getByRole("link", { name: "Livrables" })).toHaveAttribute("href", "/coach");
  });

  it("affiche Dashboard pour un admin", () => {
    render(<BottomNav role="admin" />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/admin");
  });

  it("affiche Ressources pour un participant", () => {
    render(<BottomNav role="participant" />);
    expect(screen.getByRole("link", { name: "Ressources" })).toHaveAttribute("href", "/ressources");
  });

  it("n'affiche pas Members pour un participant", () => {
    render(<BottomNav role="participant" />);
    expect(screen.queryByRole("link", { name: "Membres" })).not.toBeInTheDocument();
  });
});
