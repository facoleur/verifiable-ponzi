"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type RowData,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import * as React from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyContent?: React.ReactNode;
  getRowId?: (originalRow: TData, index: number) => string;
  className?: string;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="size-3.5" />;
  if (sorted === "desc") return <ArrowDown className="size-3.5" />;
  return <ArrowUpDown className="size-3.5" />;
}

export function DataTable<TData>({
  columns,
  data,
  emptyContent,
  getRowId,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-left">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-300/60 text-xs text-slate-500"
            >
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;

                return (
                  <th
                    key={header.id}
                    className={cn("px-5 py-3 font-medium", meta?.headerClassName)}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-auto gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIcon sorted={header.column.getIsSorted()} />
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                className="px-5 py-10 text-sm text-slate-500"
                colSpan={columns.length}
              >
                {emptyContent}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-300/40 text-sm last:border-b-0"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-5 py-3 align-middle",
                        meta?.cellClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
