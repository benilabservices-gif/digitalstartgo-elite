/**
 * PremiumCard — carte réutilisable pour toutes les pages app.
 * Variante « premium » avec bordure subtile, hover lift et ombre dorée.
 */
export function PremiumCard({
  title,
  subtitle,
  badge,
  children,
  className = "",
  glow = false,
}: {
  title?: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-[2px] border bg-white p-6 transition-all duration-300 ${
        glow
          ? "border-gold/30 shadow-[0_8px_32px_rgba(240,185,40,0.12)]"
          : "border-dark/8 shadow-sm hover:shadow-md hover:-translate-y-0.5"
      } ${className}`}
    >
      {(title || badge) && (
        <div className="mb-5 flex items-baseline gap-3">
          {title && (
            <h3 className="t-display-mid text-[1.0625rem] text-dark">{title}</h3>
          )}
          {badge && (
            <span className="t-meta rounded-[2px] border border-ochre/30 px-2 py-0.5 text-[0.6875rem] text-ochre">
              {badge}
            </span>
          )}
          {subtitle && (
            <p className="flex-1 text-[0.8125rem] text-secondary">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * StatBadge — badge de métrique pour dashboard.
 */
export function StatBadge({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "gold" | "success" | "error";
}) {
  const toneClasses = {
    default: "bg-paper text-dark border-dark/8",
    gold: "bg-ink text-paper border-gold/30",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-error/10 text-error border-error/20",
  };

  return (
    <div
      className={`rounded-[2px] border p-4 ${toneClasses[tone]} transition-all hover:shadow-sm`}
    >
      <p className="t-meta text-[0.6875rem] uppercase tracking-widest text-secondary/70">
        {label}
      </p>
      <p className={`mt-1 t-chiffre text-2xl leading-none ${tone === "gold" ? "text-gold" : "text-dark"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[0.75rem] text-secondary">{sub}</p>}
    </div>
  );
}

/**
 * SectionHeading — entête de section réutilisable dans les pages app.
 */
export function SectionHeading({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {label && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
          {label}
        </p>
      )}
      <h1 className="t-display-mid text-[clamp(1.75rem,4vw,2.5rem)] text-dark">{title}</h1>
      {description && (
        <p className="mt-2 max-w-[54ch] text-[1.0625rem] text-secondary">{description}</p>
      )}
    </div>
  );
}

/**
 * StepIndicator — barre de progression horizontale pour les étapes.
 */
export function StepIndicator({
  current,
  total,
  stages,
}: {
  current: number;
  total: number;
  stages: { number: number; title: string }[];
}) {
  const progress = Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="t-meta text-[0.75rem] text-secondary">Progression globale</span>
        <span className="t-chiffre text-[0.875rem] text-dark">{progress}%</span>
      </div>
      <div className="h-[4px] w-full overflow-hidden rounded-full bg-dark/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-amber transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <span
            key={s.number}
            className={`t-meta rounded-[2px] px-2 py-0.5 text-[0.625rem] ${
              s.number <= current
                ? "bg-gold/20 text-ochre"
                : "bg-dark/5 text-secondary/50"
            }`}
          >
            {String(s.number).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}
