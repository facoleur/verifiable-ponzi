"use client"

import { useQuery } from "@tanstack/react-query"
import { parseAbiItem } from "viem"
import type { Address, PublicClient } from "viem"
import { usePublicClient } from "wagmi"
import { G50_ABI } from "../lib/abi"
import { CONTRACT_ADDRESS } from "../lib/constants"

const MINT_EVENT = parseAbiItem("event Mint(address indexed to, uint256 amount)")
const BURN_EVENT = parseAbiItem("event Burn(address indexed from, uint256 amount)")

async function loadCostBasis(
  client: PublicClient,
  address: Address,
): Promise<{ totalIn: bigint; totalOut: bigint }> {
  const [mintLogs, burnLogs] = await Promise.all([
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: MINT_EVENT,
      args: { to: address },
      fromBlock: 0n,
      toBlock: "latest",
    }),
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: BURN_EVENT,
      args: { from: address },
      fromBlock: 0n,
      toBlock: "latest",
    }),
  ])

  const buyValues = await Promise.all(
    mintLogs.map(async (log) => {
      if (!log.transactionHash) return 0n
      const tx = await client.getTransaction({ hash: log.transactionHash })
      return tx.value
    }),
  )
  const totalIn = buyValues.reduce((a, b) => a + b, 0n)

  const sellValues = await Promise.all(
    burnLogs.map(async (log) => {
      if (log.args.amount == null || log.blockNumber == null) return 0n
      const floor = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: G50_ABI,
        functionName: "floor",
        blockNumber: log.blockNumber,
      })) as bigint
      return log.args.amount * floor
    }),
  )
  const totalOut = sellValues.reduce((a, b) => a + b, 0n)

  return { totalIn, totalOut }
}

export interface CostBasis {
  totalIn: bigint
  totalOut: bigint
  netInvested: bigint
  isLoading: boolean
  refetch: () => void
}

export function useCostBasis(userAddress: Address | undefined): CostBasis {
  const client = usePublicClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["costBasis", userAddress],
    queryFn: () => loadCostBasis(client!, userAddress!),
    enabled: !!client && !!userAddress && !!CONTRACT_ADDRESS,
    // Only refetch when explicitly invalidated (e.g. after a trade).
    staleTime: Infinity,
  })

  return {
    totalIn: data?.totalIn ?? 0n,
    totalOut: data?.totalOut ?? 0n,
    netInvested: (data?.totalIn ?? 0n) - (data?.totalOut ?? 0n),
    isLoading,
    refetch: () => { void refetch() },
  }
}
