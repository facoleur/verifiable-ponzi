"use client";

import {
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/ui/section";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HolderBalance } from "@/hooks/useHolders";
import { formatEthValue, formatToken, shortenAddress } from "@/utils/format";
import { useTranslations } from "next-intl";

const HOLDER_DISTRIBUTION_COLORS = [
  "var(--color-red-400)",
  "var(--color-orange-400)",
  "var(--color-amber-400)",
  "var(--color-yellow-400)",
  "var(--color-lime-400)",
  "var(--color-emerald-400)",
  "var(--color-teal-400)",
  "var(--color-cyan-400)",
  "var(--color-sky-400)",
  "var(--color-blue-400)",
  "var(--color-indigo-400)",
  "var(--color-violet-400)",
];

interface HoldersDistributionBarProps {
  holders: HolderBalance[];
}

function formatShare(sharePct: number): string {
  return `${sharePct.toFixed(2)}%`;
}

export function HoldersDistributionBar({
  holders,
}: HoldersDistributionBarProps) {
  const t = useTranslations("Analytics");

  if (holders.length === 0) return null;

  return (
    <TooltipProvider>
      <Section className="p-5">
        <SectionHeader className="mb-3 p-0">
          <SectionTitle>{t("distributionTitle")}</SectionTitle>
          <SectionDescription>{t("distributionSubtitle")}</SectionDescription>
        </SectionHeader>

        <div className="relative flex h-12 overflow-hidden rounded-lg">
          {holders.map((holder, index) => {
            const color =
              HOLDER_DISTRIBUTION_COLORS[
                index % HOLDER_DISTRIBUTION_COLORS.length
              ];
            const pnlPositive = holder.unrealizedPnlEth >= 0;

            return (
              <Tooltip key={holder.address}>
                <TooltipTrigger asChild>
                  <div
                    className={`group relative flex h-full min-w-0 items-center justify-center outline-none ${
                      index < holders.length - 1 ? "pr-[2px]" : ""
                    }`}
                    style={{
                      width: `${holder.sharePct}%`,
                    }}
                    tabIndex={0}
                  >
                    <div
                      className="absolute top-1/2 left-0 h-6 w-full -translate-y-1/2 rounded-xs transition-all duration-75 group-hover:h-8 group-focus-visible:h-8"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold tracking-[0.02em] text-slate-800">
                      {shortenAddress(holder.address)}
                    </div>
                    <div className="flex items-start justify-between gap-4 text-xs text-slate-600">
                      <span>{t("address")}</span>
                      <span className="max-w-40 break-all font-mono text-right text-slate-800">
                        {holder.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs text-slate-600">
                      <span>{t("balance")}</span>
                      <span className="font-medium text-slate-800">
                        {formatToken(holder.balance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs text-slate-600">
                      <span>{t("share")}</span>
                      <span className="font-medium text-slate-800">
                        {formatShare(holder.sharePct)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 text-xs text-slate-600">
                      <span>{t("unrealizedPnl")}</span>
                      <span
                        className={`font-medium ${pnlPositive ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {pnlPositive ? "+" : ""}
                        {formatEthValue(holder.unrealizedPnlEth, 4)} ETH
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </Section>
    </TooltipProvider>
  );
}
