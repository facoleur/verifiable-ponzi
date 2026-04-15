"use client";

/**
 * Web3-specific transaction status indicator.
 * Shows a pulsing dot + status text + truncated hash.
 */

import { Check, Copy } from "lucide-react";
import * as React from "react";

interface TxStatusProps {
  hash: `0x${string}`;
  isConfirming: boolean;
  isSuccess: boolean;
  className?: string;
  summary?: string;
}

export function TxStatus({
  hash,
  isConfirming,
  isSuccess,
  summary,
}: TxStatusProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isCopied) return;

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(hash);
    setIsCopied(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="text-xs">
          {isSuccess ? "Confirmed" : isConfirming ? "Mining" : "Sent"}
        </div>
        <div className="flex items-center justify-between gap-2 text-slate-500">
          <button
            type="button"
            aria-label={
              isCopied ? "Copied transaction hash" : "Copy transaction hash"
            }
            className="inline-flex shrink-0 items-center justify-center space-x-1 rounded-sm px-1 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            onClick={handleCopy}
          >
            <span className="break-all" title={hash}>
              {hash.slice(0, 10)}…{hash.slice(-8)}
            </span>
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
      {summary ? <div className="text-xs text-slate-700">{summary}</div> : null}
    </div>
  );
}
