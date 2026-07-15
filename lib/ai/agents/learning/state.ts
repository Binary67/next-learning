import { MessagesValue, StateSchema } from "@langchain/langgraph";

import { conceptMapSchema } from "@/lib/learning/concept-map";
import { flowDiagramSchema } from "@/lib/learning/flow-diagram";
import { learningMaterialSchema } from "@/lib/learning/material";

export const learningAgentStateSchema = new StateSchema({
  messages: MessagesValue,
  learningMaterial: learningMaterialSchema,
  conceptMap: conceptMapSchema.optional(),
  flowDiagram: flowDiagramSchema.optional(),
});
