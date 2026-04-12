import { useEffect } from "react";
import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header, StatusBar, ResizableLayout } from "./components/layout";
import { useAiStore } from "./store/aiStore";
import { useConnectionStore } from "./store/connectionStore";
import { useQueryStore } from "./store/queryStore";

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

  // Apply dark mode based on system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Apply initial theme
    applyTheme(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

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
