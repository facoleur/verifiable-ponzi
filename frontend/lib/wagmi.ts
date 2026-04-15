import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { foundry } from "viem/chains";

export const config = getDefaultConfig({
  appName: "G50",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder",
  chains: [foundry],
  ssr: false,
});
