export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dark/15 bg-white p-6">
      {title && <h3 className="mb-3 font-heading text-lg font-semibold text-dark">{title}</h3>}
      {children}
    </div>
  );
}
