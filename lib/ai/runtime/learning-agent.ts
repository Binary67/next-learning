import "server-only";

import { createLearningAgentGraph } from "@/lib/ai/agents/learning/graph";
import { createModel } from "@/lib/ai/create-model";
import { createLearningTools } from "@/lib/ai/tools/learning-tools";

let learningAgent: ReturnType<typeof createLearningAgentGraph> | undefined;

export function getLearningAgent() {
  if (!learningAgent) {
    const model = createModel();

    learningAgent = createLearningAgentGraph({
      model,
      tools: createLearningTools(model),
    });
  }

  return learningAgent;
}
