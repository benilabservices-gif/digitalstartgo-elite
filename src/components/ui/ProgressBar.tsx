export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-baseline justify-between">
          <p className="t-meta text-[0.8125rem] text-secondary">{label}</p>
          <p className="t-chiffre text-[0.8125rem] text-dark">{clamped}%</p>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-[3px] w-full overflow-hidden rounded-[1px] bg-dark/12"
      >
        <div
          className="h-full bg-gold transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
