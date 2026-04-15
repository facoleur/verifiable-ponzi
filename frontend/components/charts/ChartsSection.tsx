import type { G50State } from "../../hooks/useG50State";
import { BondingSimChart } from "./BondingSimChart";
import { PriceHistoryChart } from "./PriceHistoryChart";

interface ChartsSectionProps {
  state: G50State;
}

export function ChartsSection({ state }: ChartsSectionProps) {
  return (
    <section className="col-span-full grid grid-cols-1 gap-2">
      <PriceHistoryChart />
      <BondingSimChart state={state} />
    </section>
  );
}
