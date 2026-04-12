import { useState, useMemo } from "react";
import type { TableColumnInfo } from "../../types/query";

interface InsertRowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columns: TableColumnInfo[];
  onInsert: (values: Record<string, unknown>) => void;
}

export function InsertRowDialog({
  isOpen,
  onClose,
  columns,
  onInsert,
}: InsertRowDialogProps) {
  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {};
    columns.forEach((col) => {
      if (!col.is_auto_generated) {
        initial[col.name] = "";
      }
    });
    return initial;
  }, [columns]);

  const [values, setValues] = useState(initialValues);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedValues: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.is_auto_generated) continue;

      const strValue = values[col.name] || "";

      // Handle NULL
      if (strValue.toLowerCase() === "null") {
        parsedValues[col.name] = null;
        continue;
      }

      // Handle empty - use default if available
      if (strValue === "") {
        if (col.default_value) {
          continue; // Let database use default
        }
        if (col.is_nullable) {
          parsedValues[col.name] = null;
          continue;
        }
      }

      // Parse based on type
      const lowerType = col.data_type.toLowerCase();
      if (lowerType === "boolean") {
        parsedValues[col.name] = strValue === "true";
      } else if (
        lowerType.includes("int") ||
        lowerType === "smallint" ||
        lowerType === "bigint"
      ) {
        const num = parseInt(strValue, 10);
        parsedValues[col.name] = isNaN(num) ? strValue : num;
      } else if (
        lowerType.includes("float") ||
        lowerType.includes("double") ||
        lowerType === "numeric" ||
        lowerType === "decimal" ||
        lowerType === "real"
      ) {
        const num = parseFloat(strValue);
        parsedValues[col.name] = isNaN(num) ? strValue : num;
      } else {
        parsedValues[col.name] = strValue;
      }
    }

    onInsert(parsedValues);
  };

  const editableColumns = columns.filter((col) => !col.is_auto_generated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-[500px] overflow-hidden rounded-lg bg-[hsl(var(--background))] shadow-xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
          <h2 className="text-lg font-semibold">Add New Row</h2>
          <button
            onClick={onClose}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            <div className="space-y-4">
              {editableColumns.map((col) => (
                <div key={col.name}>
                  <label
                    htmlFor={`insert-${col.name}`}
                    className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    {col.name}
                    <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">
                      {col.data_type}
                      {!col.is_nullable && !col.default_value && (
                        <span className="ml-1 text-[hsl(var(--destructive))]">
                          *
                        </span>
                      )}
                      {col.default_value && (
                        <span className="ml-1">
                          (default: {col.default_value})
                        </span>
                      )}
                    </span>
                  </label>
                  {renderInput(col, values[col.name] || "", (val) =>
                    setValues((prev) => ({ ...prev, [col.name]: val }))
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[hsl(var(--border))] px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              Add Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function renderInput(
  column: TableColumnInfo,
  value: string,
  onChange: (val: string) => void
) {
  const dataType = column.data_type.toLowerCase();

  const inputId = `insert-${column.name}`;

  // Boolean
  if (dataType === "boolean") {
    return (
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      >
        <option value="">-- Select --</option>
        <option value="true">true</option>
        <option value="false">false</option>
        <option value="null">NULL</option>
      </select>
    );
  }

  // Date
  if (dataType === "date") {
    return (
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      />
    );
  }

  // Timestamp
  if (dataType.includes("timestamp")) {
    return (
      <input
        id={inputId}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      />
    );
  }

  // Time
  if (dataType === "time") {
    return (
      <input
        id={inputId}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      />
    );
  }

  // Text (multiline)
  if (dataType === "text") {
    return (
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        placeholder={column.is_nullable ? "NULL for null" : ""}
      />
    );
  }

  // Number types
  if (
    dataType.includes("int") ||
    dataType.includes("float") ||
    dataType.includes("double") ||
    dataType === "numeric" ||
    dataType === "decimal" ||
    dataType === "real"
  ) {
    return (
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        placeholder={column.is_nullable ? "NULL for null" : ""}
      />
    );
  }

  // Default text input
  return (
    <input
      id={inputId}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      placeholder={column.is_nullable ? "NULL for null" : ""}
    />
  );
}
