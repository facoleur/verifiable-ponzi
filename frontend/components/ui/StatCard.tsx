interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  dim?: boolean;
}

export function StatCard({ label, value, unit, dim }: StatCardProps) {
  return (
    <div className="bg-(--surface) px-[18px] py-4 flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.16em] text-(--muted)">
        {label}
      </span>
      <div className="flex items-baseline gap-[5px]">
        <span
          className={`text-lg font-semibold tracking-[-0.02em] ${dim ? "text-[var(--buy)]" : "text-(--text)"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[11px] text-(--muted) tracking-[0.05em]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
