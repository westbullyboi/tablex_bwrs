import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 240;

interface UiState {
  /** Explicit theme preference. "system" follows the OS setting. */
  theme: ThemeMode;
  /** UI density; drives the design tokens via the data-density attribute. */
  density: Density;
  /** Persisted sidebar width in px. */
  sidebarWidth: number;
  /** Whether the sidebar is collapsed (hidden). */
  sidebarCollapsed: boolean;

  setTheme: (theme: ThemeMode) => void;
  /** Cycle light → dark → system → light. */
  cycleTheme: () => void;
  setDensity: (density: Density) => void;
  toggleDensity: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
}

const THEME_ORDER: ThemeMode[] = ["light", "dark", "system"];

const clampSidebarWidth = (width: number) =>
  Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "system",
      density: "comfortable",
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const current = THEME_ORDER.indexOf(get().theme);
        set({ theme: THEME_ORDER[(current + 1) % THEME_ORDER.length] });
      },
      setDensity: (density) => set({ density }),
      toggleDensity: () =>
        set({
          density: get().density === "comfortable" ? "compact" : "comfortable",
        }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: clampSidebarWidth(width) }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: "tablex-ui",
      // Only persist user preferences, not derived/action fields.
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

/** Resolve a theme preference to whether dark mode should be active. */
export function resolveIsDark(theme: ThemeMode): boolean {
  if (theme === "system") {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  return theme === "dark";
}
