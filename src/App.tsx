import { useEffect } from "react";
import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header, StatusBar, ResizableLayout } from "./components/layout";
import { useAiStore } from "./store/aiStore";
import { useConnectionStore } from "./store/connectionStore";
import { useQueryStore } from "./store/queryStore";
import { useUiStore, resolveIsDark } from "./store/uiStore";

function App() {
  const loadSettings = useAiStore((state) => state.loadSettings);
  const loadHistory = useQueryStore((state) => state.loadHistory);
  const checkConnectionStatus = useConnectionStore(
    (state) => state.checkConnectionStatus
  );
  const getDefaultConnection = useConnectionStore(
    (state) => state.getDefaultConnection
  );
  const connectToSaved = useConnectionStore((state) => state.connectToSaved);
  const isConnected = useConnectionStore((state) => state.isConnected);
  const theme = useUiStore((state) => state.theme);
  const density = useUiStore((state) => state.density);

  // Apply the resolved theme (light/dark/system) to the document root.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => root.classList.toggle("dark", resolveIsDark(theme));
    apply();

    // Only react to OS changes while following the system preference.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") apply();
    };
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // Apply the density preference via the data-density attribute (drives tokens).
  useEffect(() => {
    const root = document.documentElement;
    if (density === "compact") {
      root.setAttribute("data-density", "compact");
    } else {
      root.removeAttribute("data-density");
    }
  }, [density]);

  useEffect(() => {
    loadSettings();
    loadHistory();
    checkConnectionStatus();
  }, [loadSettings, loadHistory, checkConnectionStatus]);

  // Auto-connect to default connection on startup
  useEffect(() => {
    const autoConnect = async () => {
      // Only auto-connect if not already connected
      if (isConnected) return;

      const defaultConnection = await getDefaultConnection();
      if (defaultConnection) {
        try {
          await connectToSaved(defaultConnection);
        } catch (error) {
          console.error("Failed to auto-connect:", error);
        }
      }
    };

    autoConnect();
  }, [isConnected, getDefaultConnection, connectToSaved]);

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-[hsl(var(--background))] focus:px-4 focus:py-2 focus:text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--ring))]"
        >
          Skip to main content
        </a>
        <h1 className="sr-only">tablex - Database IDE</h1>
        <Header />
        <ErrorBoundary>
          <div id="main-content">
            <ResizableLayout />
          </div>
        </ErrorBoundary>
        <StatusBar />
      </div>
    </ErrorBoundary>
  );
}

export default App;
