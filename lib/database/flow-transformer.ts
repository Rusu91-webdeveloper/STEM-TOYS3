import dagre from "dagre";
import { Node, Edge, Position } from "@xyflow/react";
import { SchemaModel, SchemaRelation, getDomainColor } from "./schema-analyzer";

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Transform schema models into React Flow nodes and edges
 */
export function transformToFlow(
  models: SchemaModel[],
  relations: SchemaRelation[]
): FlowData {
  const nodes: Node[] = models.map((model, index) => {
    const importantFields = model.fields.filter(f => !f.isRelation).slice(0, 7);

    const moreFieldsCount = Math.max(
      0,
      model.fields.filter(f => !f.isRelation).length - 7
    );

    return {
      id: model.name,
      type: "table",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label: model.name,
        fields: importantFields,
        moreFieldsCount,
        totalFields: model.fields.length,
        domain: model.domain,
        color: getDomainColor(model.domain),
        indexes: model.indexes,
        relations: model.relations,
        allFields: model.fields,
      },
    };
  });

  const edges: Edge[] = relations.map((relation, index) => {
    const edgeType =
      relation.type === "many-to-many" ? "default" : "smoothstep";
    const animated = relation.type === "many-to-many";

    return {
      id: `${relation.from}-${relation.to}-${index}`,
      source: relation.from,
      target: relation.to,
      type: edgeType,
      animated,
      label:
        relation.type === "one-to-many"
          ? "1:N"
          : relation.type === "many-to-many"
            ? "N:M"
            : "1:1",
      labelStyle: {
        fontSize: 10,
        fill: "#64748b",
        fontWeight: 600,
      },
      style: {
        stroke: "#94a3b8",
        strokeWidth: 2,
      },
      markerEnd: {
        type: "arrowclosed",
        color: "#94a3b8",
      },
    };
  });

  return { nodes, edges };
}

/**
 * Apply dagre layout to nodes for clean auto-positioning
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 280;
  const nodeHeight = 220;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to dagre
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
      targetPosition: direction === "TB" ? Position.Top : Position.Left,
    };
  });

  return layoutedNodes;
}

/**
 * Group nodes by domain for organized layout
 */
export function groupNodesByDomain(nodes: Node[]): Record<string, Node[]> {
  const grouped: Record<string, Node[]> = {};

  nodes.forEach(node => {
    const domain = node.data.domain || "other";
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(node);
  });

  return grouped;
}

/**
 * Calculate bounds for a group of nodes
 */
export function calculateGroupBounds(nodes: Node[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX - 20,
    y: minY - 40,
    width: maxX - minX + 300,
    height: maxY - minY + 260,
  };
}
