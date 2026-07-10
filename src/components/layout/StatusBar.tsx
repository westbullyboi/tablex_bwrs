import { Sun, Moon, Monitor, PanelLeft, Rows2, Rows3 } from "lucide-react";
import { useConnectionStore } from "../../store/connectionStore";
import { useUiStore, type ThemeMode } from "../../store/uiStore";
import { cn } from "../../lib/utils";

const THEME_META: Record<
  ThemeMode,
  { Icon: typeof Sun; label: string; next: string }
> = {
  light: { Icon: Sun, label: "Light", next: "Dark" },
  dark: { Icon: Moon, label: "Dark", next: "System" },
  system: { Icon: Monitor, label: "System", next: "Light" },
};

function StatusButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
    >
      {children}
    </button>
  );
}

export function StatusBar() {
  const { isConnected, connectionName } = useConnectionStore();
  const theme = useUiStore((state) => state.theme);
  const density = useUiStore((state) => state.density);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const cycleTheme = useUiStore((state) => state.cycleTheme);
  const toggleDensity = useUiStore((state) => state.toggleDensity);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  const themeMeta = THEME_META[theme];
  const ThemeIcon = themeMeta.Icon;
  const DensityIcon = density === "compact" ? Rows2 : Rows3;

  return (
    <footer className="flex h-6 items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-[11px]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all",
            isConnected
              ? "bg-[hsl(var(--success))] shadow-[0_0_4px_hsl(var(--success)/0.5)]"
              : "bg-[hsl(var(--muted-foreground))]"
          )}
        />
        <span className="text-[hsl(var(--muted-foreground))]">
          {isConnected ? `Connected to ${connectionName}` : "Not connected"}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <StatusButton
          onClick={toggleSidebar}
          label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </StatusButton>
        <StatusButton
          onClick={toggleDensity}
          label={`Density: ${density === "compact" ? "Compact" : "Comfortable"}`}
        >
          <DensityIcon className="h-3.5 w-3.5" />
        </StatusButton>
        <StatusButton
          onClick={cycleTheme}
          label={`Theme: ${themeMeta.label} (click for ${themeMeta.next})`}
        >
          <ThemeIcon className="h-3.5 w-3.5" />
          <span className="text-[10px]">{themeMeta.label}</span>
        </StatusButton>
        <span className="ml-1 text-[hsl(var(--muted-foreground))]">v0.1.0</span>
      </div>
    </footer>
  );
}
