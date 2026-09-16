export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="w-full">
      {label && <p className="mb-1 text-sm font-medium text-dark">{label}</p>}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-dark/10"
      >
        <div
          className="h-full rounded-full bg-royal transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
