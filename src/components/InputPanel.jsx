/**
 * Input panel for entering electronics product descriptions
 * Handles form submission and loading states
 */

import { useState } from "react";
import { Cpu, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Example product descriptions for inspiration
const examples = [
  "Smart doorbell with camera and motion sensor",
  "Wireless temperature monitoring device with LCD display",
  "Bluetooth speaker with RGB lighting effects",
  "Solar-powered weather station with WiFi connectivity",
  "Smart home hub with voice control and touch screen",
];

export default function InputPanel({ onSubmit, isLoading }) {
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (description.trim() && !isLoading) {
      onSubmit(description.trim());
    }
  };

  const handleExampleClick = (example) => {
    setDescription(example);
  };

  return (
    <div className="panel-glass p-6 w-full max-w-md animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Describe Your Product</h2>
          <p className="text-sm text-muted-foreground">
            Enter an electronics product description
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Smart doorbell with camera and motion sensor..."
          className="input-glow min-h-[100px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
          disabled={isLoading}
        />

        <Button
          type="submit"
          disabled={!description.trim() || isLoading}
          className="w-full btn-glow gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Diagram...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Block Diagram
            </>
          )}
        </Button>
      </form>

      {/* Examples */}
      <div className="mt-6">
        <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors disabled:opacity-50"
            >
              {example.length > 30 ? example.slice(0, 30) + "..." : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
