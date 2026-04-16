"use client";

import { DataTable } from "@/components/ui/data-table";
import type { HolderBalance } from "@/hooks/useHolders";
import { formatEthValue, formatToken, shortenAddress } from "@/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

interface HoldersTableProps {
  holders: HolderBalance[];
  emptyContent: string;
}

function formatShare(sharePct: number): string {
  return `${sharePct.toFixed(2)}%`;
}

export function HoldersTable({
  holders,
  emptyContent,
}: HoldersTableProps) {
  const t = useTranslations("Analytics");

  const columns: ColumnDef<HolderBalance>[] = [
    {
      id: "rank",
      header: t("rank"),
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      meta: {
        headerClassName: "w-16",
        cellClassName: "text-slate-500",
      },
    },
    {
      accessorKey: "address",
      header: t("holder"),
      cell: ({ row }) => (
        <span className="text-slate-800" title={row.original.address}>
          {shortenAddress(row.original.address)}
        </span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "balance",
      header: t("balance"),
      cell: ({ row }) => formatToken(row.original.balance),
      sortingFn: (a, b) => {
        const left = a.original.balance;
        const right = b.original.balance;
        if (left === right) return 0;
        return left > right ? 1 : -1;
      },
      meta: {
        cellClassName: "font-medium text-slate-800",
      },
    },
    {
      accessorKey: "currentValueEth",
      header: t("ethValue"),
      cell: ({ row }) => `${formatEthValue(row.original.currentValueEth, 4)} ETH`,
      meta: {
        cellClassName: "text-slate-800",
      },
    },
    {
      accessorKey: "sharePct",
      header: t("share"),
      cell: ({ row }) => formatShare(row.original.sharePct),
      meta: {
        cellClassName: "text-slate-600",
      },
    },
    {
      accessorKey: "unrealizedPnlEth",
      header: t("unrealizedPnl"),
      cell: ({ row }) => {
        const pnl = row.original.unrealizedPnlEth;
        return (
          <span className={pnl >= 0 ? "text-emerald-700" : "text-red-700"}>
            {pnl >= 0 ? "+" : ""}
            {formatEthValue(pnl, 4)} ETH
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={holders}
      emptyContent={emptyContent}
      getRowId={(row) => row.address}
    />
  );
}
