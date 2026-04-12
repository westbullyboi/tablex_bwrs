import { useQueryStore } from "../../store/queryStore";
import { useColumnResize } from "../../hooks/useColumnResize";
import { Play } from "lucide-react";
import { QueryResultTable } from "./QueryResultTable";
import { CrudTable } from "./CrudTable";
import { Skeleton } from "../ui/skeleton";

export function ResultGrid() {
  const { result, error, isExecuting, isCrudMode, tableData, isLoading } =
    useQueryStore();

  // Get column count from result or tableData
  const columnCount = result?.columns.length ?? tableData?.columns.length ?? 0;
  const { columnWidths, handleResizeStart } = useColumnResize(columnCount, {
    defaultWidth: 150,
    minWidth: 50,
  });

  if (isExecuting || isLoading) {
    return (
      <div className="p-4 space-y-3" role="status" aria-label="Loading results">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-6 flex-1" />
            ))}
          </div>
        ))}
        <span className="sr-only">
          {isExecuting ? "Executing query..." : "Loading..."}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div
          role="alert"
          className="rounded-(--radius) bg-[hsl(var(--destructive))]/10 p-3 text-[13px] text-[hsl(var(--destructive))]"
        >
          {error}
        </div>
      </div>
    );
  }

  // CRUD mode rendering
  if (isCrudMode && tableData) {
    return (
      <CrudTable
        tableData={tableData}
        columnWidths={columnWidths}
        onResizeStart={handleResizeStart}
      />
    );
  }

  // Regular query result mode
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
        <Play className="h-8 w-8 opacity-30" />
        <div className="text-[13px]">Run a query to see results</div>
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Query executed successfully (no results)
      </div>
    );
  }

  return (
    <QueryResultTable
      key={result.columns.map((c) => c.name).join(",")}
      result={result}
      columnWidths={columnWidths}
      onResizeStart={handleResizeStart}
    />
  );
}
