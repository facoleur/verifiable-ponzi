"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, PublicClient } from "viem";
import { formatEther, parseAbiItem, zeroAddress } from "viem";
import { usePublicClient } from "wagmi";
import { G50_ABI } from "../lib/abi";
import { CONTRACT_ADDRESS } from "../lib/constants";
import { useBlock } from "./useBlock";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

interface HolderState {
  balance: bigint;
  costBasisWei: bigint;
}

export interface HolderBalance {
  address: Address;
  balance: bigint;
  sharePct: number;
  currentValueEth: number;
  unrealizedPnlEth: number;
}

export interface HoldersData {
  holders: HolderBalance[];
  totalSupply: bigint;
}

function weiToEth(value: bigint): number {
  return Number(formatEther(value));
}

function compareTransferLogs(
  a: {
    blockNumber?: bigint;
    transactionIndex?: number;
    logIndex?: number;
  },
  b: {
    blockNumber?: bigint;
    transactionIndex?: number;
    logIndex?: number;
  },
): number {
  const aBlock = a.blockNumber ?? 0n;
  const bBlock = b.blockNumber ?? 0n;

  if (aBlock !== bBlock) return aBlock < bBlock ? -1 : 1;

  const aTxIndex = a.transactionIndex ?? 0;
  const bTxIndex = b.transactionIndex ?? 0;

  if (aTxIndex !== bTxIndex) return aTxIndex - bTxIndex;

  return (a.logIndex ?? 0) - (b.logIndex ?? 0);
}

function getOrCreateState(
  balances: Map<Address, HolderState>,
  address: Address,
): HolderState {
  const current = balances.get(address);

  if (current) return current;

  const initial = { balance: 0n, costBasisWei: 0n };
  balances.set(address, initial);
  return initial;
}

async function loadHolders(client: PublicClient): Promise<HoldersData> {
  const [logs, currentFloor] = await Promise.all([
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: TRANSFER_EVENT,
      fromBlock: 0n,
      toBlock: "latest",
    }),
    client.readContract({
      address: CONTRACT_ADDRESS,
      abi: G50_ABI,
      functionName: "floor",
    }) as Promise<bigint>,
  ]);

  const sortedLogs = [...logs].sort(compareTransferLogs);
  const mintTxHashes = [...new Set(
    sortedLogs
      .filter((log) => log.args.from === zeroAddress && !!log.transactionHash)
      .map((log) => log.transactionHash as `0x${string}`),
  )];
  const mintValueEntries = await Promise.all(
    mintTxHashes.map(async (hash) => {
      const tx = await client.getTransaction({ hash });
      return [hash, tx.value] as const;
    }),
  );

  const mintValues = new Map(mintValueEntries);
  const balances = new Map<Address, HolderState>();

  for (const log of sortedLogs) {
    const from = log.args.from;
    const to = log.args.to;
    const value = log.args.value ?? 0n;

    if (!from || !to || value <= 0n) continue;

    if (from === zeroAddress) {
      const recipient = getOrCreateState(balances, to);
      recipient.balance += value;
      recipient.costBasisWei += mintValues.get(log.transactionHash!) ?? 0n;
      continue;
    }

    const sender = getOrCreateState(balances, from);
    const transferableAmount = sender.balance > value ? value : sender.balance;
    const transferableCostBasis =
      sender.balance > 0n
        ? (sender.costBasisWei * transferableAmount) / sender.balance
        : 0n;

    sender.balance -= transferableAmount;
    sender.costBasisWei =
      sender.costBasisWei > transferableCostBasis
        ? sender.costBasisWei - transferableCostBasis
        : 0n;

    if (to === zeroAddress) {
      continue;
    }

    const recipient = getOrCreateState(balances, to);
    recipient.balance += transferableAmount;
    recipient.costBasisWei += transferableCostBasis;
  }

  const positiveBalances = [...balances.entries()].filter(
    (entry): entry is [Address, HolderState] => entry[1].balance > 0n,
  );
  const totalSupply = positiveBalances.reduce(
    (sum, [, holder]) => sum + holder.balance,
    0n,
  );

  const holders = positiveBalances
    .map(([address, holder]) => {
      const currentValueWei = holder.balance * currentFloor;
      return {
        address,
        balance: holder.balance,
        sharePct:
          totalSupply > 0n
            ? Number((holder.balance * 10000n) / totalSupply) / 100
            : 0,
        currentValueEth: weiToEth(currentValueWei),
        unrealizedPnlEth: weiToEth(currentValueWei - holder.costBasisWei),
      };
    })
    .sort((a, b) => {
      if (a.balance === b.balance) {
        return a.address.localeCompare(b.address);
      }
      return a.balance > b.balance ? -1 : 1;
    });

  return { holders, totalSupply };
}

export function useHolders() {
  const client = usePublicClient();
  const { data: blockNumber } = useBlock();

  return useQuery({
    queryKey: ["holders", blockNumber?.toString() ?? "latest"],
    queryFn: () => loadHolders(client!),
    enabled: !!client && !!CONTRACT_ADDRESS,
  });
}
