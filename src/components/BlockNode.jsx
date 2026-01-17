/**
 * Custom React Flow node component for diagram blocks
 * Supports editing, annotations, and visual styling per block type
 */

import { memo, useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { Pencil, MessageSquare, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Block styling configuration
const blockStyles = {
  power: { className: "block-power", icon: "⚡" },
  inputs: { className: "block-inputs", icon: "📥" },
  processing: { className: "block-processing", icon: "🔧" },
  outputs: { className: "block-outputs", icon: "📤" },
  peripherals: { className: "block-peripherals", icon: "🔌" },
};

const BlockNode = memo(({ id, data, selected, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editComponents, setEditComponents] = useState(data.components);
  const [editAnnotation, setEditAnnotation] = useState(data.annotation || "");
  const [showAnnotation, setShowAnnotation] = useState(!!data.annotation);
  const [newComponent, setNewComponent] = useState("");

  const style = blockStyles[data.type];

  // Handle save edit
  const handleSave = useCallback(() => {
    if (onUpdate) {
      onUpdate(id, {
        title: editTitle,
        components: editComponents,
        annotation: editAnnotation || undefined,
      });
    }
    setIsEditing(false);
  }, [id, editTitle, editComponents, editAnnotation, onUpdate]);

  // Handle cancel edit
  const handleCancel = useCallback(() => {
    setEditTitle(data.title);
    setEditComponents(data.components);
    setEditAnnotation(data.annotation || "");
    setIsEditing(false);
  }, [data]);

  // Handle add component
  const handleAddComponent = useCallback(() => {
    if (newComponent.trim()) {
      setEditComponents((prev) => [...prev, newComponent.trim()]);
      setNewComponent("");
    }
  }, [newComponent]);

  // Handle remove component
  const handleRemoveComponent = useCallback((index) => {
    setEditComponents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div
      className={cn(
        "block-node p-4 min-w-[240px] max-w-[300px]",
        style.className,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      {/* Block header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{style.icon}</span>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-transparent border-b border-foreground/50 text-foreground font-semibold text-sm focus:outline-none focus:border-primary px-1"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-sm text-foreground">{data.title}</h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 hover:bg-foreground/10 rounded transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4 text-block-inputs" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-foreground/10 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-foreground/10 rounded transition-colors"
                title="Edit block"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowAnnotation(!showAnnotation)}
                className={cn(
                  "p-1 hover:bg-foreground/10 rounded transition-colors",
                  showAnnotation && "bg-foreground/10"
                )}
                title="Toggle annotation"
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Components list */}
      <div className="space-y-1 mb-2">
        {(isEditing ? editComponents : data.components).map((component, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-background/20 rounded px-2 py-1 text-xs font-mono"
          >
            <span className="text-foreground/90">{component}</span>
            {isEditing && (
              <button
                onClick={() => handleRemoveComponent(index)}
                className="p-0.5 hover:bg-destructive/20 rounded"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add component input (when editing) */}
      {isEditing && (
        <div className="flex gap-1 mb-2">
          <input
            type="text"
            value={newComponent}
            onChange={(e) => setNewComponent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComponent()}
            placeholder="Add component..."
            className="flex-1 bg-background/20 border border-foreground/20 rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleAddComponent}
            className="p-1 bg-primary/20 hover:bg-primary/30 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}

      {/* Annotation section */}
      {showAnnotation && (
        <div className="mt-3 pt-3 border-t border-foreground/20">
          {isEditing ? (
            <textarea
              value={editAnnotation}
              onChange={(e) => setEditAnnotation(e.target.value)}
              placeholder="Add notes or annotations..."
              className="w-full bg-background/20 border border-foreground/20 rounded p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
              rows={2}
            />
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {data.annotation || "No annotation"}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

BlockNode.displayName = "BlockNode";

export default BlockNode;
