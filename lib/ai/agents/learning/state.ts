import { MessagesValue, StateSchema } from "@langchain/langgraph";

import { conceptMapSchema } from "@/lib/learning/concept-map";
import { learningMaterialSchema } from "@/lib/learning/material";

export const learningAgentStateSchema = new StateSchema({
  messages: MessagesValue,
  learningMaterial: learningMaterialSchema,
  conceptMap: conceptMapSchema.optional(),
});
