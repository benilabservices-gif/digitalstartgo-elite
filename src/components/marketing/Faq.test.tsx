import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Faq } from "./Faq";

describe("Faq", () => {
  it("un item fermé par défaut s'ouvre au clic", () => {
    render(<Faq />);
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Combien de temps dure le programme ?"));
    expect(screen.getByText(/Le parcours en 8 étapes/)).toBeInTheDocument();
  });

  it("ouvrir un second item ferme le premier", () => {
    render(<Faq />);
    fireEvent.click(screen.getByText("Combien de temps dure le programme ?"));
    fireEvent.click(screen.getByText("Ai-je besoin d'une audience pour commencer ?"));
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
    expect(screen.getByText(/Non\. Le programme vous aide/)).toBeInTheDocument();
  });

  it("re-cliquer l'item ouvert le referme", () => {
    render(<Faq />);
    const question = screen.getByText("Combien de temps dure le programme ?");
    fireEvent.click(question);
    fireEvent.click(question);
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
  });
});
