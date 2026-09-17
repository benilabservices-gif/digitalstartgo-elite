import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { PrintButton } from "./PrintButton";

describe("PrintButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("déclenche l'impression du navigateur au clic", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<PrintButton />);
    fireEvent.click(screen.getByRole("button", { name: "Télécharger en PDF" }));

    expect(printSpy).toHaveBeenCalledOnce();
  });
});
