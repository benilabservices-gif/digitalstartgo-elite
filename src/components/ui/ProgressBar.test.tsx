import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("reflète la valeur en pourcentage", () => {
    render(<ProgressBar value={67} label="Progression globale" />);
    const bar = screen.getByRole("progressbar", { name: "Progression globale" });
    expect(bar).toHaveAttribute("aria-valuenow", "67");
  });

  it("plafonne la valeur affichée entre 0 et 100", () => {
    render(<ProgressBar value={140} label="Test" />);
    expect(screen.getByRole("progressbar", { name: "Test" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  });
});
