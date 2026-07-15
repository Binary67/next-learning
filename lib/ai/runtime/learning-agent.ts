import "server-only";

import { createLearningAgentGraph } from "@/lib/ai/agents/learning/graph";
import { createModel } from "@/lib/ai/create-model";
import { createConceptMapTool } from "@/lib/ai/tools/concept-map";

let learningAgent: ReturnType<typeof createLearningAgentGraph> | undefined;

export function getLearningAgent() {
  if (!learningAgent) {
    const model = createModel();
    const conceptMapTool = createConceptMapTool({ model });

    learningAgent = createLearningAgentGraph({
      model,
      tools: [conceptMapTool],
    });
  }

  return learningAgent;
}
