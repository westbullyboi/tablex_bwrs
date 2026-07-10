import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MainPanel } from "./MainPanel";
import {
  useUiStore,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "../../store/uiStore";

export function ResizableLayout() {
  const sidebarWidth = useUiStore((state) => state.sidebarWidth);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebarWidth = useUiStore((state) => state.setSidebarWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = Math.min(
        Math.max(e.clientX, SIDEBAR_MIN_WIDTH),
        SIDEBAR_MAX_WIDTH
      );
      setSidebarWidth(newWidth);
    },
    [isDragging, setSidebarWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
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
    <div className="flex flex-1 overflow-hidden">
      {!sidebarCollapsed && (
        <>
          <Sidebar width={sidebarWidth} />
          <div
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            className={`w-1 cursor-col-resize bg-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--primary))] ${
              isDragging ? "bg-[hsl(var(--primary))]" : ""
            }`}
          />
        </>
      )}
      <MainPanel />
    </div>
  );
}
