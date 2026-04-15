"use client"

import { useMemo } from "react"
import { zeroAddress } from "viem"
import { useAccount, useBalance, useReadContracts } from "wagmi"
import { G50_ABI } from "../lib/abi"
import { CONTRACT_ADDRESS, PRICE_UPDATE_INTERVAL } from "../lib/constants"
import { useBlock } from "./useBlock"

const enum Slot {
  Floor = 0,
  Ceiling = 1,
  LastUpdate = 2,
  Supply = 3,
  Balance = 4,
}

export interface G50State {
  floor: bigint | undefined
  ceiling: bigint | undefined
  lastUpdate: bigint | undefined
  supply: bigint | undefined
  userBalance: bigint | undefined
  contractEthBalance: bigint | undefined
  blockNumber: bigint | undefined
  blocksUntilUpdate: bigint | null
  isLoading: boolean
  refetch: () => void
}

export function useG50State(): G50State {
  const { address } = useAccount()
  const enabled = !!CONTRACT_ADDRESS

  const {
    data: reads,
    isLoading: readsLoading,
    refetch,
  } = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: G50_ABI, functionName: "floor" },
      { address: CONTRACT_ADDRESS, abi: G50_ABI, functionName: "ceiling" },
      { address: CONTRACT_ADDRESS, abi: G50_ABI, functionName: "lastUpdate" },
      { address: CONTRACT_ADDRESS, abi: G50_ABI, functionName: "totalSupply" },
      {
        address: CONTRACT_ADDRESS,
        abi: G50_ABI,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
      },
    ],
    query: { enabled, refetchInterval: 12_000 },
  })

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: CONTRACT_ADDRESS,
    query: { enabled, refetchInterval: 12_000 },
  })

  const { data: blockNumber } = useBlock()

  const floor       = reads?.[Slot.Floor]?.result      as bigint | undefined
  const ceiling     = reads?.[Slot.Ceiling]?.result    as bigint | undefined
  const lastUpdate  = reads?.[Slot.LastUpdate]?.result as bigint | undefined
  const supply      = reads?.[Slot.Supply]?.result     as bigint | undefined
  const userBalance = reads?.[Slot.Balance]?.result    as bigint | undefined

  const blocksUntilUpdate = useMemo(() => {
    if (lastUpdate == null || blockNumber == null) return null
    const next = lastUpdate + BigInt(PRICE_UPDATE_INTERVAL)
    return next > blockNumber ? next - blockNumber : 0n
  }, [lastUpdate, blockNumber])

  return {
    floor,
    ceiling,
    lastUpdate,
    supply,
    userBalance,
    contractEthBalance: balanceData?.value,
    blockNumber,
    blocksUntilUpdate,
    isLoading: readsLoading || balanceLoading,
    refetch,
  }
}
