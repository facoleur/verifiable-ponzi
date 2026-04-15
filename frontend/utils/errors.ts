import type { BaseError } from "viem"

export type TradeFailureReason =
  | { kind: "user_rejected" }
  | { kind: "insufficient_funds" }
  | { kind: "contract_revert"; message: string }
  | { kind: "network_error"; message: string }

export function classifyTradeError(e: unknown): TradeFailureReason {
  const err = e as BaseError
  const message =
    err?.shortMessage ?? (e as Error)?.message ?? String(e)
  const lower = message.toLowerCase()

  if (
    err?.name === "UserRejectedRequestError" ||
    lower.includes("user rejected") ||
    lower.includes("rejected the request")
  ) {
    return { kind: "user_rejected" }
  }
  if (lower.includes("insufficient funds")) {
    return { kind: "insufficient_funds" }
  }
  if (
    err?.name === "ContractFunctionRevertedError" ||
    lower.includes("revert")
  ) {
    return { kind: "contract_revert", message }
  }
  return { kind: "network_error", message }
}

export function tradeErrorMessage(reason: TradeFailureReason): string {
  switch (reason.kind) {
    case "user_rejected":
      return "Transaction cancelled."
    case "insufficient_funds":
      return "Insufficient ETH balance."
    case "contract_revert":
      return reason.message
    case "network_error":
      return reason.message
  }
}
