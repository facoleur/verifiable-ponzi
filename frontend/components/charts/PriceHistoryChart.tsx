"use client";

import {
  CHART_GRID_COLOR,
  CHART_TICK_STYLE,
  TOOLTIP_BACKGROUND,
  TOOLTIP_BORDER,
} from "@/components/charts/colors";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBlock } from "../../hooks/useBlock";
import { type PricePoint, useG50History } from "../../hooks/useG50History";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";

const MIN_DISPLAY_POINTS = 10;
const MAX_DISPLAY_POINTS = 24;
const TARGET_BLOCKS_PER_POINT = 5;

function formatEth(v: number) {
  if (v === 0) return "0";
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(4);
}

function formatEthAxis(v: number) {
  if (v === 0) return "0";
  return v.toFixed(2);
}

function PriceHistoryYAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: number };
}) {
  return (
    <text
      x={x - 4}
      y={y}
      dy={4}
      textAnchor="end"
      fill={CHART_TICK_STYLE.fill}
      fontSize={CHART_TICK_STYLE.fontSize}
    >
      {formatEthAxis(Number(payload?.value ?? 0))}
    </text>
  );
}

function buildDisplayHistory(
  history: PricePoint[],
  currentBlockNumber: number | null,
): PricePoint[] {
  if (history.length === 0) return [];

  const sortedHistory = [...history].sort((a, b) => a.block - b.block);
  const firstPoint = sortedHistory[0];
  const lastPoint = sortedHistory[sortedHistory.length - 1];
  const endBlock =
    currentBlockNumber != null
      ? Math.max(lastPoint.block, currentBlockNumber)
      : lastPoint.block;

  if (endBlock <= firstPoint.block) return sortedHistory;

  const blockSpan = endBlock - firstPoint.block;
  const targetPointCount = Math.min(
    MAX_DISPLAY_POINTS,
    Math.max(
      MIN_DISPLAY_POINTS,
      Math.ceil((blockSpan + 1) / TARGET_BLOCKS_PER_POINT),
    ),
  );
  const blockStep = Math.max(
    1,
    Math.ceil(blockSpan / Math.max(1, targetPointCount - 1)),
  );

  const displayHistory: PricePoint[] = [];
  let activePoint = firstPoint;
  let nextHistoryIndex = 1;

  for (let block = firstPoint.block; block <= endBlock; block += blockStep) {
    while (
      nextHistoryIndex < sortedHistory.length &&
      sortedHistory[nextHistoryIndex].block <= block
    ) {
      activePoint = sortedHistory[nextHistoryIndex];
      nextHistoryIndex += 1;
    }

    displayHistory.push({
      block,
      floor: activePoint.floor,
      ceiling: activePoint.ceiling,
    });
  }

  if (displayHistory[displayHistory.length - 1]?.block !== endBlock) {
    displayHistory.push({
      block: endBlock,
      floor: activePoint.floor,
      ceiling: activePoint.ceiling,
    });
  }

  return displayHistory;
}

export function PriceHistoryChart() {
  const t = useTranslations("PriceHistoryChart");
  const { history, isLoading } = useG50History();
  const { data: blockNumber } = useBlock();
  const displayHistory = useMemo(
    () => buildDisplayHistory(history, blockNumber ? Number(blockNumber) : null),
    [blockNumber, history],
  );

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
        {!isLoading && displayHistory.length > 0 && (
          <ChartContainer config={config}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={displayHistory}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  stroke={CHART_GRID_COLOR}
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="block"
                  tick={CHART_TICK_STYLE}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  interval="preserveStartEnd"
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis
                  tick={<PriceHistoryYAxisTick />}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  wrapperStyle={{
                    background: TOOLTIP_BACKGROUND,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: TOOLTIP_BORDER,
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
                  type="stepAfter"
                  dataKey="floor"
                  name={t("floorArea")}
                  stroke="var(--color-floor)"
                  strokeWidth={2}
                  fill="var(--color-floor)"
                  fillOpacity={0.1}
                  dot={false}
                />
                <Area
                  type="stepAfter"
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
