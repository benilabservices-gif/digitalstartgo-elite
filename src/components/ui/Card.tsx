export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2px] border border-dark/12 bg-white p-5">
      {title && <h3 className="t-display-mid mb-2 text-[1.0625rem] text-dark">{title}</h3>}
      {children}
    </div>
  );
}
