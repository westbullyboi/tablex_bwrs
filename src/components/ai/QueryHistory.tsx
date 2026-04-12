import {
  History,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { useQueryStore, type QueryHistoryItem } from "../../store/queryStore";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";

interface QueryHistoryProps {
  onClose?: () => void;
}

export function QueryHistory({ onClose }: QueryHistoryProps) {
  const { queryHistory, setQuery, clearHistory } = useQueryStore();

  const handleSelect = (item: QueryHistoryItem) => {
    setQuery(item.query);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateQuery = (query: string, maxLength = 150) => {
    const singleLine = query.replace(/\s+/g, " ").trim();
    if (singleLine.length <= maxLength) return singleLine;
    return singleLine.substring(0, maxLength) + "...";
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-[hsl(var(--background))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-3 py-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--foreground))]">
            <History className="h-3.5 w-3.5" />
            History
          </div>
          <div className="flex items-center gap-1">
            {queryHistory.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={clearHistory}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear History</TooltipContent>
              </Tooltip>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* History list */}
        <ScrollArea className="flex-1">
          {queryHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-[hsl(var(--muted-foreground))]">
              <History className="h-8 w-8 opacity-30" />
              <div className="text-[12px] font-medium">No queries yet</div>
              <div className="text-[11px] opacity-70">
                Queries will appear here after execution
              </div>
            </div>
          ) : (
            <div className="p-2">
              {queryHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors",
                    "hover:bg-[hsl(var(--accent))]",
                    "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {item.error ? (
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--destructive))]" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--success))]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-[var(--font-mono)] text-[11px] leading-tight line-clamp-3">
                        {truncateQuery(item.query, 300)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTime(item.executedAt)}
                        </span>
                        {!item.error && item.rowCount !== undefined && (
                          <span>{item.rowCount} rows</span>
                        )}
                        {!item.error && item.executionTimeMs !== undefined && (
                          <span>{item.executionTimeMs}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
