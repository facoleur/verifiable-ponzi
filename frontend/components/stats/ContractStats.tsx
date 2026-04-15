"use client";

import { useTranslations } from "next-intl";
import type { G50State } from "../../hooks/useG50State";
import {
  formatEthAmount,
  formatToken,
  weiPerUnitToEthPerToken,
} from "../../utils/format";
import { PriceScaleBand } from "./PriceScaleBand";

interface ContractStatsProps {
  state: G50State;
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
}

function MetricCard({ label, value, unit }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-slate-300/50 p-4">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex items-baseline gap-1 text-base font-medium">
        <span className="text-slate-900">{value}</span>
        <span className="text-slate-500">{unit}</span>
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
  const floorNumber =
    floor != null ? Number(weiPerUnitToEthPerToken(floor)) : null;
  const ceilingNumber =
    ceiling != null ? Number(weiPerUnitToEthPerToken(ceiling)) : null;
  const middleRaw =
    floor != null && ceiling != null ? (floor + ceiling) / 2n : undefined;
  const middleValue =
    middleRaw != null ? weiPerUnitToEthPerToken(middleRaw) : dash;
  const middleNumber =
    floorNumber != null && ceilingNumber != null
      ? floorNumber + (ceilingNumber - floorNumber) / 2
      : null;
  const hasScale = floorNumber != null && ceilingNumber != null;

  const { basePosition, floorPosition, middlePosition, ceilingPosition } =
    (() => {
      if (
        !hasScale ||
        floorNumber == null ||
        middleNumber == null ||
        ceilingNumber == null
      ) {
        return {
          basePosition: 0,
          floorPosition: 33.33,
          middlePosition: 66.66,
          ceilingPosition: 100,
        };
      }

      const minValue = Math.min(
        basePrice,
        floorNumber,
        middleNumber,
        ceilingNumber,
      );
      const maxValue = Math.max(
        basePrice,
        floorNumber,
        middleNumber,
        ceilingNumber,
      );
      const range = maxValue - minValue || 1;

      return {
        basePosition: ((basePrice - minValue) / range) * 100,
        floorPosition: ((floorNumber - minValue) / range) * 100,
        middlePosition: ((middleNumber - minValue) / range) * 100,
        ceilingPosition: ((ceilingNumber - minValue) / range) * 100,
      };
    })();

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
              position: basePosition,
              tickClassName: "bg-slate-700",
            },
            {
              id: "floor",
              label: t("floor"),
              value: floorValue,
              position: floorPosition,
              labelClassName: "text-red-700",
              valueClassName: "text-red-700",
              tickClassName: "bg-red-700",
            },
            {
              id: "middle",
              label: "middle",
              value: middleValue,
              position: middlePosition,
              labelClassName: "text-amber-700",
              valueClassName: "text-amber-700",
              tickClassName: "bg-amber-700",
            },
            {
              id: "ceiling",
              label: t("ceiling"),
              value: ceilingValue,
              position: ceilingPosition,
              labelClassName: "text-green-700",
              valueClassName: "text-green-700",
              tickClassName: "bg-green-700",
            },
          ]}
          bands={[
            {
              id: "eth-floor",
              start: basePosition,
              end: floorPosition,
              className: "bg-slate-400/50",
            },
            {
              id: "floor-middle",
              start: floorPosition,
              end: middlePosition,
              className: "bg-slate-400/50",
            },
            {
              id: "middle-ceiling",
              start: middlePosition,
              end: ceilingPosition,
              className: "bg-slate-400/50",
            },
          ]}
        />
      </div>
    </section>
  );
}
