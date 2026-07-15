import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { createConceptMapTool } from "./concept-map";
import { createFlowDiagramTool } from "./flow-diagram";

export function createLearningTools(model: BaseChatModel) {
  return [createConceptMapTool({ model }), createFlowDiagramTool({ model })];
}
