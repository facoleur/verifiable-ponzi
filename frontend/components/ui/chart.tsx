"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import type { TooltipContentProps } from "recharts";
import { Tooltip } from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

// ── Context ──────────────────────────────────────────────────────────────────

type ChartContextValue = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextValue | null>(null);

export function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />");
  return ctx;
}

// ── ChartContainer ───────────────────────────────────────────────────────────

/**
 * Wraps a recharts chart with config context and injects `--color-{key}` CSS
 * variables so chart elements can reference `var(--color-floor)` etc.
 */
export function ChartContainer({
  id,
  config,
  children,
  className,
}: {
  id?: string;
  config: ChartConfig;
  children: React.ReactElement;
  className?: string;
}) {
  const uid = React.useId();
  const chartId = `chart-${id ?? uid.replace(/:/g, "")}`;

  // Inject --color-{key} vars from config onto the container element
  const style = Object.entries(config)
    .filter(([, v]) => v.color)
    .reduce<React.CSSProperties>(
      (acc, [k, v]) => ({ ...acc, [`--color-${k}`]: v.color }),
      {},
    );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("w-full", className)}
        style={style}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

// ── ChartTooltip (re-export) ─────────────────────────────────────────────────

export { Tooltip as ChartTooltip };

// ── ChartTooltipContent ──────────────────────────────────────────────────────

// recharts injects payload/active/etc. at runtime; callers only set the custom props
type ChartTooltipContentProps = Partial<TooltipContentProps<number, string>> & {
  labelFormatter?: (label: unknown) => React.ReactNode;
  valueFormatter?: (value: number, key: string) => string;
  className?: string;
};

const TOOLTIP_DEFAULT_CLASS =
  "rounded-md border border-slate-200 bg-white/50 px-3.5 py-2.5 text-xs shadow-sm backdrop-blur-lg";

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  className = TOOLTIP_DEFAULT_CLASS,
}: ChartTooltipContentProps) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className={cn(className)}>
      {formattedLabel != null && (
        <div className="mb-1.5 text-xs text-slate-800">{formattedLabel}</div>
      )}
      {payload.map((p) => {
        const key = (p.dataKey ?? p.name) as string;
        const cfg = config[key];
        const displayValue = valueFormatter
          ? valueFormatter(p.value as number, key)
          : String(p.value);
        return (
          <div key={key} className="mt-1 flex justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-800">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {cfg?.label ?? p.name}
            </span>
            <span className="font-medium text-slate-800">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}
