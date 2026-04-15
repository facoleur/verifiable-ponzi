"use client"

import { useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { G50_ABI } from "../lib/abi"
import { CONTRACT_ADDRESS, TOKEN_DECIMALS } from "../lib/constants"
import {
  classifyTradeError,
  tradeErrorMessage,
  type TradeFailureReason,
} from "../utils/errors"

export type { TradeFailureReason }

export interface UseG50TradeResult {
  buy: (ethAmount: string) => Promise<void>
  sell: (tokenAmount: string) => Promise<void>
  txHash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  failure: TradeFailureReason | null
  resetTrade: () => void
}

export function useG50Trade(): UseG50TradeResult {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [failure, setFailure] = useState<TradeFailureReason | null>(null)

  const {
    writeContractAsync,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  // Surface wagmi-level errors (e.g. wallet rejection before tx is sent)
  const wagmiError = writeError ?? receiptError
  if (wagmiError && !failure) {
    setFailure(classifyTradeError(wagmiError))
  }

  async function buy(ethAmount: string): Promise<void> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured")
    setFailure(null)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: G50_ABI,
        functionName: "buy",
        value: parseEther(ethAmount),
      })
      setTxHash(hash)
    } catch (e) {
      setFailure(classifyTradeError(e))
      throw e
    }
  }

  async function sell(tokenAmount: string): Promise<void> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured")
    setFailure(null)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: G50_ABI,
        functionName: "sell",
        args: [parseUnits(tokenAmount, TOKEN_DECIMALS)],
      })
      setTxHash(hash)
    } catch (e) {
      setFailure(classifyTradeError(e))
      throw e
    }
  }

  function resetTrade() {
    setTxHash(undefined)
    setFailure(null)
    reset()
  }

  return {
    buy,
    sell,
    txHash,
    isPending: isWritePending || isConfirming,
    isConfirming,
    isSuccess,
    failure,
    resetTrade,
  }
}

export { tradeErrorMessage }
