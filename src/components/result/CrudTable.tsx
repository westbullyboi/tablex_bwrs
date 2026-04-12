import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TableData, TableRow, TableColumnInfo } from "../../types/query";
import { useQueryStore } from "../../store/queryStore";
import { EditableCell } from "./EditableCell";
import { InsertRowDialog } from "./InsertRowDialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

interface CrudTableProps {
  tableData: TableData;
  columnWidths: number[];
  onResizeStart: (e: React.MouseEvent, index: number) => void;
}

export function CrudTable({
  tableData,
  columnWidths,
  onResizeStart,
}: CrudTableProps) {
  const {
    isLoading,
    editingCell,
    pendingChanges,
    pendingDeletes,
    pendingInserts,
    currentPage,
    pageSize,
    setEditingCell,
    updateCell,
    setPage,
    setPageSize,
    saveChanges,
    discardChanges,
    refreshTableData,
    markForDelete,
    addPendingInsert,
  } = useQueryStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isInsertDialogOpen, setIsInsertDialogOpen] = useState(false);

  const isReadOnly = !tableData.has_primary_key;
  const hasPendingChanges =
    pendingChanges.size > 0 ||
    pendingInserts.length > 0 ||
    pendingDeletes.size > 0;

  const columnHelper = createColumnHelper<TableRow>();

  const columns = useMemo<ColumnDef<TableRow, unknown>[]>(() => {
    const cols: ColumnDef<TableRow, unknown>[] = [];

    // Selection column (only if not read-only)
    if (!isReadOnly) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-[hsl(var(--border))]"
          />
        ),
        cell: ({ row }) => {
          const isDeleted = pendingDeletes.has(row.original.id);
          return (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={isDeleted}
              onChange={row.getToggleSelectedHandler()}
              className="h-4 w-4 rounded border-[hsl(var(--border))]"
            />
          );
        },
        size: 40,
        enableSorting: false,
      });
    }

    // Data columns
    tableData.columns.forEach((col: TableColumnInfo, index: number) => {
      cols.push(
        columnHelper.accessor((row) => row.values[index], {
          id: `col_${index}`,
          header: () => col.name,
          cell: ({ row, getValue }) => {
            const cellValue = getValue();
            const rowData = row.original;
            const cellKey = `${rowData.id}:${col.name}`;
            const pendingChange = pendingChanges.get(cellKey);
            const isModified = !!pendingChange;
            const displayValue = isModified
              ? pendingChange.newValue
              : cellValue;
            const isDeleted = pendingDeletes.has(rowData.id);
            const isEditing =
              editingCell?.rowId === rowData.id &&
              editingCell?.column === col.name;
            const isCellReadOnly = isReadOnly || col.is_auto_generated;

            return (
              <EditableCell
                value={displayValue}
                column={col}
                isEditing={isEditing}
                isModified={isModified}
                isDeleted={isDeleted}
                onStartEdit={() =>
                  setEditingCell({ rowId: rowData.id, column: col.name })
                }
                onSave={(newValue) =>
                  updateCell(rowData.id, col.name, cellValue, newValue)
                }
                onCancel={() => setEditingCell(null)}
                readOnly={isCellReadOnly}
              />
            );
          },
          meta: {
            columnInfo: col,
          },
        })
      );
    });

    return cols;
  }, [
    tableData.columns,
    isReadOnly,
    pendingChanges,
    pendingDeletes,
    editingCell,
    setEditingCell,
    updateCell,
    columnHelper,
  ]);

  const table = useReactTable({
    data: tableData.rows,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: !isReadOnly,
  });

  const selectedRowIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  );

  const handleDeleteSelected = () => {
    markForDelete(selectedRowIds);
    setRowSelection({});
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {isReadOnly && (
          <div className="bg-[hsl(var(--warning))]/10 px-3 py-1 text-xs text-[hsl(var(--warning))]">
            This table has no primary key. Data is read-only.
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-[hsl(var(--muted))] shadow-[0_1px_0_hsl(var(--border))]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isSorted = header.column.getIsSorted();
                    const meta = header.column.columnDef.meta as
                      | { columnInfo?: TableColumnInfo }
                      | undefined;
                    const columnInfo = meta?.columnInfo;
                    const isSelectColumn = header.id === "select";

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: isSelectColumn
                            ? 40
                            : columnWidths[isReadOnly ? index : index - 1] ||
                              150,
                          minWidth: isSelectColumn ? 40 : 50,
                        }}
                        className={cn(
                          "relative border-b border-r border-[hsl(var(--border))] text-left font-medium",
                          isSelectColumn && "w-10 px-2 py-2"
                        )}
                      >
                        {isSelectColumn ? (
                          <div className="flex items-center justify-center">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        ) : (
                          <>
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
                                {columnInfo?.is_primary_key && (
                                  <Key className="h-3 w-3 text-[hsl(var(--tree-icon-key))]" />
                                )}
                                <SortIcon direction={isSorted} />
                              </div>
                              {columnInfo && (
                                <div className="font-[var(--font-mono)] text-[11px] font-normal text-[hsl(var(--muted-foreground))]">
                                  {columnInfo.data_type}
                                  {columnInfo.is_auto_generated && " (auto)"}
                                </div>
                              )}
                            </div>
                            <div
                              onMouseDown={(e) =>
                                onResizeStart(e, isReadOnly ? index : index - 1)
                              }
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--primary))]"
                            />
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="font-[var(--font-mono)]">
              {table.getRowModel().rows.map((row) => {
                const isDeleted = pendingDeletes.has(row.original.id);
                const isSelected = row.getIsSelected();

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      isDeleted
                        ? "bg-[hsl(var(--destructive))]/10"
                        : isSelected
                          ? "bg-[hsl(var(--table-row-selected))]"
                          : "hover:bg-[hsl(var(--table-row-hover))]"
                    )}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isSelectColumn = cell.column.id === "select";

                      return (
                        <td
                          key={cell.id}
                          style={{
                            width: isSelectColumn
                              ? 40
                              : columnWidths[
                                  isReadOnly ? cellIndex : cellIndex - 1
                                ] || 150,
                            minWidth: isSelectColumn ? 40 : 50,
                          }}
                          className={cn(
                            "border-b border-r border-[hsl(var(--border))]",
                            isSelectColumn
                              ? "px-2 py-1.5 text-center"
                              : "px-3 py-1.5"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom toolbar with CRUD buttons and Pagination */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1">
          {/* CRUD Toolbar */}
          {tableData.has_primary_key ? (
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsInsertDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Row</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedRowIds.length === 0}
                    className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected</TooltipContent>
              </Tooltip>

              <div className="mx-1 h-4 w-px bg-[hsl(var(--border))]" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={saveChanges}
                    disabled={!hasPendingChanges || isLoading}
                    className="text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10 hover:text-[hsl(var(--success))]"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Changes</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={discardChanges}
                    disabled={!hasPendingChanges}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Discard Changes</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={refreshTableData}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Read-only (no primary key)
            </span>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {currentPage * pageSize + 1}-
              {Math.min((currentPage + 1) * pageSize, tableData.total_count)} of{" "}
              {tableData.total_count}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={(currentPage + 1) * pageSize >= tableData.total_count}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Insert Row Dialog */}
        <InsertRowDialog
          key={String(isInsertDialogOpen)}
          isOpen={isInsertDialogOpen}
          onClose={() => setIsInsertDialogOpen(false)}
          columns={tableData.columns}
          onInsert={(values) => {
            addPendingInsert(values);
            setIsInsertDialogOpen(false);
          }}
        />
      </div>
    </TooltipProvider>
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
