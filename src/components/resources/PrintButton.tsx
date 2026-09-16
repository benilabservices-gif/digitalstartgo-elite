"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-dark/12 px-4 py-2 text-sm font-semibold text-dark hover:bg-paper"
    >
      Télécharger en PDF
    </button>
  );
}
