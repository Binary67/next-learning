import "server-only";

import { HumanMessage, isAIMessage } from "@langchain/core/messages";

import type { LearningResponse } from "@/lib/learning/contracts";
import { loadLearningMaterial } from "@/lib/learning/material";

import { getLearningAgent } from "./learning-agent";

export const automaticLearningRequest =
  "Analyze the provided learning material and explain it clearly. Use whichever available tools materially improve understanding.";

export async function runLearningWorkflow(
  message: string,
): Promise<LearningResponse> {
  const learningMaterial = await loadLearningMaterial();
  const result = await getLearningAgent().invoke({
    messages: [new HumanMessage(message)],
    learningMaterial,
  });
  const lastAssistantMessage = result.messages.findLast(isAIMessage);

  if (!lastAssistantMessage) {
    throw new Error("The learning agent did not return an assistant message.");
  }

  return {
    message: lastAssistantMessage.text,
    conceptMap: result.conceptMap ?? null,
    flowDiagram: result.flowDiagram ?? null,
  };
}
