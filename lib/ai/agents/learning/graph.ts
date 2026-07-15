import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { learningAgentPrompt } from "./prompt";
import { learningAgentStateSchema } from "./state";

type CreateLearningAgentGraphOptions = {
  model: BaseChatModel;
  tools: StructuredToolInterface[];
};

export function createLearningAgentGraph({
  model,
  tools,
}: CreateLearningAgentGraphOptions) {
  if (!model.bindTools) {
    throw new Error("The configured model does not support tool calling.");
  }

  const modelWithTools = model.bindTools(tools);

  const callAgent: typeof learningAgentStateSchema.Node = async (state) => {
    const response = await modelWithTools.invoke([
      new SystemMessage(learningAgentPrompt),
      ...state.messages,
    ]);

    return { messages: [response] };
  };

  return new StateGraph(learningAgentStateSchema)
    .addNode("agent", callAgent)
    .addNode("tools", new ToolNode(tools, { handleToolErrors: false }))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition, ["tools", END])
    .addEdge("tools", "agent")
    .compile();
}
