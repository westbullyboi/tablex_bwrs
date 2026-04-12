import { useState } from "react";
import { Database, Keyboard, Settings, Unplug } from "lucide-react";
import { ConnectionDialog } from "../connection";
import { KeyboardShortcutsDialog } from "../KeyboardShortcutsDialog";
import { useConnectionStore } from "../../store/connectionStore";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function Header() {
  const {
    isConnected,
    connectionName,
    disconnect,
    shouldShowConnectionDialog,
    setShouldShowConnectionDialog,
  } = useConnectionStore();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <TooltipProvider>
      <header className="flex h-11 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShouldShowConnectionDialog(true)}
            className="gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            Connect
          </Button>

          {isConnected && connectionName && (
            <>
              <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[hsl(var(--accent))] px-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                <span className="text-[13px] font-medium">
                  {connectionName}
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={disconnect}
                    className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                  >
                    <Unplug className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disconnect</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsShortcutsOpen(true)}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <ConnectionDialog
        isOpen={shouldShowConnectionDialog}
        onClose={() => setShouldShowConnectionDialog(false)}
      />
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </TooltipProvider>
  );
}
