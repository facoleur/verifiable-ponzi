"use client";

import { MetricCard } from "@/components/ui/metric-card";
import { useTranslations } from "next-intl";
import { formatEther } from "viem";
import type { G50State } from "../../hooks/useG50State";
import { TOKEN_UNIT } from "../../lib/constants";
import {
  formatEthAmount,
  formatEthValue,
  formatToken,
  weiPerUnitToEthPerToken,
} from "../../utils/format";
import { PriceScaleBand } from "./PriceScaleBand";

interface ContractStatsProps {
  state: G50State;
}

interface BandTooltipProps {
  title: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  deltaLabel: string;
  deltaValue: string;
  summary: string;
}

function weiPerUnitToEthPerTokenNumber(value: bigint): number {
  return Number(formatEther(value * TOKEN_UNIT));
}

function formatPercentDelta(delta: number, base: number): string {
  if (base === 0) return "0%";
  const pct = (delta / base) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatSignedEthDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatEthValue(delta, 4)} ETH`;
}

function formatEthDeltaMagnitude(delta: number): string {
  return `${formatEthValue(Math.abs(delta), 4)} ETH`;
}

function BandTooltip({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  deltaLabel,
  deltaValue,
  summary,
}: BandTooltipProps) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold tracking-[0.02em] text-slate-800">
        {title}
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px] text-slate-600">
        <span>{leftLabel}</span>
        <span className="font-medium text-slate-800">{leftValue}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px] text-slate-600">
        <span>{rightLabel}</span>
        <span className="font-medium text-slate-800">{rightValue}</span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1 text-[11px] text-slate-600">
        <span>{deltaLabel}</span>
        <span className="font-medium text-slate-800">{deltaValue}</span>
      </div>
      <div className="text-[11px] leading-relaxed text-slate-500">
        {summary}
      </div>
    </div>
  );
}

export function ContractStats({ state }: ContractStatsProps) {
  const t = useTranslations("ContractStats");

  const { floor, ceiling, supply, contractEthBalance } = state;
  const dash = "—";
  const basePrice = 1;

  const floorValue = floor != null ? weiPerUnitToEthPerToken(floor) : dash;
  const ceilingValue =
    ceiling != null ? weiPerUnitToEthPerToken(ceiling) : dash;
  const reserveValue =
    contractEthBalance != null ? formatEthAmount(contractEthBalance, 6) : dash;
  const middleRaw =
    floor != null && ceiling != null ? (floor + ceiling) / 2n : undefined;
  const middleValue =
    middleRaw != null ? weiPerUnitToEthPerToken(middleRaw) : dash;
  const floorNumber =
    floor != null ? weiPerUnitToEthPerTokenNumber(floor) : undefined;
  const middleNumber =
    middleRaw != null ? weiPerUnitToEthPerTokenNumber(middleRaw) : undefined;
  const ceilingNumber =
    ceiling != null ? weiPerUnitToEthPerTokenNumber(ceiling) : undefined;
  const anchorValue = "1 ETH";
  const floorBandTooltip =
    floorNumber != null ? (
      <BandTooltip
        title={t("tooltipSellFloor")}
        leftLabel="ETH"
        leftValue={anchorValue}
        rightLabel={t("floor")}
        rightValue={`${floorValue} ETH`}
        deltaLabel={t("tooltipAnchorDelta", {
          value: formatSignedEthDelta(floorNumber - basePrice),
        })}
        deltaValue={formatPercentDelta(floorNumber - basePrice, basePrice)}
        summary={t("tooltipBelowAnchor", {
          value: formatEthDeltaMagnitude(floorNumber - basePrice),
        })}
      />
    ) : undefined;
  const middleBandTooltip =
    floorNumber != null && middleNumber != null ? (
      <BandTooltip
        title={t("tooltipMidpoint")}
        leftLabel={t("floor")}
        leftValue={`${floorValue} ETH`}
        rightLabel={t("middle")}
        rightValue={`${middleValue} ETH`}
        deltaLabel={t("tooltipFromFloor", {
          value: formatEthDeltaMagnitude(middleNumber - floorNumber),
        })}
        deltaValue={formatPercentDelta(middleNumber - floorNumber, floorNumber)}
        summary={t("tooltipNotTradePrice")}
      />
    ) : undefined;
  const ceilingBandTooltip =
    middleNumber != null && ceilingNumber != null ? (
      <BandTooltip
        title={t("tooltipBuyPremium")}
        leftLabel={t("middle")}
        leftValue={`${middleValue} ETH`}
        rightLabel={t("ceiling")}
        rightValue={`${ceilingValue} ETH`}
        deltaLabel={t("tooltipFromMidpoint", {
          value: formatEthDeltaMagnitude(ceilingNumber - middleNumber),
        })}
        deltaValue={formatPercentDelta(
          ceilingNumber - middleNumber,
          middleNumber,
        )}
        summary={`${t("tooltipSellNow")}: ${floorValue} ETH. ${t("tooltipBuyNow")}: ${ceilingValue} ETH.`}
      />
    ) : undefined;

  return (
    <section className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label={t("ethReserve")} value={reserveValue} unit="ETH" />
        <MetricCard
          label={t("totalSupply")}
          value={supply != null ? formatToken(supply) : dash}
          unit="G50"
        />
      </div>

      <div className="space-y-1 rounded-xl bg-slate-300/50 p-1">
        <PriceScaleBand
          markers={[
            {
              id: "eth",
              label: "ETH",
              value: basePrice,
              bandAfterClassName: "bg-slate-400/50",
              bandAfterTooltip: floorBandTooltip,
            },
            {
              id: "floor",
              label: t("floor"),
              value: floorValue,
              labelClassName: "text-red-700",
              valueClassName: "text-red-700",
              bandAfterClassName: "bg-red-500/45",
              bandAfterTooltip: middleBandTooltip,
            },
            {
              id: "middle",
              label: t("middle"),
              value: middleValue,
              labelClassName: "text-amber-700",
              valueClassName: "text-amber-700",
              bandAfterClassName: "bg-green-600/40",
              bandAfterTooltip: ceilingBandTooltip,
            },
            {
              id: "ceiling",
              label: t("ceiling"),
              value: ceilingValue,
              labelClassName: "text-green-700",
              valueClassName: "text-green-700",
            },
          ]}
        />
      </div>
    </section>
  );
}
