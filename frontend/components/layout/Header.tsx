"use client";

import { useTranslations } from "next-intl";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";

export function Header() {
  const t = useTranslations("Header");

  return (
    <header className="sticky top-0 z-100 mx-auto mb-9 flex w-full max-w-275 items-center justify-between bg-slate-200/30 px-6 py-5 backdrop-blur-2xl">
      <div className="flex flex-col">
        <span className="text-xl font-semibold text-slate-800">G50</span>
        <span className="text-xs text-slate-600">
          A verifiable ponzi scheme
        </span>
      </div>
      <ConnectWalletButton />
    </header>
  );
}
