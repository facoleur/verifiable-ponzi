import {
  CEILING_PREMIUM_DENOMINATOR,
  CEILING_PREMIUM_NUMERATOR,
} from "../lib/constants"

export interface BuyPreview {
  kind: "buy"
  tokensReceived: bigint
  projectedFloor: bigint
  projectedCeiling: bigint
}

export interface SellPreview {
  kind: "sell"
  ethReceived: bigint
  projectedFloor: bigint
  projectedCeiling: bigint
}

export type OrderPreview = BuyPreview | SellPreview

export function projectBuy(
  ethIn: bigint,
  ceiling: bigint,
  supply: bigint,
  contractBalance: bigint,
): BuyPreview | null {
  if (ceiling === 0n || ethIn === 0n) return null
  const tokensReceived = ethIn / ceiling
  if (tokensReceived === 0n) return null
  const newSupply = supply + tokensReceived
  const newBalance = contractBalance + ethIn
  const projectedFloor = newBalance / newSupply
  const projectedCeiling =
    (projectedFloor * CEILING_PREMIUM_NUMERATOR) / CEILING_PREMIUM_DENOMINATOR
  return { kind: "buy", tokensReceived, projectedFloor, projectedCeiling }
}

export function projectSell(
  tokenUnits: bigint,
  floor: bigint,
  supply: bigint,
  contractBalance: bigint,
): SellPreview | null {
  if (floor === 0n || tokenUnits === 0n || tokenUnits > supply) return null
  const ethReceived = tokenUnits * floor
  if (ethReceived > contractBalance) return null
  const newSupply = supply - tokenUnits
  if (newSupply === 0n) return null
  const newBalance = contractBalance - ethReceived
  const projectedFloor = newBalance / newSupply
  const projectedCeiling =
    (projectedFloor * CEILING_PREMIUM_NUMERATOR) / CEILING_PREMIUM_DENOMINATOR
  return { kind: "sell", ethReceived, projectedFloor, projectedCeiling }
}
