import { useState, useRef, useCallback } from "react";
import type { TableColumnInfo } from "../../types/query";

interface EditableCellProps {
  value: unknown;
  column: TableColumnInfo;
  isEditing: boolean;
  isModified: boolean;
  isDeleted: boolean;
  onStartEdit: () => void;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function EditableCell({
  value,
  column,
  isEditing,
  isModified,
  isDeleted,
  onStartEdit,
  onSave,
  onCancel,
  readOnly = false,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const beginEdit = useCallback(() => {
    setEditValue(formatValue(value));
    onStartEdit();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, onStartEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const parsedValue = parseValue(editValue, column.data_type);
        onSave(parsedValue);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [editValue, column.data_type, onSave, onCancel]
  );

  const handleBlur = useCallback(() => {
    const parsedValue = parseValue(editValue, column.data_type);
    onSave(parsedValue);
  }, [editValue, column.data_type, onSave]);

  const handleDoubleClick = useCallback(() => {
    if (!readOnly && !isDeleted) {
      beginEdit();
    }
  }, [readOnly, isDeleted, beginEdit]);

  // Render editing mode
  if (isEditing) {
    const dataType = column.data_type.toLowerCase();

    // Boolean: checkbox
    if (dataType === "boolean") {
      return (
        <div className="flex h-full items-center justify-center">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="checkbox"
            checked={editValue === "true"}
            onChange={(e) => {
              const newValue = e.target.checked;
              onSave(newValue);
            }}
            onKeyDown={handleKeyDown}
            className="h-4 w-4"
          />
        </div>
      );
    }

    // Date picker
    if (dataType === "date") {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-0 bg-[hsl(var(--primary))]/10 px-2 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:bg-[hsl(var(--primary))]/20"
        />
      );
    }

    // Datetime picker
    if (dataType.includes("timestamp") || dataType.includes("datetime")) {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="datetime-local"
          value={formatDateTimeLocal(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-0 bg-[hsl(var(--primary))]/10 px-2 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:bg-[hsl(var(--primary))]/20"
        />
      );
    }

    // Time picker
    if (dataType === "time") {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="time"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-0 bg-[hsl(var(--primary))]/10 px-2 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:bg-[hsl(var(--primary))]/20"
        />
      );
    }

    // Textarea for long text
    if (dataType === "text" || (value && String(value).length > 100)) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-full min-h-15 w-full resize-none border-0 bg-[hsl(var(--primary))]/10 px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:bg-[hsl(var(--primary))]/20"
          rows={3}
        />
      );
    }

    // Default: text input
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-full w-full border-0 bg-[hsl(var(--primary))]/10 px-2 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:bg-[hsl(var(--primary))]/20"
      />
    );
  }

  // Render display mode
  const displayValue = formatDisplayValue(value, column.data_type);
  const isNull = value === null;

  let cellClassName =
    "overflow-hidden text-ellipsis whitespace-nowrap cursor-default";
  if (isDeleted) {
    cellClassName +=
      " line-through bg-[hsl(var(--destructive))]/10 dark:bg-[hsl(var(--destructive))]/20";
  } else if (isModified) {
    cellClassName +=
      " bg-[hsl(var(--warning))]/10 dark:bg-[hsl(var(--warning))]/20";
  }
  if (!readOnly && !isDeleted) {
    cellClassName +=
      " cursor-pointer hover:bg-[hsl(var(--accent))] dark:hover:bg-[hsl(var(--accent))]";
  }

  // Boolean: show checkbox in display mode too
  if (column.data_type.toLowerCase() === "boolean" && !isNull) {
    return (
      <div
        className={`flex h-full items-center justify-center ${cellClassName}`}
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit"
      >
        <input
          type="checkbox"
          checked={value === true}
          readOnly
          className="h-4 w-4 pointer-events-none"
        />
      </div>
    );
  }

  return (
    <div
      className={cellClassName}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {isNull ? (
        <span className="italic text-[hsl(var(--muted-foreground))]">NULL</span>
      ) : (
        displayValue
      )}
    </div>
  );
}

// Helper functions
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function formatDisplayValue(value: unknown, _dataType: string): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  // Truncate long text
  const str = String(value);
  if (str.length > 200) {
    return str.substring(0, 200) + "...";
  }
  return str;
}

function formatDateTimeLocal(value: string): string {
  if (!value) return "";
  // Convert ISO format to datetime-local format
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().slice(0, 16);
  } catch {
    return value;
  }
}

function parseValue(value: string, dataType: string): unknown {
  // Handle NULL
  if (value.toLowerCase() === "null") {
    return null;
  }

  // Handle quoted NULL (literal 'NULL' string)
  if (value.startsWith("'") && value.endsWith("'") && value.length > 2) {
    return value.slice(1, -1);
  }

  // Handle empty string
  if (value === "") {
    return "";
  }

  const lowerType = dataType.toLowerCase();

  // Boolean
  if (lowerType === "boolean") {
    return value === "true";
  }

  // Integer types
  if (
    lowerType.includes("int") ||
    lowerType === "smallint" ||
    lowerType === "bigint"
  ) {
    const num = parseInt(value, 10);
    return isNaN(num) ? value : num;
  }

  // Float types
  if (
    lowerType.includes("float") ||
    lowerType.includes("double") ||
    lowerType === "numeric" ||
    lowerType === "decimal" ||
    lowerType === "real"
  ) {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }

  return value;
}
