"use client"

import { useMemo } from "react"
import { parseEther } from "viem"
import { TOKEN_DECIMALS } from "../lib/constants"
import {
  projectBuy,
  projectSell,
  type OrderPreview,
} from "../utils/math"
import type { G50State } from "./useG50State"

interface Params {
  tab: "buy" | "sell"
  amount: string
  state: G50State
}

export function useOrderPreview({ tab, amount, state }: Params): OrderPreview | null {
  const { floor, ceiling, supply, contractEthBalance } = state

  return useMemo(() => {
    if (
      !amount ||
      !floor ||
      !ceiling ||
      supply == null ||
      contractEthBalance == null
    )
      return null
    try {
      if (tab === "buy") {
        return projectBuy(parseEther(amount), ceiling, supply, contractEthBalance)
      }
      const tokenUnits = BigInt(
        Math.round(parseFloat(amount) * 10 ** TOKEN_DECIMALS),
      )
      return projectSell(tokenUnits, floor, supply, contractEthBalance)
    } catch {
      return null
    }
  }, [tab, amount, floor, ceiling, supply, contractEthBalance])
}
