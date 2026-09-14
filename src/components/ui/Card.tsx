export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dark/5 bg-white p-6 shadow-sm">
      {title && <h3 className="mb-3 font-heading text-lg font-bold text-dark">{title}</h3>}
      {children}
    </div>
  );
}
