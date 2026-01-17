/**
 * Edge function to generate block diagram from natural language description
 * Uses Lovable AI to parse electronics product descriptions into structured diagram JSON
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt for diagram generation
const SYSTEM_PROMPT = `You are an electronics system architect that converts natural language descriptions of electronics products into structured block diagrams.

CRITICAL RULES:
1. You MUST always generate EXACTLY 5 blocks, no more, no less
2. The 5 blocks are ALWAYS:
   - Power Supply
   - Inputs Block
   - Control and Processing Block
   - Outputs Block
   - Other Peripherals

For each block, you must infer appropriate electronic components based on the product description.
If the description doesn't mention specific components for a block, use sensible defaults.

COMPONENT GUIDELINES:
- Power Supply: Include power sources (battery, USB, AC adapter), voltage regulators, power management ICs
- Inputs Block: Sensors, buttons, switches, microphones, cameras, touch interfaces, wireless receivers
- Control and Processing Block: MCU, CPU, FPGA, memory, clock, communication interfaces
- Outputs Block: Displays, LEDs, speakers, motors, actuators, wireless transmitters
- Other Peripherals: Storage, connectivity modules, debugging interfaces, external connectors

You must respond with a JSON object using tool calling. The response must follow the exact schema provided.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating diagram for: "${description}"`);

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Generate a block diagram for the following electronics product: "${description}"
            
Make sure to include relevant components for each of the 5 required blocks based on the product description.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_block_diagram",
              description: "Generate a structured block diagram with exactly 5 blocks",
              parameters: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Unique identifier for the block" },
                        type: { 
                          type: "string", 
                          enum: ["power", "inputs", "processing", "outputs", "peripherals"],
                          description: "Block type category" 
                        },
                        title: { type: "string", description: "Display title for the block" },
                        components: {
                          type: "array",
                          items: { type: "string" },
                          description: "List of electronic components in this block"
                        },
                        annotation: { type: "string", description: "Optional annotation or notes" }
                      },
                      required: ["id", "type", "title", "components"]
                    },
                    minItems: 5,
                    maxItems: 5
                  },
                  connections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source: { type: "string", description: "Source block ID" },
                        target: { type: "string", description: "Target block ID" },
                        label: { type: "string", description: "Connection label" }
                      },
                      required: ["source", "target"]
                    },
                    description: "Connections between blocks"
                  }
                },
                required: ["blocks", "connections"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_block_diagram" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate diagram" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_block_diagram") {
      console.error("Unexpected response format:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Invalid response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagramData = JSON.parse(toolCall.function.arguments);
    
    // Validate we have exactly 5 blocks
    if (!diagramData.blocks || diagramData.blocks.length !== 5) {
      console.error("Invalid block count:", diagramData.blocks?.length);
      return new Response(
        JSON.stringify({ error: "AI did not generate exactly 5 blocks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Diagram generated successfully with", diagramData.blocks.length, "blocks");

    return new Response(
      JSON.stringify({ diagram: diagramData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating diagram:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
