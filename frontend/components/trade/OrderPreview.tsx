"use client";

import { Text } from "@/components/ui/typography";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { weiPerUnitToEthPerToken } from "../../utils/format";
import type { OrderPreview } from "../../utils/math";

interface OrderPreviewProps {
  preview: OrderPreview;
  currentFloor: bigint;
  currentCeiling: bigint;
}

function EthPerTokenValue({ value }: { value: bigint }) {
  return (
    <span className="flex w-14 flex-row items-center justify-end text-right">
      {weiPerUnitToEthPerToken(value)}
    </span>
  );
}

function Delta({
  label,
  current,
  projected,
}: {
  label: string;
  current: bigint;
  projected: bigint;
}) {
  return (
    <div className="flex w-full flex-row justify-between">
      <Text.Xs className="text-slate-600">{label}</Text.Xs>
      <div className="flex flex-row items-center gap-2 text-slate-800">
        <EthPerTokenValue value={current} />
        <ArrowRight className="text-slate-600" size={14} />

        <EthPerTokenValue value={projected} />
      </div>
    </div>
  );
}

export function OrderPreviewPanel({
  preview,
  currentFloor,
  currentCeiling,
}: OrderPreviewProps) {
  const t = useTranslations("OrderPreview");

  return (
    <div>
      {/* <div className="flex w-full flex-row justify-between">
        <Text.Xs className="font-medium text-slate-600">
          {t("nextUpdate")}
        </Text.Xs>
        <Text.Xs className="font-medium text-slate-800">
          {t("nextUpdateValue", { value: nextUpdate })}
        </Text.Xs>
      </div> */}
      <div>
        <Delta
          label={t("floor")}
          current={currentFloor}
          projected={preview.projectedFloor}
        />
        <Delta
          label={t("ceiling")}
          current={currentCeiling}
          projected={preview.projectedCeiling}
        />
      </div>
    </div>
  );
}
