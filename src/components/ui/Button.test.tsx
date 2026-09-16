import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("affiche son libellé et déclenche onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuer</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applique le style secondaire", () => {
    render(<Button variant="secondary">Annuler</Button>);
    expect(screen.getByRole("button", { name: "Annuler" })).toHaveClass("bg-white");
  });
});
