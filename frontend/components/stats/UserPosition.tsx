"use client";

import { usePositionAccounting } from "@/hooks/usePositionAccounting";
import { useAccount } from "wagmi";
import type { G50State } from "../../hooks/useG50State";
import { UserPositionView } from "./UserPositionView";

interface UserPositionProps {
  state: G50State;
}

export function UserPosition({ state }: UserPositionProps) {
  const { address, isConnected } = useAccount();
  const position = usePositionAccounting(address);

  if (!isConnected) return null;

  const { userBalance } = state;

  // const hasHistory = totalIn > 0n;
  // const pnlWei =
  //   valueWei != null && hasHistory ? valueWei - netInvested : undefined;
  // const pnlPct =
  //   pnlWei != null && netInvested > 0n
  //     ? Number((pnlWei * 10000n) / netInvested) / 100
  //     : undefined;

  return <UserPositionView userBalance={userBalance} position={position} />;
}
