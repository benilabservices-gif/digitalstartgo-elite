import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("affiche un titre optionnel et son contenu", () => {
    render(<Card title="Ma mission">Contenu</Card>);
    expect(screen.getByText("Ma mission")).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });
});
