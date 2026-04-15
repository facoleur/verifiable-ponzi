/**
 * Displays a token amount with its denomination.
 * Handles bigint (raw units with decimals) or pre-formatted strings.
 */

interface TokenAmountProps {
  value: string | null | undefined;
  symbol: string;
}

const sentimentClass: Record<string, string> = {
  buy: "text-[var(--buy)]",
  sell: "text-[var(--sell)]",
  neutral: "text-[var(--text)]",
};

export function TokenAmount({ value, symbol }: TokenAmountProps) {
  return (
    <span className="inline-flex items-baseline gap-0.5 text-xs font-medium">
      <span className="text-slate-800">{value ?? "—"}</span>
      <span className="text-xs text-slate-500">{symbol}</span>
    </span>
  );
}
