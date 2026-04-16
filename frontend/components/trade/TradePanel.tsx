"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatEther, formatUnits, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useCostBasis } from "../../hooks/useCostBasis";
import type { G50State } from "../../hooks/useG50State";
import { tradeErrorMessage, useG50Trade } from "../../hooks/useG50Trade";
import { useOrderPreview } from "../../hooks/useOrderPreview";
import {
  CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
  TOKEN_UNIT,
} from "../../lib/constants";
import { classifyTradeError } from "../../utils/errors";
import { TradePanelView } from "./TradePanelView";

function g50FromEth(ethStr: string, priceWeiPerUnit: bigint): string {
  if (!ethStr || priceWeiPerUnit === 0n) return "";
  try {
    const tokenUnits = parseEther(ethStr) / priceWeiPerUnit;
    if (tokenUnits === 0n) return "";
    const whole = tokenUnits / TOKEN_UNIT;
    const frac = tokenUnits % TOKEN_UNIT;
    if (frac === 0n) return whole.toString();
    const fracStr = frac
      .toString()
      .padStart(TOKEN_DECIMALS, "0")
      .replace(/0+$/, "");
    return `${whole}.${fracStr}`;
  } catch {
    return "";
  }
}

function ethFromG50(g50Str: string, priceWeiPerUnit: bigint): string {
  if (!g50Str || priceWeiPerUnit === 0n) return "";
  try {
    const tokenUnits = BigInt(
      Math.round(parseFloat(g50Str) * 10 ** TOKEN_DECIMALS),
    );
    if (tokenUnits === 0n) return "";
    const ethWei = tokenUnits * priceWeiPerUnit;
    const formatted = parseFloat(formatEther(ethWei));
    if (formatted === 0) return "";
    return formatted.toPrecision(6).replace(/\.?0+$/, "");
  } catch {
    return "";
  }
}

function trimDecimalString(value: string, decimals: number): string {
  const [whole, fraction = ""] = value.split(".");

  if (!fraction) return whole;

  const trimmedFraction = fraction.slice(0, decimals).replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

interface TradePanelProps {
  state: G50State;
}

export function TradePanel({ state }: TradePanelProps) {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [ethAmount, setEthAmount] = useState("");
  const [g50Amount, setG50Amount] = useState("");
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [submittedTrade, setSubmittedTrade] = useState<{
    tab: "buy" | "sell";
    ethAmount: string;
    g50Amount: string;
  } | null>(null);

  // canonical amount: ETH string for buy, G50 string for sell
  const amount = tab === "buy" ? ethAmount : g50Amount;

  const queryClient = useQueryClient();
  const { isConnected, address } = useAccount();
  const { data: ethBalanceData } = useBalance({ address });
  const { refetch: refetchCostBasis } = useCostBasis(address);
  const preview = useOrderPreview({ tab, amount, state });
  const {
    buy,
    sell,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    failure,
    resetTrade,
  } = useG50Trade();

  useEffect(() => {
    if (!isSuccess) return;
    setEthAmount("");
    setG50Amount("");
    state.refetch();
    refetchCostBasis();
    if (address) {
      void queryClient.invalidateQueries({
        queryKey: ["positionAccounting", address],
      });
      void queryClient.invalidateQueries({
        queryKey: ["costBasis", address],
      });
    }
  }, [address, isSuccess, queryClient, refetchCostBasis, state]);

  useEffect(() => {
    if (failure) setTradeError(tradeErrorMessage(failure));
  }, [failure]);

  function handleTabChange(next: "buy" | "sell") {
    setTab(next);
    setEthAmount("");
    setG50Amount("");
    setTradeError(null);
    setSubmittedTrade(null);
    resetTrade();
  }

  function handleEthAmountChange(value: string) {
    setEthAmount(value);
    setTradeError(null);
    const price = tab === "buy" ? state.ceiling : state.floor;
    if (price) setG50Amount(g50FromEth(value, price));
    else setG50Amount("");
  }

  function handleG50AmountChange(value: string) {
    setG50Amount(value);
    setTradeError(null);
    const price = tab === "buy" ? state.ceiling : state.floor;
    if (price) setEthAmount(ethFromG50(value, price));
    else setEthAmount("");
  }

  function handleMaxClick() {
    setTradeError(null);

    if (tab === "buy") {
      if (ethBalanceData?.value == null) return;

      const eth = trimDecimalString(formatEther(ethBalanceData.value), 6);
      setEthAmount(eth);
      if (state.ceiling) setG50Amount(g50FromEth(eth, state.ceiling));
      else setG50Amount("");
      return;
    }

    if (state.userBalance != null) {
      const g50 = trimDecimalString(
        formatUnits(state.userBalance, TOKEN_DECIMALS),
        4,
      );
      setG50Amount(g50);
      if (state.floor) setEthAmount(ethFromG50(g50, state.floor));
      else setEthAmount("");
    }
  }

  async function handleSubmit() {
    setTradeError(null);
    resetTrade();
    setSubmittedTrade({ tab, ethAmount, g50Amount });
    try {
      if (tab === "buy") {
        await buy(ethAmount);
      } else {
        await sell(g50Amount);
      }
    } catch (e) {
      setTradeError(tradeErrorMessage(classifyTradeError(e)));
    }
  }

  return (
    <TradePanelView
      tab={tab}
      ethAmount={ethAmount}
      g50Amount={g50Amount}
      isConnected={isConnected}
      hasContract={!!CONTRACT_ADDRESS}
      ethBalance={ethBalanceData?.value}
      userBalance={state.userBalance}
      currentFloor={state.floor}
      currentCeiling={state.ceiling}
      isPending={isPending}
      isConfirming={isConfirming}
      isSuccess={isSuccess}
      tradeError={tradeError}
      preview={preview}
      txHash={txHash}
      submittedTrade={submittedTrade}
      onTabChange={handleTabChange}
      onEthAmountChange={handleEthAmountChange}
      onG50AmountChange={handleG50AmountChange}
      onMaxClick={handleMaxClick}
      onSubmit={handleSubmit}
    />
  );
}
