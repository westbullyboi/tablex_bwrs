import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Search,
  CornerDownLeft,
  Sun,
  Moon,
  Monitor,
  Rows2,
  PanelLeft,
  Database,
  Unplug,
  Plug,
  Play,
  Table as TableIcon,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useSchemaStore } from "../../store/schemaStore";
import { useQueryStore } from "../../store/queryStore";
import { cn } from "../../lib/utils";

interface Command {
  id: string;
  group: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const cycleTheme = useUiStore((s) => s.cycleTheme);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleDensity = useUiStore((s) => s.toggleDensity);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setKeyboardShortcutsOpen = useUiStore(
    (s) => s.setKeyboardShortcutsOpen
  );

  const isConnected = useConnectionStore((s) => s.isConnected);
  const savedConnections = useConnectionStore((s) => s.savedConnections);
  const connectToSaved = useConnectionStore((s) => s.connectToSaved);
  const disconnect = useConnectionStore((s) => s.disconnect);
  const setShouldShowConnectionDialog = useConnectionStore(
    (s) => s.setShouldShowConnectionDialog
  );

  const schemas = useSchemaStore((s) => s.schemas);
  const executeQuery = useQueryStore((s) => s.executeQuery);
  const loadTableData = useQueryStore((s) => s.loadTableData);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const run = (fn: () => void) => () => {
      fn();
      setOpen(false);
    };

    const list: Command[] = [
      {
        id: "conn-open",
        group: "Connection",
        label: "Open connection manager",
        icon: Database,
        keywords: "connect database new",
        run: run(() => setShouldShowConnectionDialog(true)),
      },
    ];

    if (isConnected) {
      list.push({
        id: "conn-disconnect",
        group: "Connection",
        label: "Disconnect",
        icon: Unplug,
        run: run(() => void disconnect()),
      });
    }

    for (const c of savedConnections) {
      list.push({
        id: `conn-${c.id}`,
        group: "Connection",
        label: `Connect to ${c.name}`,
        icon: Plug,
        keywords: `${c.host} ${c.database} ${c.username}`,
        run: run(() => void connectToSaved(c)),
      });
    }

    list.push({
      id: "query-run",
      group: "Query",
      label: "Run query",
      icon: Play,
      keywords: "execute sql",
      run: run(() => void executeQuery()),
    });

    for (const schema of schemas) {
      for (const t of schema.tables) {
        list.push({
          id: `table-${schema.name}-${t.name}`,
          group: "Open table",
          label: `${schema.name}.${t.name}`,
          icon: TableIcon,
          keywords: "table data crud open",
          run: run(() => void loadTableData(schema.name, t.name)),
        });
      }
    }

    list.push(
      {
        id: "view-theme-cycle",
        group: "View",
        label: "Toggle theme (light / dark / system)",
        icon: Sun,
        keywords: "dark light appearance color",
        run: run(cycleTheme),
      },
      {
        id: "view-theme-light",
        group: "View",
        label: "Theme: Light",
        icon: Sun,
        run: run(() => setTheme("light")),
      },
      {
        id: "view-theme-dark",
        group: "View",
        label: "Theme: Dark",
        icon: Moon,
        run: run(() => setTheme("dark")),
      },
      {
        id: "view-theme-system",
        group: "View",
        label: "Theme: System",
        icon: Monitor,
        run: run(() => setTheme("system")),
      },
      {
        id: "view-density",
        group: "View",
        label: "Toggle density (comfortable / compact)",
        icon: Rows2,
        keywords: "spacing compact",
        run: run(toggleDensity),
      },
      {
        id: "view-sidebar",
        group: "View",
        label: "Toggle sidebar",
        icon: PanelLeft,
        run: run(toggleSidebar),
      },
      {
        id: "help-shortcuts",
        group: "Help",
        label: "Keyboard shortcuts",
        icon: Keyboard,
        run: run(() => setKeyboardShortcutsOpen(true)),
      }
    );

    return list;
  }, [
    isConnected,
    savedConnections,
    schemas,
    setOpen,
    setShouldShowConnectionDialog,
    disconnect,
    connectToSaved,
    executeQuery,
    loadTableData,
    cycleTheme,
    setTheme,
    toggleDensity,
    toggleSidebar,
    setKeyboardShortcutsOpen,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Derive a safe active index during render so a shrinking result set never
  // points past the end (avoids calling setState inside an effect).
  const safeActiveIndex = filtered.length
    ? Math.min(activeIndex, filtered.length - 1)
    : 0;

  // Reset transient state when the palette opens; delegate visibility upward.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
    setOpen(next);
  };

  // Keep the active item scrolled into view.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${safeActiveIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filtered.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((safeActiveIndex + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((safeActiveIndex - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[safeActiveIndex]?.run();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[hsl(var(--overlay))] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          aria-label="Command palette"
          className="fixed left-1/2 top-[18%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] shadow-[var(--shadow-lg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-3">
            <Search className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
                No results
              </div>
            ) : (
              filtered.map((cmd, index) => {
                const showGroup =
                  index === 0 || filtered[index - 1].group !== cmd.group;
                const Icon = cmd.icon;
                return (
                  <div key={cmd.id}>
                    {showGroup && (
                      <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        {cmd.group}
                      </div>
                    )}
                    <button
                      type="button"
                      data-index={index}
                      onClick={() => cmd.run()}
                      onMouseMove={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[13px] transition-colors",
                        index === safeActiveIndex
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                          : "text-[hsl(var(--foreground))]"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {index === safeActiveIndex && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
