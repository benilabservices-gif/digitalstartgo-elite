type Tone = "default" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  default: "border-dark/25 text-dark",
  success: "border-success/50 text-success",
  warning: "border-warning/50 text-warning",
  error: "border-error/50 text-error",
};

export function Badge({ tone = "default", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
