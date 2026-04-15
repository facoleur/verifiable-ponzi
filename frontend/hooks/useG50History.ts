"use client"

import { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import { parseAbiItem } from "viem"
import { CONTRACT_ADDRESS, TOKEN_UNIT } from "../lib/constants"
import { useBlock } from "./useBlock"

export interface PricePoint {
  block: number
  floor: number    // ETH per whole token (float, for charting)
  ceiling: number
}

function weiPerUnitToFloat(weiPerUnit: bigint): number {
  // floor/ceiling are stored as wei per raw token unit
  // multiply by TOKEN_UNIT (1e8) to get wei per whole token, then divide by 1e18 for ETH
  return Number(weiPerUnit * TOKEN_UNIT) / 1e18
}

export function useG50History() {
  const [history, setHistory] = useState<PricePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const client = usePublicClient()
  const { data: blockNumber } = useBlock()

  useEffect(() => {
    if (!client || !CONTRACT_ADDRESS) return

    async function fetchLogs() {
      if (!client) return
      setIsLoading(true)
      try {
        const logs = await client.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem(
            "event PriceUpdate(uint256 newFloor, uint256 newCeiling, uint256 blockNumber)",
          ),
          fromBlock: 0n,
          toBlock: "latest",
        })

        const points: PricePoint[] = logs.map((log) => ({
          block: Number(log.args.blockNumber),
          floor: weiPerUnitToFloat(log.args.newFloor ?? 0n),
          ceiling: weiPerUnitToFloat(log.args.newCeiling ?? 0n),
        }))

        setHistory(points)
      } catch (e) {
        console.error("Failed to fetch price history:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [client, blockNumber])

  return { history, isLoading }
}
