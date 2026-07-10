import { useState, useCallback, useEffect } from "react";

interface ResizeState {
  index: number;
  startX: number;
  startWidth: number;
}

interface UseColumnResizeOptions {
  initialWidths?: number[];
  defaultWidth?: number;
  minWidth?: number;
}

interface UseColumnResizeResult {
  columnWidths: number[];
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>;
  handleResizeStart: (e: React.MouseEvent, index: number) => void;
  isResizing: boolean;
}

export function useColumnResize(
  columnCount: number,
  options: UseColumnResizeOptions = {}
): UseColumnResizeResult {
  const { defaultWidth = 150, minWidth = 50 } = options;

  const [columnWidths, setColumnWidths] = useState<number[]>(() =>
    Array(columnCount).fill(defaultWidth)
  );
  const [resizing, setResizing] = useState<ResizeState | null>(null);

  // Adjust widths when the column count changes. Done during render by
  // tracking the previous count in state (React's recommended pattern),
  // rather than in an effect, so the widths array stays consistent with
  // columnCount without an extra render pass.
  const [prevColumnCount, setPrevColumnCount] = useState(columnCount);
  if (prevColumnCount !== columnCount) {
    setPrevColumnCount(columnCount);
    setColumnWidths((prev) => {
      if (prev.length === columnCount) return prev;
      if (columnCount > prev.length) {
        return [
          ...prev,
          ...Array(columnCount - prev.length).fill(defaultWidth),
        ];
      }
      return prev.slice(0, columnCount);
    });
  }

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing({
        index,
        startX: e.clientX,
        startWidth: columnWidths[index] || defaultWidth,
      });
    },
    [columnWidths, defaultWidth]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(minWidth, resizing.startWidth + diff);

      setColumnWidths((prev) => {
        const next = [...prev];
        next[resizing.index] = newWidth;
        return next;
      });
    },
    [resizing, minWidth]
  );

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing, handleResizeMove, handleResizeEnd]);

  return {
    columnWidths,
    setColumnWidths,
    handleResizeStart,
    isResizing: resizing !== null,
  };
}
