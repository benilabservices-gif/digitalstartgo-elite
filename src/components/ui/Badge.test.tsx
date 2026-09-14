import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("applique la couleur de tonalité success", () => {
    render(<Badge tone="success">Validé</Badge>);
    expect(screen.getByText("Validé")).toHaveClass("border-success/50");
  });

  it("utilise la tonalité par défaut", () => {
    render(<Badge>À faire</Badge>);
    expect(screen.getByText("À faire")).toHaveClass("border-dark/25");
  });
});
