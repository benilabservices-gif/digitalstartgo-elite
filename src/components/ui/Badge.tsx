type Tone = "default" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  default: "bg-dark/5 text-dark",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export function Badge({ tone = "default", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
