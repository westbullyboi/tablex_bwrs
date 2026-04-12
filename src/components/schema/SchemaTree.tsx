import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  Folder,
  Table2,
  Columns3,
  Key,
  Search,
} from "lucide-react";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import { cn } from "../../lib/utils";
import type { SchemaInfo, TableInfo, ColumnInfo } from "../../types/schema";
import { Skeleton } from "../ui/skeleton";

interface SchemaTreeProps {
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

export function SchemaTree({ onTableSelect }: SchemaTreeProps) {
  const { schemas, isLoading, error, fetchSchemas, clearSchemas } =
    useSchemaStore();
  const { isConnected } = useConnectionStore();

  const [filter, setFilter] = useState("");

  const filteredSchemas = useMemo(() => {
    if (!filter.trim()) return schemas;
    const lowerFilter = filter.toLowerCase();
    return schemas
      .map((s) => ({
        ...s,
        tables: s.tables.filter((t) =>
          t.name.toLowerCase().includes(lowerFilter)
        ),
      }))
      .filter((s) => s.tables.length > 0);
  }, [schemas, filter]);

  useEffect(() => {
    if (isConnected) {
      fetchSchemas();
    } else {
      clearSchemas();
    }
  }, [isConnected, fetchSchemas, clearSchemas]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-[hsl(var(--muted-foreground))]">
        <Table2 className="h-8 w-8 opacity-30" />
        <div className="text-[13px]">Connect to a database to view schema</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-2 space-y-1" role="status" aria-label="Loading schemas">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1">
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
        <span className="sr-only">Loading schemas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[13px] text-[hsl(var(--destructive))]">
        {error}
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-[hsl(var(--muted-foreground))]">
        <Search className="h-8 w-8 opacity-30" />
        <div className="text-[13px]">No schemas found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {schemas.length > 0 && (
        <div className="px-2 pt-2 pb-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tables..."
              className="w-full rounded-[var(--radius-sm)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-1 pl-7 pr-2 text-[12px] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto p-2">
        {filteredSchemas.map((schema) => (
          <SchemaNode
            key={schema.name}
            schema={schema}
            onTableSelect={onTableSelect}
          />
        ))}
        {filter && filteredSchemas.length === 0 && (
          <div className="p-3 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
            No tables matching "{filter}"
          </div>
        )}
      </div>
    </div>
  );
}

interface SchemaNodeProps {
  schema: SchemaInfo;
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

function SchemaNode({ schema, onTableSelect }: SchemaNodeProps) {
  const [isExpanded, setIsExpanded] = useState(schema.name === "public");

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-left text-[13px] hover:bg-[hsl(var(--accent))] transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <Folder className="h-4 w-4 text-[hsl(var(--tree-icon-schema))]" />
        <span className="font-medium">{schema.name}</span>
        <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))]">
          {schema.tables.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
          {schema.tables.map((table) => (
            <TableNode
              key={`${schema.name}.${table.name}`}
              table={table}
              onTableSelect={onTableSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TableNodeProps {
  table: TableInfo;
  onTableSelect?: (schemaName: string, tableName: string) => void;
}

function TableNode({ table, onTableSelect }: TableNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { focusedTable, setFocusedTable } = useSchemaStore();

  const isFocused =
    focusedTable?.schema === table.schema && focusedTable?.table === table.name;

  const handleClick = () => {
    setFocusedTable(table.schema, table.name);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDoubleClick = () => {
    onTableSelect?.(table.schema, table.name);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-left text-[13px] transition-colors",
          isFocused
            ? "bg-[hsl(var(--table-row-selected))] ring-1 ring-[hsl(var(--primary))]/30"
            : "hover:bg-[hsl(var(--accent))]"
        )}
        title="Click to focus in ER diagram. Double-click to open table."
      >
        <button
          onClick={handleExpandClick}
          className="inline-flex items-center bg-transparent border-none p-0 cursor-pointer"
          aria-label={isExpanded ? "Collapse columns" : "Expand columns"}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </button>
        <Table2 className="h-4 w-4 text-[hsl(var(--tree-icon-table))]" />
        <span>{table.name}</span>
        <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))]">
          {table.columns.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
          {table.columns.map((column) => (
            <ColumnNode
              key={`${table.schema}.${table.name}.${column.name}`}
              column={column}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnNode({ column }: { column: ColumnInfo }) {
  return (
    <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
      {column.is_primary_key ? (
        <Key className="h-3.5 w-3.5 text-[hsl(var(--tree-icon-key))]" />
      ) : (
        <Columns3 className="h-3.5 w-3.5 text-[hsl(var(--tree-icon-column))]" />
      )}
      <span
        className={cn(
          "font-[var(--font-mono)]",
          column.is_primary_key && "font-medium"
        )}
      >
        {column.name}
      </span>
      <span className="ml-auto text-[10px] font-[var(--font-mono)] opacity-60">
        {column.data_type}
      </span>
    </div>
  );
}
