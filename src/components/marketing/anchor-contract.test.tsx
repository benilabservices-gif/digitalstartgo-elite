import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "./Hero";
import { CommentCaMarche } from "./CommentCaMarche";

describe("contrat d'ancre Hero -> CommentCaMarche", () => {
  it("le lien secondaire du Hero pointe vers l'id réel de CommentCaMarche", () => {
    render(
      <>
        <Hero />
        <CommentCaMarche />
      </>
    );
    const lien = screen.getByRole("link", { name: "Découvrir le programme" });
    const href = lien.getAttribute("href");
    expect(href).toMatch(/^#/);
    const idCible = href!.slice(1);
    const cible = document.getElementById(idCible);
    expect(cible).not.toBeNull();
  });
});
