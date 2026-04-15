import { G50_ADDRESS } from "@/generated/contracts";

export const CONTRACT_ADDRESS = G50_ADDRESS as `0x${string}`;

export const TOKEN_DECIMALS = 8;
export const TOKEN_UNIT = 10n ** BigInt(TOKEN_DECIMALS);
export const PRICE_UPDATE_INTERVAL = 10; // blocks

// Ceiling is always 5% above floor: floor × 21 / 20
export const CEILING_PREMIUM_NUMERATOR = 21n
export const CEILING_PREMIUM_DENOMINATOR = 20n
