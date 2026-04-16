"use client";

import { useG50State } from "@/hooks/useG50State";
import { ChartsSection } from "../components/charts/ChartsSection";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { ContractStats } from "../components/stats/ContractStats";
import { UserPosition } from "../components/stats/UserPosition";
import { TradePanel } from "../components/trade/TradePanel";

export default function Home() {
  const state = useG50State();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto grid w-full max-w-275 flex-1 grid-cols-[1fr_400px] items-start gap-8 px-6 pb-16 max-[820px]:grid-cols-1 max-[820px]:px-4 max-[820px]:pb-12">
        <div className="flex flex-col gap-2">
          <ContractSwtats state={state} />
          <UserPosition state={state} />
          <ChartsSection state={state} />
        </div>

        <aside className="sticky top-27 self-start">
          <TradePanel state={state} />
        </aside>
      </main>
      <Footer />
    </div>
  );
}
