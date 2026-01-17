/**
 * Interactive Block Diagram Canvas - Main Page
 * 
 * This application generates editable block diagrams of electronics products
 * from natural language descriptions. The diagram always contains exactly
 * 5 sections: Power Supply, Inputs, Control/Processing, Outputs, and Peripherals.
 * 
 * Architecture:
 * - InputPanel: Accepts product descriptions from users
 * - DiagramCanvas: React Flow canvas for rendering and editing blocks
 * - AI Edge Function: Converts descriptions to structured diagram JSON
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Zap, Info } from "lucide-react";
import DiagramCanvas from "@/components/DiagramCanvas";
import InputPanel from "@/components/InputPanel";
import {
  diagramToNodes,
  connectionsToEdges,
  exportDiagramAsJson,
  generateDefaultDiagram,
} from "@/lib/diagramUtils";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  // Diagram state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate diagram from description
  const handleGenerateDiagram = useCallback(async (description) => {
    setIsLoading(true);
    setCurrentDescription(description);

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { description },
      });

      if (error) {
        console.error("Function error:", error);
        
        // Handle specific error types
        if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (error.message?.includes("402") || error.message?.includes("Payment")) {
          toast.error("Usage limit reached. Please add credits to continue.");
        } else {
          toast.error("Failed to generate diagram. Please try again.");
        }
        return;
      }

      if (!data?.diagram) {
        toast.error("Invalid response from AI. Please try again.");
        return;
      }

      const diagram = data.diagram;

      // Convert to React Flow format
      const newNodes = diagramToNodes(diagram);
      const newEdges = connectionsToEdges(diagram.connections);

      setNodes(newNodes);
      setEdges(newEdges);
      setHasGenerated(true);

      toast.success(`Generated diagram with ${diagram.blocks.length} blocks!`);
    } catch (err) {
      console.error("Error generating diagram:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (nodes.length === 0) {
      toast.error("No diagram to export. Generate a diagram first.");
      return;
    }
    exportDiagramAsJson(nodes, edges, currentDescription);
    toast.success("Diagram exported as JSON!");
  }, [nodes, edges, currentDescription]);

  // Handle reset
  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setHasGenerated(false);
    setCurrentDescription("");
    toast.info("Canvas cleared.");
  }, []);

  // Load default diagram for demo
  const handleLoadDefault = useCallback(() => {
    const defaultDiagram = generateDefaultDiagram();
    setNodes(diagramToNodes(defaultDiagram));
    setEdges(connectionsToEdges(defaultDiagram.connections));
    setHasGenerated(true);
    setCurrentDescription("Default template diagram");
    toast.success("Loaded default template.");
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg animate-pulse-glow">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">
              Block Diagram Canvas
            </h1>
            <p className="text-xs text-muted-foreground">
              Electronics System Architecture Tool
            </p>
          </div>
        </div>

        {/* Info tooltip */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">
            Drag blocks to reposition • Click to edit • Connect blocks by dragging handles
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input panel (sidebar) */}
        <aside className="w-full max-w-md p-6 border-r border-border overflow-y-auto bg-background/50">
          <InputPanel onSubmit={handleGenerateDiagram} isLoading={isLoading} />

          {/* Quick actions */}
          {!hasGenerated && (
            <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Or start with a template:
              </p>
              <button
                onClick={handleLoadDefault}
                className="text-sm text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Load default template →
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Block Types</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-block-power" />
                <span className="text-muted-foreground">Power Supply</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-block-inputs" />
                <span className="text-muted-foreground">Inputs Block</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-block-processing" />
                <span className="text-muted-foreground">Control & Processing</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-block-outputs" />
                <span className="text-muted-foreground">Outputs Block</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded bg-block-peripherals" />
                <span className="text-muted-foreground">Other Peripherals</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 relative">
          {hasGenerated ? (
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onExport={handleExport}
              onReset={handleReset}
            />
          ) : (
            /* Empty state */
            <div className="h-full w-full canvas-grid flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-primary/50" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Diagram Yet
                </h2>
                <p className="text-muted-foreground">
                  Describe an electronics product in the input panel to generate
                  a block diagram with 5 sections: Power, Inputs, Processing,
                  Outputs, and Peripherals.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
