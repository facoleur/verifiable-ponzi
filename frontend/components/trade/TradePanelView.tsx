"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInput } from "@/components/ui/TokenInput";
import { TxStatus } from "@/components/ui/TxStatus";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { formatEthAmount, formatToken } from "../../utils/format";
import type { OrderPreview } from "../../utils/math";
import { Button } from "../ui/button";
import { OrderPreviewPanel } from "./OrderPreview";

export interface TradePanelViewProps {
  tab: "buy" | "sell";
  ethAmount: string;
  g50Amount: string;
  isConnected: boolean;
  hasContract: boolean;
  ethBalance: bigint | undefined;
  userBalance: bigint | undefined;
  currentFloor: bigint | undefined;
  currentCeiling: bigint | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  tradeError: string | null;
  preview: OrderPreview | null;
  txHash: `0x${string}` | undefined;
  submittedTrade: {
    tab: "buy" | "sell";
    ethAmount: string;
    g50Amount: string;
  } | null;
  onTabChange: (tab: "buy" | "sell") => void;
  onEthAmountChange: (value: string) => void;
  onG50AmountChange: (value: string) => void;
  onMaxClick: () => void;
  onSubmit: () => void;
}

export function TradePanelView({
  tab,
  ethAmount,
  g50Amount,
  isConnected,
  hasContract,
  ethBalance,
  userBalance,
  currentFloor,
  currentCeiling,
  isPending,
  isConfirming,
  isSuccess,
  tradeError,
  preview,
  txHash,
  submittedTrade,
  onTabChange,
  onEthAmountChange,
  onG50AmountChange,
  onMaxClick,
  onSubmit,
}: TradePanelViewProps) {
  const t = useTranslations("TradePanel");

  const tabs = [
    { value: "buy" as const, label: t("buy") },
    { value: "sell" as const, label: t("sell") },
  ];

  const canSubmit =
    isConnected && hasContract && !!(ethAmount || g50Amount) && !isPending;

  const ethUsdValue = String(Number(ethAmount) * 2320);
  const showBuyMax = isConnected && ethBalance != null && tab === "buy";
  const showSellMax = isConnected && userBalance != null && tab === "sell";
  const tradeSummary = submittedTrade
    ? submittedTrade.tab === "buy"
      ? t("boughtG50ForEth", {
          g50Amount: submittedTrade.g50Amount,
          ethAmount: submittedTrade.ethAmount,
        })
      : t("soldG50ForEth", {
          g50Amount: submittedTrade.g50Amount,
          ethAmount: submittedTrade.ethAmount,
        })
    : null;

  useEffect(() => {
    if (!txHash || !tradeSummary) return;

    toast.success(
      <TxStatus
        hash={"0x346732459643259234795324975"}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        summary={tradeSummary}
      />,
      {
        id: txHash,
        // duration: isSuccess ? 4000 : Infinity,
        duration: Infinity,
      },
    );
  }, [isConfirming, isSuccess, tradeSummary, txHash]);

  return (
    <div className="space-y-1 rounded-xl bg-white p-1">
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as "buy" | "sell")}
      >
        <TabsList className="w-full">
          <div />
          {tabs.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          <div className="mb-1 space-y-1">
            {tab === "buy" ? (
              <>
                <TokenInput
                  label={t("ethToSpend")}
                  symbol="ETH"
                  decimals={6}
                  value={ethAmount}
                  onChange={onEthAmountChange}
                  usdValue={ethUsdValue}
                  showMaxButton={showBuyMax}
                  maxButtonLabel={t("max")}
                  balanceLabel={
                    ethBalance != null && tab === "buy"
                      ? `${formatEthAmount(ethBalance, 6)} ETH`
                      : undefined
                  }
                  onMaxClick={onMaxClick}
                />

                <TokenInput
                  label={t("g50ToBuy")}
                  symbol="G50"
                  decimals={4}
                  value={g50Amount}
                  onChange={onG50AmountChange}
                />
              </>
            ) : (
              <>
                <TokenInput
                  label={t("g50ToSell")}
                  symbol="G50"
                  decimals={4}
                  value={g50Amount}
                  onChange={onG50AmountChange}
                  showMaxButton={showSellMax}
                  maxButtonLabel={t("max")}
                  balanceLabel={
                    userBalance != null && tab === "sell"
                      ? `${formatToken(userBalance)} G50`
                      : undefined
                  }
                  onMaxClick={onMaxClick}
                />

                <TokenInput
                  label={t("ethToReceive")}
                  symbol="ETH"
                  decimals={6}
                  value={ethAmount}
                  onChange={onEthAmountChange}
                  usdValue={ethUsdValue}
                  showMaxButton={false}
                  maxButtonLabel={t("max")}
                  onMaxClick={onMaxClick}
                />
              </>
            )}
          </div>

          {/* Order preview */}
          {preview && currentFloor != null && currentCeiling != null && (
            <div className="p-2">
              <OrderPreviewPanel
                preview={preview}
                currentFloor={currentFloor}
                currentCeiling={currentCeiling}
              />
            </div>
          )}

          {/* Error */}
          {tradeError && <div>{tradeError}</div>}

          {/* Submit */}
          <Button
            disabled={!canSubmit}
            onClick={onSubmit}
            className="w-full"
            size={"lg"}
          >
            {isPending
              ? isConfirming
                ? t("confirming")
                : t("waitingForWallet")
              : tab === "buy"
                ? t("buyG50")
                : t("sellG50")}
          </Button>

          {!isConnected && <p>{t("connectWallet")}</p>}
          {isConnected && !hasContract && <p>{t("setContractAddress")}</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
