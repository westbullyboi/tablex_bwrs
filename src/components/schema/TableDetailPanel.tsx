import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TableDetailInfo } from "../../types/schema";

interface TableDetailPanelProps {
  schemaName: string;
  tableName: string;
  onClose: () => void;
}

export function TableDetailPanel({
  schemaName,
  tableName,
  onClose,
}: TableDetailPanelProps) {
  const [detail, setDetail] = useState<TableDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "columns" | "indexes" | "constraints" | "fk"
  >("columns");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await invoke<TableDetailInfo>("get_table_detail", {
          schemaName,
          tableName,
        });
        if (!cancelled) setDetail(result);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [schemaName, tableName]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Loading table details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <span className="font-medium">{detail.schema}</span>
          <span className="text-gray-400">.</span>
          <span className="font-semibold">{detail.name}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {(["columns", "indexes", "constraints", "fk"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab === "columns" && `Columns (${detail.columns.length})`}
            {tab === "indexes" && `Indexes (${detail.indexes.length})`}
            {tab === "constraints" &&
              `Constraints (${detail.constraints.length})`}
            {tab === "fk" && `Foreign Keys (${detail.foreign_keys.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "columns" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Nullable</th>
                <th className="px-3 py-2 text-left font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {detail.columns.map((col) => (
                <tr
                  key={col.name}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {col.is_primary_key && (
                        <KeyIcon className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className={col.is_primary_key ? "font-medium" : ""}>
                        {col.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {col.data_type}
                  </td>
                  <td className="px-3 py-2">
                    {col.is_nullable ? (
                      <span className="text-gray-400">YES</span>
                    ) : (
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        NO
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {col.default_value || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "indexes" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Columns</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {detail.indexes.map((idx) => (
                <tr
                  key={idx.name}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 font-medium">{idx.name}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {idx.columns.join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    {idx.is_primary && (
                      <span className="mr-1 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        PRIMARY
                      </span>
                    )}
                    {idx.is_unique && !idx.is_primary && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        UNIQUE
                      </span>
                    )}
                    {!idx.is_unique && !idx.is_primary && (
                      <span className="text-gray-500">INDEX</span>
                    )}
                  </td>
                </tr>
              ))}
              {detail.indexes.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    No indexes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === "constraints" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Columns</th>
                <th className="px-3 py-2 text-left font-medium">Definition</th>
              </tr>
            </thead>
            <tbody>
              {detail.constraints.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        c.constraint_type === "PRIMARY KEY"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : c.constraint_type === "FOREIGN KEY"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : c.constraint_type === "UNIQUE"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : c.constraint_type === "CHECK"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {c.constraint_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {c.columns.join(", ")}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-gray-500">
                    {c.definition || "-"}
                  </td>
                </tr>
              ))}
              {detail.constraints.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    No constraints
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === "fk" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Column</th>
                <th className="px-3 py-2 text-left font-medium">References</th>
              </tr>
            </thead>
            <tbody>
              {detail.foreign_keys.map((fk) => (
                <tr
                  key={fk.constraint_name}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 font-medium">
                    {fk.constraint_name}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {fk.source_column}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {fk.target_table}.{fk.target_column}
                  </td>
                </tr>
              ))}
              {detail.foreign_keys.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    No foreign keys
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
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
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}
