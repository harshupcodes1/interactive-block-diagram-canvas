/**
 * Main diagram canvas component using React Flow
 * Handles node/edge rendering, interactions, and layout
 */

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import BlockNode from "./BlockNode";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Default edge style
const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "hsl(199 89% 48%)", strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "hsl(199 89% 48%)",
  },
};

export default function DiagramCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onExport,
  onReset,
}) {
  // Use React Flow state management
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Update parent when nodes change
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      setNodes((nds) => {
        onNodesChange(nds);
        return nds;
      });
    },
    [onNodesChangeInternal, onNodesChange, setNodes]
  );

  // Update parent when edges change
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      setEdges((eds) => {
        onEdgesChange(eds);
        return eds;
      });
    },
    [onEdgesChangeInternal, onEdgesChange, setEdges]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        );
        onEdgesChange(newEdges);
        return newEdges;
      });
    },
    [setEdges, onEdgesChange]
  );

  // Update node data
  const handleNodeUpdate = useCallback(
    (nodeId, newData) => {
      setNodes((nds) => {
        const updatedNodes = nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        );
        onNodesChange(updatedNodes);
        return updatedNodes;
      });
    },
    [setNodes, onNodesChange]
  );

  // Delete node
  const handleNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => {
        const updatedNodes = nds.filter((node) => node.id !== nodeId);
        onNodesChange(updatedNodes);
        return updatedNodes;
      });
      setEdges((eds) => {
        const updatedEdges = eds.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        );
        onEdgesChange(updatedEdges);
        return updatedEdges;
      });
    },
    [setNodes, setEdges, onNodesChange, onEdgesChange]
  );

  // Custom node component with handlers
  const nodeTypesWithHandlers = useMemo(
    () => ({
      block: (props) => (
        <BlockNode
          {...props}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
        />
      ),
    }),
    [handleNodeUpdate, handleNodeDelete]
  );

  // Sync with external state changes
  useMemo(() => {
    if (JSON.stringify(initialNodes) !== JSON.stringify(nodes)) {
      setNodes(initialNodes);
    }
  }, [initialNodes]);

  useMemo(() => {
    if (JSON.stringify(initialEdges) !== JSON.stringify(edges)) {
      setEdges(initialEdges);
    }
  }, [initialEdges]);

  return (
    <div className="w-full h-full canvas-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypesWithHandlers}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(217 33% 25%)"
        />
        <Controls
          className="bg-card border border-border rounded-lg overflow-hidden"
          showInteractive={false}
        />
        
        {/* Control panel */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            onClick={onExport}
            variant="secondary"
            size="sm"
            className="btn-glow gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
