import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionMode,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { invoke } from "@tauri-apps/api/core";
import { TableNode, type TableNodeData } from "./TableNode";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import type { ForeignKeyInfo, TableInfo } from "../../types/schema";

const nodeTypes = {
  tableNode: TableNode,
};

type TableNodeType = Node<TableNodeData>;

// Calculate node dimensions based on columns
function getNodeDimensions(table: TableInfo) {
  const NODE_WIDTH = 220;
  const NODE_HEIGHT_PER_COL = 28;
  const HEADER_HEIGHT = 40;
  return {
    width: NODE_WIDTH,
    height: HEADER_HEIGHT + table.columns.length * NODE_HEIGHT_PER_COL,
  };
}

function applyDagreLayout(
  tables: TableInfo[],
  foreignKeys: ForeignKeyInfo[],
  focusedTableName: string | null,
  handleFocusTable: (tableName: string) => void,
  edgeColor: string
): { nodes: TableNodeType[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Use TB so dagre arranges same-rank nodes horizontally
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });

  tables.forEach((table) => {
    const { width, height } = getNodeDimensions(table);
    g.setNode(table.name, { width, height });
  });

  foreignKeys.forEach((fk) => {
    if (
      tables.some((t) => t.name === fk.source_table) &&
      tables.some((t) => t.name === fk.target_table)
    ) {
      g.setEdge(fk.source_table, fk.target_table);
    }
  });

  Dagre.layout(g);

  // Swap x/y from TB layout to produce horizontal flow
  // TB: ranks go top→bottom, peers go left→right
  // After swap: ranks go left→right, peers go top→bottom
  const nodes: TableNodeType[] = tables.map((table) => {
    const dagreNode = g.node(table.name);
    const { width, height } = getNodeDimensions(table);

    return {
      id: table.name,
      type: "tableNode",
      position: {
        x: dagreNode.y - height / 2,
        y: dagreNode.x - width / 2,
      },
      data: {
        label: table.name,
        columns: table.columns,
        isFocused: table.name === focusedTableName,
        onFocus: handleFocusTable,
      },
    };
  });

  const edges: Edge[] = foreignKeys
    .filter(
      (fk) =>
        tables.some((t) => t.name === fk.source_table) &&
        tables.some((t) => t.name === fk.target_table)
    )
    .map((fk) => ({
      id: fk.constraint_name,
      source: fk.source_table,
      target: fk.target_table,
      sourceHandle: `${fk.source_column}-source`,
      targetHandle: `${fk.target_column}-target`,
      type: "smoothstep",
      animated: true,
      style: { stroke: edgeColor, strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
    }));

  return { nodes, edges };
}

export function ErDiagram() {
  const { schemas, focusedTable, setFocusedTable, clearFocusedTable } =
    useSchemaStore();
  const { isConnected } = useConnectionStore();
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyInfo[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("public");

  const root = document.documentElement;
  const getVar = (name: string) =>
    getComputedStyle(root).getPropertyValue(name).trim();
  const edgeColor = `hsl(${getVar("--er-edge")})`;
  const bgColor = `hsl(${getVar("--er-bg-dot")})`;

  // Fetch foreign keys when schema changes
  useEffect(() => {
    if (isConnected && selectedSchema) {
      invoke<ForeignKeyInfo[]>("get_foreign_keys", {
        schemaName: selectedSchema,
      })
        .then(setForeignKeys)
        .catch(console.error);
    }
  }, [isConnected, selectedSchema]);

  // Get tables for selected schema
  const tables = useMemo(() => {
    const schema = schemas.find((s) => s.name === selectedSchema);
    return schema?.tables || [];
  }, [schemas, selectedSchema]);

  // Get focused table name for current schema
  const focusedTableName = useMemo(() => {
    if (!focusedTable || focusedTable.schema !== selectedSchema) return null;
    return focusedTable.table;
  }, [focusedTable, selectedSchema]);

  // Get related tables for focused table
  const relatedTables = useMemo(() => {
    if (!focusedTableName) return null;

    const related = new Set<string>();
    related.add(focusedTableName);

    foreignKeys.forEach((fk) => {
      if (fk.source_table === focusedTableName) {
        related.add(fk.target_table);
      }
      if (fk.target_table === focusedTableName) {
        related.add(fk.source_table);
      }
    });

    return related;
  }, [focusedTableName, foreignKeys]);

  // Handle table focus from ER diagram click
  const handleFocusTable = useCallback(
    (tableName: string) => {
      setFocusedTable(selectedSchema, tableName);
    },
    [selectedSchema, setFocusedTable]
  );

  // Generate nodes and edges from tables and foreign keys using dagre layout
  useEffect(() => {
    if (tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Filter tables if focused
    const filteredTables = relatedTables
      ? tables.filter((t) => relatedTables.has(t.name))
      : tables;

    // Filter edges if focused
    const filteredForeignKeys = relatedTables
      ? foreignKeys.filter(
          (fk) =>
            relatedTables.has(fk.source_table) &&
            relatedTables.has(fk.target_table)
        )
      : foreignKeys;

    // Apply dagre layout
    const { nodes: newNodes, edges: newEdges } = applyDagreLayout(
      filteredTables,
      filteredForeignKeys,
      focusedTableName,
      handleFocusTable,
      edgeColor
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    tables,
    foreignKeys,
    setNodes,
    setEdges,
    relatedTables,
    focusedTableName,
    handleFocusTable,
    edgeColor,
  ]);

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Connect to a database to view ER diagram
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading schemas...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2">
        <label className="text-sm font-medium text-[hsl(var(--foreground))]">
          Schema:
        </label>
        <select
          value={selectedSchema}
          onChange={(e) => {
            setSelectedSchema(e.target.value);
            clearFocusedTable();
          }}
          className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
        >
          {schemas.map((schema) => (
            <option key={schema.name} value={schema.name}>
              {schema.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {tables.length} tables, {foreignKeys.length} relationships
        </span>

        {focusedTableName && (
          <>
            <div className="mx-2 h-4 border-l border-[hsl(var(--border))]" />
            <span className="text-xs text-[hsl(var(--warning))]">
              Focused: {focusedTableName}
            </span>
            <button
              onClick={clearFocusedTable}
              className="rounded-sm bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            >
              Show All
            </button>
          </>
        )}
      </div>
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls />
          <Background color={bgColor} gap={16} />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor="#60a5fa"
            maskColor="rgba(0, 0, 0, 0.3)"
            pannable
            zoomable
            position="bottom-right"
            style={{ zIndex: 5 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
