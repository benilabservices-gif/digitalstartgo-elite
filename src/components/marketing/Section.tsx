export function Section({
  tone,
  id,
  children,
}: {
  tone: "dark" | "light";
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={tone === "dark" ? "bg-navy text-white" : "bg-soft text-dark"}>
      <div className="mx-auto max-w-5xl px-6 py-20">{children}</div>
    </section>
  );
}
