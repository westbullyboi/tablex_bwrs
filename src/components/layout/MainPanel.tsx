import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Play, Download, X, FileSpreadsheet, History } from "lucide-react";
import { SqlEditor } from "../editor";
import { ResultGrid } from "../result";
import { ErDiagram } from "../er-diagram";
import { AiQueryBar, AiSettingsDialog, QueryHistory } from "../ai";
import { useQueryStore } from "../../store/queryStore";
import { useConnectionStore } from "../../store/connectionStore";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

export function MainPanel() {
  const [activeTab, setActiveTab] = useState<"query" | "er">("query");
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const {
    executeQuery,
    query,
    isExecuting,
    result,
    isCrudMode,
    currentSchema,
    currentTable,
    exitCrudMode,
    queryHistory,
  } = useQueryStore();
  const { isConnected } = useConnectionStore();

  const handleExportCsv = async () => {
    if (!result) return;

    try {
      setIsExporting(true);
      const filePath = await save({
        defaultPath: "query_result.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        await invoke("export_csv", {
          data: {
            columns: result.columns.map((c) => c.name),
            rows: result.rows,
          },
          filePath,
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* AI Query Bar */}
        <div className="relative">
          <AiQueryBar onSettingsClick={() => setIsAiSettingsOpen(true)} />

          {/* History toggle button */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] transition-colors",
              isHistoryOpen
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
            )}
            aria-label="Toggle query history"
          >
            <History className="h-3.5 w-3.5" />
            {queryHistory.length > 0 && (
              <span className="min-w-[1.25rem] rounded-full bg-[hsl(var(--muted))] px-1 text-center text-[10px] font-medium">
                {queryHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Tabs and Run Button */}
        <div className="flex items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2">
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium transition-colors rounded-t-[var(--radius-sm)]",
                activeTab === "query"
                  ? "border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--accent))]/50"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/30"
              )}
              onClick={() => setActiveTab("query")}
            >
              Query
            </button>
            <button
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium transition-colors rounded-t-[var(--radius-sm)]",
                activeTab === "er"
                  ? "border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--accent))]/50"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/30"
              )}
              onClick={() => setActiveTab("er")}
            >
              ER Diagram
            </button>
          </div>

          {/* CRUD mode indicator */}
          {isCrudMode && currentTable && (
            <div className="ml-4 flex items-center gap-3 border-l border-[hsl(var(--border))] pl-4">
              <span className="font-[var(--font-mono)] text-[13px] text-[hsl(var(--muted-foreground))]">
                {currentSchema}.{currentTable}
              </span>
              <button
                onClick={exitCrudMode}
                className="rounded-[var(--radius-sm)] p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Exit table view"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex-1" />

          {/* Query buttons */}
          <div className="flex items-center gap-2 pr-2">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!result || isExporting}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="success"
                  size="icon-sm"
                  onClick={executeQuery}
                  disabled={!isConnected || !query.trim() || isExecuting}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Query</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeTab === "query" ? <QueryPanel /> : <ErDiagramPanel />}
          </div>

          {/* History overlay panel */}
          {isHistoryOpen && (
            <div className="absolute right-0 top-0 z-10 h-full w-[320px] border-l border-[hsl(var(--border))] shadow-lg">
              <QueryHistory onClose={() => setIsHistoryOpen(false)} />
            </div>
          )}
        </div>

        {/* AI Settings Dialog */}
        <AiSettingsDialog
          isOpen={isAiSettingsOpen}
          onClose={() => setIsAiSettingsOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}

function QueryPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      const minHeight = 100;
      const maxHeight = containerRect.height - 100;

      setEditorHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
      {/* SQL Editor */}
      <div style={{ height: editorHeight }} className="min-h-[100px]">
        <SqlEditor />
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "h-1 cursor-row-resize bg-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--primary))]",
          isDragging && "bg-[hsl(var(--primary))]"
        )}
      />

      {/* Results */}
      <div className="flex-1 overflow-hidden bg-[hsl(var(--background))]">
        <ResultGrid />
      </div>
    </div>
  );
}

function ErDiagramPanel() {
  return (
    <div className="flex-1 overflow-hidden bg-[hsl(var(--background))]">
      <ErDiagram />
    </div>
  );
}
