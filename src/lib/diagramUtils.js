/**
 * Utility functions for diagram generation and manipulation
 * Handles conversion between API responses and React Flow format
 */

import { MarkerType } from "reactflow";

// Layout configuration for block positioning
// Arranged in a logical flow: Power -> Inputs -> Processing -> Outputs, with Peripherals below
const blockPositions = {
  power: { x: 50, y: 200 },
  inputs: { x: 350, y: 50 },
  processing: { x: 650, y: 200 },
  outputs: { x: 950, y: 50 },
  peripherals: { x: 650, y: 400 },
};

/**
 * Convert API diagram data to React Flow nodes
 */
export function diagramToNodes(diagram) {
  return diagram.blocks.map((block) => ({
    id: block.id,
    type: "block",
    position: blockPositions[block.type] || { x: 400, y: 200 },
    data: {
      type: block.type,
      title: block.title,
      components: block.components,
      annotation: block.annotation,
    },
    draggable: true,
  }));
}

/**
 * Convert API connections to React Flow edges
 */
export function connectionsToEdges(connections) {
  return connections.map((conn, index) => ({
    id: `edge-${conn.source}-${conn.target}-${index}`,
    source: conn.source,
    target: conn.target,
    label: conn.label,
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(199 89% 48%)", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "hsl(199 89% 48%)",
    },
  }));
}

/**
 * Convert React Flow nodes back to diagram format for export
 */
export function nodesToDiagram(nodes, edges) {
  const blocks = nodes.map((node) => ({
    id: node.id,
    type: node.data.type,
    title: node.data.title,
    components: node.data.components,
    annotation: node.data.annotation,
  }));

  const connections = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : undefined,
  }));

  return { blocks, connections };
}

/**
 * Export diagram data as JSON file
 */
export function exportDiagramAsJson(nodes, edges, originalDescription) {
  const diagram = nodesToDiagram(nodes, edges);
  
  const exportData = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    description: originalDescription,
    diagram,
    // Include React Flow compatible format for reimporting
    reactFlowData: {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `block-diagram-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate default diagram with empty blocks
 */
export function generateDefaultDiagram() {
  return {
    blocks: [
      {
        id: "power-1",
        type: "power",
        title: "Power Supply",
        components: ["Battery", "Voltage Regulator"],
      },
      {
        id: "inputs-1",
        type: "inputs",
        title: "Inputs Block",
        components: ["Sensor Module", "Button Interface"],
      },
      {
        id: "processing-1",
        type: "processing",
        title: "Control and Processing",
        components: ["Microcontroller", "Memory"],
      },
      {
        id: "outputs-1",
        type: "outputs",
        title: "Outputs Block",
        components: ["LED Indicator", "Display"],
      },
      {
        id: "peripherals-1",
        type: "peripherals",
        title: "Other Peripherals",
        components: ["Debug Interface", "External Connector"],
      },
    ],
    connections: [
      { source: "power-1", target: "processing-1", label: "VCC" },
      { source: "inputs-1", target: "processing-1", label: "Data" },
      { source: "processing-1", target: "outputs-1", label: "Control" },
      { source: "processing-1", target: "peripherals-1", label: "I/O" },
    ],
  };
}
