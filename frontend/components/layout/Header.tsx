"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";

export function Header() {
  const t = useTranslations("Header");
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/analytics", label: t("analytics") },
  ];

  return (
    <header className="sticky top-0 z-100 mx-auto mb-9 grid w-full max-w-275 grid-cols-[1fr_auto_1fr] items-center bg-slate-200/30 px-6 py-5 backdrop-blur-2xl max-[820px]:grid-cols-1 max-[820px]:gap-4">
      <div className="flex flex-col max-[820px]:items-center">
        <span className="text-xl font-semibold text-slate-800">G50</span>
        <span className="text-xs text-slate-600">
          A verifiable ponzi scheme
        </span>
      </div>

      <nav className="flex justify-center gap-1 p-1 text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium",
                isActive
                  ? "bg-white/40 text-slate-800"
                  : "text-slate-600 hover:text-slate-800",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="justify-self-end max-[820px]:justify-self-center">
        <ConnectWalletButton />
      </div>
    </header>
  );
}
