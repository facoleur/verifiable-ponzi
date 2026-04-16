"use client";

import { HoldersDistributionBar } from "@/components/analytics/HoldersDistributionBar";
import { HoldersTable } from "@/components/analytics/HoldersTable";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "@/components/ui/section";
import { useHolders } from "@/hooks/useHolders";
import { formatToken } from "@/utils/format";
import { useTranslations } from "next-intl";

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const { data, isLoading } = useHolders();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-275 flex-1 flex-col gap-4 px-6 pb-16 max-[820px]:px-4 max-[820px]:pb-12">
        <Section className="p-5">
          <h1 className="text-2xl font-medium text-slate-800">{t("title")}</h1>
        </Section>

        <section className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
          <MetricCard
            label={t("holdersTitle")}
            value={data ? t("holdersCount", { count: data.holders.length }) : "—"}
            className="bg-slate-300/45"
            valueClassName="text-xl"
          />
          <MetricCard
            label={t("totalSupply")}
            value={data ? formatToken(data.totalSupply) : "—"}
            className="bg-slate-300/45"
            valueClassName="text-xl"
          />
        </section>

        {data && data.holders.length > 0 ? (
          <HoldersDistributionBar holders={data.holders} />
        ) : null}

        <Section className="overflow-hidden">
          <SectionHeader bordered>
            <SectionTitle>{t("holdersTitle")}</SectionTitle>
          </SectionHeader>

          {isLoading ? (
            <SectionContent className="py-10 text-sm text-slate-500">
              {t("loading")}
            </SectionContent>
          ) : null}

          {!isLoading ? (
            <HoldersTable holders={data?.holders ?? []} emptyContent={t("empty")} />
          ) : null}
        </Section>
      </main>
      <Footer />
    </div>
  );
}
