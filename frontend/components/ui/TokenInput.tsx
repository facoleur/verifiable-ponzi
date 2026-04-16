"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Button } from "./button";

interface TokenInputProps {
  label: string;
  /** Currency ticker shown right-aligned in the input row, same font but dimmed */
  symbol: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  decimals?: number;
  /** Pre-formatted USD equivalent shown below the amount, e.g. "≈ $1,234.56" */
  usdValue?: string;
  className?: string;
  disabled?: boolean;
  showMaxButton?: boolean;
  maxButtonLabel?: string;
  balanceLabel?: string;
  onMaxClick?: () => void;
}

export function TokenInput({
  label,
  symbol,
  value,
  onChange,
  placeholder = "0.00",
  decimals = 2,
  usdValue,
  className,
  disabled,
  showMaxButton = false,
  maxButtonLabel = "Max",
  balanceLabel,
  onMaxClick,
}: TokenInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayedUsdValue =
    usdValue != null
      ? Number(usdValue).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const display = (() => {
    if (!value || value === "0") return "";
    const dot = value.indexOf(".");
    if (dot === -1) return value;
    return value.slice(0, dot + 1 + decimals);
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // block invalid chars and excess decimal places
    if (!new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`).test(val)) return;

    // auto prepend 0 if starting with "."
    if (val.startsWith(".")) {
      val = "0" + val;
    }

    onChange(val);
  };
  return (
    <div
      className={cn(
        "group flex cursor-text flex-col rounded-md border border-transparent bg-slate-50 px-4 pt-3.5 pb-3 focus-within:border focus-within:border-slate-300 focus-within:bg-transparent hover:border-slate-200",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Label */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs">{label}</span>
        {showMaxButton && onMaxClick ? (
          <div className="invisible flex items-center gap-2 group-focus-within:visible group-hover:visible">
            <span className="text-xs tracking-[0.02em] text-slate-500">
              {balanceLabel}
            </span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onMaxClick();
              }}
            >
              {maxButtonLabel}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Value + currency row */}
      <div className="flex items-center gap-3 font-semibold">
        <div className="relative inline-block">
          {/* formatted display */}
          <div className="pointer-events-none absolute inset-0 flex items-center text-[28px] tracking-[-0.03em] text-slate-800">
            {display && (
              <>
                <span>{display}</span>
                <span className="ml-2 text-slate-400">{symbol}</span>
              </>
            )}
          </div>

          {/* real input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            disabled={disabled}
            className="relative z-10 bg-transparent text-[28px] font-medium tracking-[-0.03em] text-transparent caret-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* USD equivalent */}
      <span
        className={cn(
          "mt-1.5 text-xs",
          usdValue ? "opacity-100" : "opacity-0 select-none",
        )}
      >
        <span className="mr-0.5 text-slate-500">$</span>
        <span className="text-slate-800">{displayedUsdValue ?? "—"}</span>
      </span>
    </div>
  );
}
