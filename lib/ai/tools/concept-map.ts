import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool, type ToolRuntime } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { conceptMapSchema } from "@/lib/learning/concept-map";

const conceptMapToolInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1)
    .describe("The topic or learning request to organize into a concept map."),
});

const conceptMapPrompt = `You create concise concept maps that make a topic easier to learn.
Identify the essential concepts, give each concept a stable unique id, and connect related concepts with clearly labelled directed edges.
Every edge source and target must match a node id. Return only the requested structured output.`;

type CreateConceptMapToolOptions = {
  model: BaseChatModel;
};

export function createConceptMapTool({ model }: CreateConceptMapToolOptions) {
  const structuredModel = model.withStructuredOutput(conceptMapSchema);

  return tool(
    async ({ topic }, runtime: ToolRuntime) => {
      const conceptMap = await structuredModel.invoke([
        new SystemMessage(conceptMapPrompt),
        new HumanMessage(topic),
      ]);

      return new Command({
        update: {
          conceptMap,
          messages: [
            new ToolMessage({
              content: `Generated a concept map with ${conceptMap.nodes.length} concepts and ${conceptMap.edges.length} relationships.`,
              tool_call_id: runtime.toolCallId,
            }),
          ],
        },
      });
    },
    {
      name: "generate_concept_map",
      description:
        "Generate a structured concept map when relationships between concepts would make a topic easier to understand.",
      schema: conceptMapToolInputSchema,
    },
  );
}
