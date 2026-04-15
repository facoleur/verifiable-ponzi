"use client";

import { PositionAccounting } from "@/hooks/usePositionAccounting";
import { useTranslations } from "next-intl";
import { formatEthValue, formatToken } from "../../utils/format";
import { Separator } from "../ui/separator";
import { TokenAmount } from "../ui/TokenAmount";

export interface UserPositionViewProps {
  userBalance: bigint | undefined;
  position: PositionAccounting;
}

export function UserPositionView({
  userBalance,
  position,
}: UserPositionViewProps) {
  const t = useTranslations("UserPosition");

  const hasHistory = position.totalInEth > 0;

  return (
    <div className="space-y-2 overflow-hidden rounded-lg bg-slate-300/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("title")}</span>
      </div>

      <div className="space-y-1">
        <Row label={t("balance")}>
          <TokenAmount
            value={userBalance != null ? formatToken(userBalance) : null}
            symbol="G50"
          />
        </Row>

        <Row label={t("valueAtFloor")}>
          <TokenAmount
            value={formatEthValue(position.currentValueEth, 6)}
            symbol="ETH"
          />
        </Row>

        <Separator className="my-1 bg-slate-300" />

        <Row label="Average entry price">
          <TokenAmount
            value={
              position.averageEntryPriceEth != null
                ? formatEthValue(position.averageEntryPriceEth, 6)
                : null
            }
            symbol="ETH"
          />
        </Row>
        <Row label="PnL">
          <TokenAmount
            value={
              position.unrealizedPnlPct != null
                ? `(${position.unrealizedPnlPct.toFixed(2)}%)  ${formatEthValue(position.unrealizedPnlEth, 6)}`
                : null
            }
            symbol="ETH"
          />
        </Row>

        {hasHistory && (
          <>
            <Separator className="my-1 bg-slate-300" />

            <Row label={t("totalBought")}>
              <div className="flex items-center gap-2">
                <TokenAmount
                  value={formatEthValue(position.totalInEth, 6)}
                  symbol="ETH"
                />
                <span className="text-xs text-slate-400">/</span>
                <TokenAmount
                  value={formatToken(position.boughtTokens)}
                  symbol="G50"
                />
              </div>
            </Row>

            {position.totalOutEth > 0 && (
              <Row label={t("totalSold")}>
                <div className="flex items-center gap-2">
                  <TokenAmount
                    value={formatEthValue(position.totalOutEth, 6)}
                    symbol="ETH"
                  />
                  <span className="text-xs text-slate-400">/</span>
                  <TokenAmount
                    value={formatToken(position.soldTokens)}
                    symbol="G50"
                  />
                </div>
              </Row>
            )}

            <Row label={t("netInvested")}>
              <TokenAmount
                value={formatEthValue(position.netInvestedEth, 6)}
                symbol="ETH"
              />
            </Row>
          </>
        )}

        {!hasHistory && (
          <p className="m-0 px-[18px] pt-1.5 pb-2.5 text-[11px] text-[var(--muted-2)]">
            {t("pnlAfterBuy")}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}
