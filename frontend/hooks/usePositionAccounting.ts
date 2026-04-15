"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, PublicClient } from "viem";
import { decodeEventLog, formatEther, parseAbiItem, zeroAddress } from "viem";
import { usePublicClient } from "wagmi";
import { G50_ABI } from "../lib/abi";
import { CONTRACT_ADDRESS, TOKEN_UNIT } from "../lib/constants";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const PRICE_UPDATE_EVENT = parseAbiItem(
  "event PriceUpdate(uint256 newFloor, uint256 newCeiling, uint256 blockNumber)",
);

type PositionEvent =
  | {
      kind: "buy";
      amount: bigint;
      ethValue: bigint;
      blockNumber: bigint;
      transactionIndex: number;
      logIndex: number;
    }
  | {
      kind: "sell";
      amount: bigint;
      ethValue: bigint;
      blockNumber: bigint;
      transactionIndex: number;
      logIndex: number;
    };

export interface PositionAccounting {
  boughtTokens: bigint;
  soldTokens: bigint;
  positionTokens: bigint;
  totalInEth: number;
  totalOutEth: number;
  netInvestedEth: number;
  currentValueEth: number;
  remainingCostBasisEth: number;
  averageEntryPriceEth: number | undefined;
  realizedPnlEth: number;
  unrealizedPnlEth: number;
  realizedPnlPct: number | undefined;
  unrealizedPnlPct: number | undefined;
  hasExternalTransfers: boolean;
  isApproximate: boolean;
  isLoading: boolean;
  refetch: () => void;
}

function weiToEth(value: bigint): number {
  return parseFloat(formatEther(value));
}

function compareEvents(a: PositionEvent, b: PositionEvent): number {
  if (a.blockNumber !== b.blockNumber) {
    return a.blockNumber < b.blockNumber ? -1 : 1;
  }
  if (a.transactionIndex !== b.transactionIndex) {
    return a.transactionIndex - b.transactionIndex;
  }
  return a.logIndex - b.logIndex;
}

async function getSellFloor(
  client: PublicClient,
  txHash: `0x${string}` | undefined,
  blockNumber: bigint | undefined,
): Promise<{ floor: bigint; isApproximate: boolean }> {
  if (!blockNumber) return { floor: 0n, isApproximate: true };

  if (txHash) {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
        continue;

      try {
        const decoded = decodeEventLog({
          abi: [PRICE_UPDATE_EVENT],
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "PriceUpdate") {
          return {
            floor: decoded.args.newFloor as bigint,
            isApproximate: false,
          };
        }
      } catch {
        continue;
      }
    }
  }

  const floor = (await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: G50_ABI,
    functionName: "floor",
    blockNumber,
  })) as bigint;

  return { floor, isApproximate: true };
}

export async function loadPositionAccounting(
  client: PublicClient,
  address: Address,
): Promise<Omit<PositionAccounting, "isLoading" | "refetch">> {
  // OZ ERC20 emits Transfer(from=0, to, amount) for mints and Transfer(from, to=0, amount) for burns.
  const [incomingTransfers, outgoingTransfers, currentFloor] = await Promise.all([
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: TRANSFER_EVENT,
      args: { to: address },
      fromBlock: 0n,
      toBlock: "latest",
    }),
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: TRANSFER_EVENT,
      args: { from: address },
      fromBlock: 0n,
      toBlock: "latest",
    }),
    client.readContract({
      address: CONTRACT_ADDRESS,
      abi: G50_ABI,
      functionName: "floor",
    }) as Promise<bigint>,
  ]);

  const mintLogs = incomingTransfers.filter((l) => l.args.from === zeroAddress);
  const burnLogs = outgoingTransfers.filter((l) => l.args.to === zeroAddress);

  const hasExternalTransfers =
    incomingTransfers.some((l) => l.args.from !== zeroAddress) ||
    outgoingTransfers.some((l) => l.args.to !== zeroAddress);

  let isApproximate = false;

  const buyEvents = await Promise.all(
    mintLogs.map(async (log): Promise<PositionEvent> => {
      const tx = log.transactionHash
        ? await client.getTransaction({ hash: log.transactionHash })
        : null;

      return {
        kind: "buy",
        amount: log.args.value ?? 0n,
        ethValue: tx?.value ?? 0n,
        blockNumber: log.blockNumber ?? 0n,
        transactionIndex: log.transactionIndex ?? 0,
        logIndex: log.logIndex ?? 0,
      };
    }),
  );

  const sellEvents = await Promise.all(
    burnLogs.map(async (log): Promise<PositionEvent> => {
      const { floor, isApproximate: sellApproximate } = await getSellFloor(
        client,
        log.transactionHash,
        log.blockNumber,
      );

      if (sellApproximate) isApproximate = true;

      const amount = log.args.value ?? 0n;

      return {
        kind: "sell",
        amount,
        ethValue: amount * floor,
        blockNumber: log.blockNumber ?? 0n,
        transactionIndex: log.transactionIndex ?? 0,
        logIndex: log.logIndex ?? 0,
      };
    }),
  );

  const events = [...buyEvents, ...sellEvents].sort(compareEvents);

  let totalIn = 0n;
  let totalOut = 0n;
  let boughtTokens = 0n;
  let soldTokens = 0n;
  let positionTokens = 0n;
  let remainingCostBasisWei = 0n;
  let realizedPnlWei = 0n;

  for (const event of events) {
    if (event.kind === "buy") {
      totalIn += event.ethValue;
      boughtTokens += event.amount;
      positionTokens += event.amount;
      remainingCostBasisWei += event.ethValue;
      continue;
    }

    totalOut += event.ethValue;
    soldTokens += event.amount;

    const currentPosition = positionTokens;
    const amountAppliedToCostBasis =
      event.amount > currentPosition ? currentPosition : event.amount;
    const costRemoved =
      currentPosition > 0n
        ? (remainingCostBasisWei * amountAppliedToCostBasis) / currentPosition
        : 0n;

    remainingCostBasisWei =
      remainingCostBasisWei > costRemoved
        ? remainingCostBasisWei - costRemoved
        : 0n;
    positionTokens =
      positionTokens > event.amount ? positionTokens - event.amount : 0n;
    realizedPnlWei += event.ethValue - costRemoved;
  }

  const unrealizedPnlWei =
    positionTokens * currentFloor - remainingCostBasisWei;
  const currentValueWei = positionTokens * currentFloor;
  const netInvestedWei = totalIn - totalOut;

  return {
    boughtTokens,
    soldTokens,
    positionTokens,
    totalInEth: weiToEth(totalIn),
    totalOutEth: weiToEth(totalOut),
    netInvestedEth: weiToEth(netInvestedWei),
    currentValueEth: weiToEth(currentValueWei),
    remainingCostBasisEth: weiToEth(remainingCostBasisWei),
    averageEntryPriceEth:
      !hasExternalTransfers && positionTokens > 0n
        ? weiToEth((remainingCostBasisWei * TOKEN_UNIT) / positionTokens)
        : undefined,
    realizedPnlEth: weiToEth(realizedPnlWei),
    unrealizedPnlEth: weiToEth(unrealizedPnlWei),
    realizedPnlPct:
      totalIn > 0n ? Number((realizedPnlWei * 10000n) / totalIn) / 100 : undefined,
    unrealizedPnlPct:
      remainingCostBasisWei > 0n
        ? Number((unrealizedPnlWei * 10000n) / remainingCostBasisWei) / 100
        : undefined,
    hasExternalTransfers,
    isApproximate,
  };
}

export function usePositionAccounting(
  userAddress: Address | undefined,
): PositionAccounting {
  const client = usePublicClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["positionAccounting", userAddress],
    queryFn: () => loadPositionAccounting(client!, userAddress!),
    enabled: !!client && !!userAddress && !!CONTRACT_ADDRESS,
    staleTime: Infinity,
  });

  return {
    boughtTokens: data?.boughtTokens ?? 0n,
    soldTokens: data?.soldTokens ?? 0n,
    positionTokens: data?.positionTokens ?? 0n,
    totalInEth: data?.totalInEth ?? 0,
    totalOutEth: data?.totalOutEth ?? 0,
    netInvestedEth: data?.netInvestedEth ?? 0,
    currentValueEth: data?.currentValueEth ?? 0,
    remainingCostBasisEth: data?.remainingCostBasisEth ?? 0,
    averageEntryPriceEth: data?.averageEntryPriceEth,
    realizedPnlEth: data?.realizedPnlEth ?? 0,
    unrealizedPnlEth: data?.unrealizedPnlEth ?? 0,
    realizedPnlPct: data?.realizedPnlPct,
    unrealizedPnlPct: data?.unrealizedPnlPct,
    hasExternalTransfers: data?.hasExternalTransfers ?? false,
    isApproximate: data?.isApproximate ?? false,
    isLoading,
    refetch: () => {
      void refetch();
    },
  };
}
