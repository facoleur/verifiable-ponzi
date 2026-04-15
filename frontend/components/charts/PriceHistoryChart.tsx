"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useG50History } from "../../hooks/useG50History";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";

function formatEth(v: number) {
  if (v === 0) return "0";
  if (v >= 1) return v.toFixed(4);
  return v.toPrecision(4);
}

export function PriceHistoryChart() {
  const t = useTranslations("PriceHistoryChart");
  const { history, isLoading } = useG50History();

  // Populate labels from translations so ChartTooltipContent can use them
  const config: ChartConfig = {
    floor: { label: t("floorArea"), color: "var(--chart-primary)" },
    ceiling: { label: t("ceilingArea"), color: "var(--chart-secondary)" },
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-slate-300/50 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-slate-800">{t("title")}</div>
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--chart-primary)" }}
            />
            {t("floorLegend")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--chart-secondary)" }}
            />
            {t("ceilingLegend")}
          </span>
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 p-4 px-2 pb-2">
        {isLoading && (
          <div className="flex h-55 items-center justify-center px-6 text-center text-xs leading-relaxed text-slate-500">
            {t("loading")}
          </div>
        )}
        {!isLoading && history.length === 0 && (
          <div className="flex h-55 items-center justify-center px-6 text-center text-xs leading-relaxed text-slate-500">
            {t("noUpdates")}
          </div>
        )}
        {!isLoading && history.length > 0 && (
          <ChartContainer config={config}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={history}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="block"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatEth}
                  width={60}
                />
                <Tooltip
                  wrapperStyle={{
                    background: "rgb(255 255 255 / 0.30)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgb(255 255 255 / 0.5)",
                    borderRadius: "12px",
                    padding: "0.5rem",
                  }}
                  animationDuration={50}
                  content={
                    <ChartTooltipContent
                      className="text-slate-500 [&_span]:text-slate-600"
                      labelFormatter={(block) =>
                        t("tooltipBlock", { block: block as number })
                      }
                      valueFormatter={(v) => `${formatEth(v)} ETH`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="floor"
                  name={t("floorArea")}
                  stroke="var(--color-floor)"
                  strokeWidth={2}
                  fill="var(--color-floor)"
                  fillOpacity={0.1}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="ceiling"
                  name={t("ceilingArea")}
                  stroke="var(--color-ceiling)"
                  strokeWidth={2}
                  fill="var(--color-ceiling)"
                  fillOpacity={0.1}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
