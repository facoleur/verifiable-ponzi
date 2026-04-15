import { parseEther, parseUnits } from "viem"
import { TOKEN_DECIMALS } from "../lib/constants"

export function parseTokenAmount(raw: string): bigint | null {
  if (!raw || isNaN(Number(raw)) || Number(raw) <= 0) return null
  try {
    return parseUnits(raw, TOKEN_DECIMALS)
  } catch {
    return null
  }
}

export function parseEthAmount(raw: string): bigint | null {
  if (!raw || isNaN(Number(raw)) || Number(raw) <= 0) return null
  try {
    return parseEther(raw)
  } catch {
    return null
  }
}
