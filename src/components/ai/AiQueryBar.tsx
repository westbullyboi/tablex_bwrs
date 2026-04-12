import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import { useAiStore } from "../../store/aiStore";
import { useQueryStore } from "../../store/queryStore";
import { useConnectionStore } from "../../store/connectionStore";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

interface AiQueryBarProps {
  onSettingsClick: () => void;
}

export function AiQueryBar({ onSettingsClick }: AiQueryBarProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { generateSql, isGenerating, error, settings } = useAiStore();
  const { setQuery } = useQueryStore();
  const { isConnected } = useConnectionStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || !isConnected) return;

    const sql = await generateSql(prompt);
    if (sql) {
      setQuery(sql);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to generate
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120); // max 120px (~5 lines)
      textarea.style.height = `${Math.max(36, newHeight)}px`;
    }
  }, [prompt]);

  const isConfigured =
    settings.provider === "Claude"
      ? !!settings.claudeApiKey
      : !!settings.ollamaBaseUrl;

  const canGenerate =
    isConnected && isConfigured && prompt.trim() && !isGenerating;

  return (
    <TooltipProvider>
      <div className="bg-[hsl(var(--muted))] px-3 py-2 h-full">
        <div className="flex gap-3">
          {/* Settings button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSettingsClick}
                className="shrink-0 mt-0.5"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              AI Settings ({settings.provider})
            </TooltipContent>
          </Tooltip>

          {/* Textarea with inline generate button */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !isConnected
                  ? "Connect to a database first..."
                  : !isConfigured
                    ? "Configure AI settings first..."
                    : "Describe your query in natural language... (⌘+Enter to generate)"
              }
              disabled={!isConnected || isGenerating}
              rows={1}
              className={cn(
                "w-full resize-none rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 pr-10 text-[13px] leading-relaxed",
                "placeholder:text-[hsl(var(--muted-foreground))]",
                "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />

            {/* Generate button inside textarea */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={canGenerate ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    canGenerate &&
                      "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  )}
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Generate SQL</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-2 rounded-[var(--radius)] bg-[hsl(var(--destructive))]/10 p-2 text-xs text-[hsl(var(--destructive))]"
          >
            {error}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
