import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExempleBadge } from "./ExempleBadge";

describe("ExempleBadge", () => {
  it("affiche le texte \"Exemple\"", () => {
    render(<ExempleBadge />);
    expect(screen.getByText("Exemple")).toBeInTheDocument();
  });
});
