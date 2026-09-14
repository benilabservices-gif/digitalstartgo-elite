type Tone = "default" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  default: "border-dark/25 text-dark",
  success: "border-success/50 text-success",
  warning: "border-warning/50 text-warning",
  error: "border-error/50 text-error",
};

const pointClasses: Record<Tone, string> = {
  default: "bg-dark/40",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

export function Badge({ tone = "default", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`t-meta inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-[3px] text-xs ${toneClasses[tone]}`}
    >
      <span aria-hidden="true" className={`h-[5px] w-[5px] ${pointClasses[tone]}`} />
      {children}
    </span>
  );
}
