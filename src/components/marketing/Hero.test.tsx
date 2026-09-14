import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("le CTA principal pointe vers /signup", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Construire mon système de vente" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("le lien de connexion pointe vers /login", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Déjà un compte ? Se connecter" })).toHaveAttribute(
      "href",
      "/login"
    );
  });
});
