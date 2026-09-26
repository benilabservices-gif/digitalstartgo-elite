import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/lib/auth/signout", () => ({
  signOut: vi.fn(),
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

  it("affiche le bouton Plus pour tous les rôles", () => {
    render(<BottomNav role="participant" />);
    expect(screen.getByLabelText("Plus d'options")).toBeInTheDocument();
  });

  it("affiche le bouton Se déconnecter dans Plus pour un participant", async () => {
    render(<BottomNav role="participant" />);
    const moreButton = screen.getByLabelText("Plus d'options");
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(screen.getByText("Se déconnecter")).toBeInTheDocument();
    });
  });

  it("affiche le bouton Se déconnecter dans Plus pour un coach", async () => {
    render(<BottomNav role="coach" />);
    const moreButton = screen.getByLabelText("Plus d'options");
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(screen.getByText("Se déconnecter")).toBeInTheDocument();
    });
  });

  it("affiche le bouton Se déconnecter dans Plus pour un admin", async () => {
    render(<BottomNav role="admin" />);
    const moreButton = screen.getByLabelText("Plus d'options");
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(screen.getByText("Se déconnecter")).toBeInTheDocument();
    });
  });

  it("affiche Cohortes et Abonnements dans Plus pour un admin", async () => {
    render(<BottomNav role="admin" />);
    const moreButton = screen.getByLabelText("Plus d'options");
    fireEvent.click(moreButton);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Cohortes" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Abonnements" })).toBeInTheDocument();
    });
  });
});
