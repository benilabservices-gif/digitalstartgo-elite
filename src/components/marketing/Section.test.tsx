import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("applique le fond sombre et l'id fourni", () => {
    render(
      <Section tone="dark" id="ma-section">
        <p>Contenu</p>
      </Section>
    );
    const section = screen.getByText("Contenu").closest("section");
    expect(section).toHaveAttribute("id", "ma-section");
    expect(section).toHaveClass("bg-ink");
  });

  it("applique le fond clair par défaut sans id", () => {
    render(
      <Section tone="light">
        <p>Autre contenu</p>
      </Section>
    );
    const section = screen.getByText("Autre contenu").closest("section");
    expect(section).not.toHaveAttribute("id");
    expect(section).toHaveClass("bg-paper");
  });

  it("applique les classes d'animation reveal au montage", () => {
    render(
      <Section tone="light" id="test-section">
        <p>Test</p>
      </Section>
    );
    const section = screen.getByText("Test").closest("section");
    expect(section).toHaveClass("transition-opacity", "duration-700", "ease-out");
  });
});
