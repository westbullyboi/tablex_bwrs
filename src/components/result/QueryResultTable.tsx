import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { QueryResult, ColumnMetadata } from "../../types/query";

interface QueryResultTableProps {
  result: QueryResult;
  columnWidths: number[];
  onResizeStart: (e: React.MouseEvent, index: number) => void;
}

export function QueryResultTable({
  result,
  columnWidths,
  onResizeStart,
}: QueryResultTableProps) {
  const [sorting, onSortingChange] = useState<SortingState>([]);
  const columnHelper = createColumnHelper<unknown[]>();

  const columns = useMemo<ColumnDef<unknown[], unknown>[]>(() => {
    return result.columns.map((col: ColumnMetadata, index: number) =>
      columnHelper.accessor((row) => row[index], {
        id: `col_${index}`,
        header: () => col.name,
        cell: (info) => {
          const value = info.getValue();
          if (value === null) {
            return (
              <span className="rounded-sm bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[11px] italic text-[hsl(var(--table-null))]">
                NULL
              </span>
            );
          }
          return String(value);
        },
        meta: {
          dataType: col.data_type,
        },
      })
    );
  }, [result.columns, columnHelper]);

  const table = useReactTable({
    data: result.rows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(newSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-[hsl(var(--muted))] shadow-[0_1px_0_hsl(var(--border))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isSorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as
                    | { dataType?: string }
                    | undefined;

                  return (
                    <th
                      key={header.id}
                      style={{
                        width: columnWidths[index] || 150,
                        minWidth: 50,
                      }}
                      className="relative border-b border-r border-[hsl(var(--border))] text-left font-medium"
                    >
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer select-none px-3 py-2 transition-colors hover:bg-[hsl(var(--accent))]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          <SortIcon direction={isSorted} />
                        </div>
                        {meta?.dataType && (
                          <div className="font-[var(--font-mono)] text-[11px] font-normal text-[hsl(var(--muted-foreground))]">
                            {meta.dataType}
                          </div>
                        )}
                      </div>
                      <div
                        onMouseDown={(e) => onResizeStart(e, index)}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--primary))]"
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="font-[var(--font-mono)]">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-[hsl(var(--table-row-hover))]"
              >
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <td
                    key={cell.id}
                    style={{
                      width: columnWidths[cellIndex] || 150,
                      minWidth: 50,
                    }}
                    className="overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-[hsl(var(--border))] px-3 py-1.5"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {result.row_count} rows in {result.execution_time_ms}ms
        </span>
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) {
    return (
      <ArrowUpDown className="h-3 w-3 text-[hsl(var(--muted-foreground))]/50" />
    );
  }

  return direction === "asc" ? (
    <ArrowUp className="h-3 w-3 text-[hsl(var(--primary))]" />
  ) : (
    <ArrowDown className="h-3 w-3 text-[hsl(var(--primary))]" />
  );
}
