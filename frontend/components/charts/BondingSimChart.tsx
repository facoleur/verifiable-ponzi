"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { G50State } from "../../hooks/useG50State";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import {
  CHART_GRID_COLOR,
  CHART_SUBTLE_COLOR,
  CHART_TICK_STYLE,
  TOOLTIP_BACKGROUND,
  TOOLTIP_BORDER,
} from "./colors";

interface SimPoint {
  buyers: number;
  positionValue: number; // earlyBuyerTokens × floor, total ETH
  costBasis: number; // ethPerBuyer, constant total ETH
}

/**
 * Simulate the early buyer's P&L as subsequent buyers enter.
 *
 * Contract mechanics (g50.sol):
 *   buy:  tokens_minted = msg.value / ceiling
 *   sell: eth_received  = token_amount × floor
 *   floor update: floor = contract_balance / total_supply
 *
 * "buyers" on the X-axis is the number of ADDITIONAL buyers after you.
 * At buyers=0 you just bought — floor has NOT updated yet (maybeUpdate needs 10 blocks).
 *   sell value = tokens × startFloor = ethPerBuyer × 20/21 ≈ −4.76%
 * At buyers=1+, floor has updated from your buy (floor = entryCeiling), then each
 *   additional buyer pushes the floor higher.
 */
function simulate(
  startFloor: number,
  ethPerBuyer: number,
  numBuyers: number,
): SimPoint[] {
  if (startFloor <= 0 || ethPerBuyer <= 0) return [];

  const entryCeiling = startFloor * 1.05;
  const earlyBuyerTokens = ethPerBuyer / entryCeiling;
  const costBasis = ethPerBuyer;

  const points: SimPoint[] = [
    { buyers: 0, positionValue: earlyBuyerTokens * startFloor, costBasis },
  ];

  let floor = entryCeiling;
  let ceiling = floor * 1.05;
  let totalEth = ethPerBuyer;
  let totalSupply = earlyBuyerTokens;

  for (let i = 1; i <= numBuyers; i++) {
    const tokens = ethPerBuyer / ceiling;
    totalEth += ethPerBuyer;
    totalSupply += tokens;
    floor = totalEth / totalSupply;
    ceiling = floor * 1.05;
    points.push({
      buyers: i,
      positionValue: earlyBuyerTokens * floor,
      costBasis,
    });
  }

  return points;
}

function fmt(v: number) {
  if (v === 0) return "0";
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(2);
}

function sliderStyle(fillPercent: number): CSSProperties {
  return {
    "--slider-fill": `${fillPercent}%`,
  } as CSSProperties;
}

interface Props {
  state: G50State;
}

export function BondingSimChart({ state }: Props) {
  const t = useTranslations("BondingSimChart");
  const [ethPerBuyer, setEthPerBuyer] = useState(1);
  const [numBuyers, setNumBuyers] = useState(20);
  const ethSliderFill = ((ethPerBuyer - 0.1) / (10 - 0.1)) * 100;
  const buyersSliderFill = numBuyers;

  const startFloor = useMemo(() => {
    if (!state.floor) return 1;
    return Number(state.floor * BigInt(1e8)) / 1e18;
  }, [state.floor]);

  const data = useMemo(
    () => simulate(startFloor, ethPerBuyer, numBuyers),
    [startFloor, ethPerBuyer, numBuyers],
  );

  const lastPoint = data[data.length - 1];
  const costBasis = data[0]?.costBasis ?? 0;
  const finalValue = lastPoint?.positionValue ?? 0;
  const pnlPct =
    costBasis > 0 ? ((finalValue - costBasis) / costBasis) * 100 : 0;

  const yDomain = useMemo(() => {
    if (!data.length) return ["auto", "auto"] as const;
    const allValues = data.flatMap((p) => [p.positionValue, p.costBasis]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.15 || max * 0.1;
    return [min - pad, max + pad] as [number, number];
  }, [data]);

  const chartConfig: ChartConfig = {
    positionValue: {
      label: t("positionValueLine"),
      color: "var(--chart-primary)",
    },
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-slate-300/50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-800">{t("title")}</div>
        </div>
        {/* <div
          className={`flex flex-col items-end gap-0.5 text-[22px] font-bold tracking-[-0.03em] ${
            pnlPct >= 0 ? "text-slate-800" : "text-slate-500"
          }`}
        >
          {pnlPct >= 0 ? "+" : ""}
          {pnlPct.toFixed(1)}%
          <span className="text-[11px] font-normal tracking-[0.02em] text-slate-500">
            {t("afterBuyers", { numBuyers })}
          </span>
        </div> */}
      </div>

      {/* Chart */}
      <div className="p-4 px-2 pb-2">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 16, left: 0 }}
            >
              <CartesianGrid
                stroke={CHART_GRID_COLOR}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="buyers"
                tick={CHART_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t("buyersAxisLabel"),
                  position: "insideBottomRight",
                  offset: -4,
                  fill: CHART_TICK_STYLE.fill,
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={CHART_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmt}
                width={40}
                domain={yDomain}
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
                    labelFormatter={(label) =>
                      t("tooltipBuyersIn", { label: label as number })
                    }
                    valueFormatter={(v) => `${fmt(v)} ETH`}
                  />
                }
              />
              <ReferenceLine
                y={costBasis}
                stroke={CHART_SUBTLE_COLOR}
                strokeDasharray="6 3"
                label={{
                  value: t("yourCost"),
                  fill: CHART_SUBTLE_COLOR,
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />
              <Area
                type="monotone"
                dataKey="positionValue"
                name={t("positionValueLine")}
                stroke="var(--color-positionValue)"
                strokeWidth={2.5}
                dot={false}
                fill="var(--color-positionValue)"
                fillOpacity={0.1}
                animationDuration={25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 border-b border-slate-300 px-5 py-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="flex justify-between text-xs text-slate-500">
            {t("ethPerBuyer")}
            <span className="font-semibold text-slate-800">
              {ethPerBuyer} {t("ethUnit")}
            </span>
          </label>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={ethPerBuyer}
            onChange={(e) => setEthPerBuyer(parseFloat(e.target.value))}
            className="sim-slider sim-slider--eth"
            style={sliderStyle(ethSliderFill)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex justify-between text-xs text-slate-500">
            {t("numberOfBuyers")}
            <span className="font-semibold text-slate-800">{numBuyers}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={numBuyers}
            onChange={(e) => setNumBuyers(parseInt(e.target.value))}
            className="sim-slider sim-slider--buyers"
            style={sliderStyle(buyersSliderFill)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5 border-t border-slate-300 px-5 py-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("buyFirstAt")}</span>
          <span className="text-xs font-bold text-slate-800">
            {fmt(costBasis)}
            <span className="text-slate-500"> ETH</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("afterBuyersWorth", { numBuyers })}</span>
          <span
            className={`text-xs font-bold ${pnlPct >= 0 ? "text-slate-800" : "text-slate-500"}`}
          >
            {fmt(finalValue)}
            <span className="text-slate-500"> ETH</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("pnl")}</span>
          <span
            className={`text-xs font-bold ${pnlPct >= 0 ? "text-slate-800" : "text-slate-500"}`}
          >
            {pnlPct.toFixed(2)}
            <span className="text-slate-500"> %</span>
          </span>
        </div>
      </div>
    </div>
  );
}
