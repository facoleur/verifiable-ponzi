"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface MetricCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  unitClassName?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  className,
  labelClassName,
  valueClassName,
  unitClassName,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-slate-300/50 p-4 backdrop-blur-xl",
        className,
      )}
    >
      <div className={cn("text-xs font-medium text-slate-600", labelClassName)}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className={cn("text-base font-medium text-slate-900", valueClassName)}>
          {value}
        </div>
        {unit ? (
          <div className={cn("text-slate-500", unitClassName)}>{unit}</div>
        ) : null}
      </div>
    </div>
  );
}
