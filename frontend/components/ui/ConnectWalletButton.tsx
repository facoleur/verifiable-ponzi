"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "./button";

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        if (!mounted) {
          return <Button disabled aria-hidden="true" />;
        }

        if (!connected) {
          return (
            <Button onClick={openConnectModal} type="button">
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              type="button"
              variant="destructive"
            >
              Wrong Network
            </Button>
          );
        }

        return (
          <div
            className="cursor-pointer rounded-lg border-0 bg-slate-400/50 pl-3 hover:bg-slate-400/40 active:scale-98"
            onClick={openAccountModal}
          >
            {account.balanceFormatted != null && (
              <span className="mr-1 pr-2 text-sm font-medium text-slate-700">
                {Number(account.balanceFormatted).toFixed(3)}{" "}
                <span className="text-slate-500">{account.balanceSymbol}</span>
              </span>
            )}
            <Button className="active:translate-y-0!">
              {account.displayName}
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
