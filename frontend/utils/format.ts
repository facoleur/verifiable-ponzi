import { formatEther } from "viem";
import { TOKEN_DECIMALS, TOKEN_UNIT } from "../lib/constants";

export function formatToken(raw: bigint, precision: number = 4): string {
  const whole = raw / TOKEN_UNIT;
  const frac = raw % TOKEN_UNIT;

  if (frac === 0n) return whole.toLocaleString();

  let fracStr = frac
    .toString()
    .padStart(TOKEN_DECIMALS, "0")
    .replace(/0+$/, "");

  if (precision >= 0) {
    fracStr = fracStr.slice(0, precision);
  }

  return fracStr.length > 0
    ? `${whole.toLocaleString()}.${fracStr}`
    : whole.toLocaleString();
}

export function formatEthAmount(wei: bigint, precision = 4): string {
  if (wei === 0n) return "0";
  const num = parseFloat(formatEther(wei));
  if (num === 0) return "0";
  if (num < 0.0000001) return num.toExponential(4);
  return num.toFixed(precision).replace(/\.?0+$/, "");
}

export function formatEthValue(value: number, precision = 4): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 0.0000001) return value.toExponential(4);
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

/** Convert wei-per-raw-token-unit to ETH per whole token. */
export function weiPerUnitToEthPerToken(weiPerUnit: bigint): string {
  if (weiPerUnit === 0n) return "0";
  return formatEthAmount(weiPerUnit * TOKEN_UNIT);
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
