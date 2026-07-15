import { MessagesValue, StateSchema } from "@langchain/langgraph";

import { conceptMapSchema } from "@/lib/learning/concept-map";

export const learningAgentStateSchema = new StateSchema({
  messages: MessagesValue,
  conceptMap: conceptMapSchema.optional(),
});
