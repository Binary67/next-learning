import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { finalizeLearningArtifacts } from "./artifacts";
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
      new HumanMessage(
        `Learning material filename: ${JSON.stringify(state.learningMaterial.filename)}\n\n` +
          `--- BEGIN LEARNING MATERIAL ---\n${state.learningMaterial.content}\n--- END LEARNING MATERIAL ---`,
      ),
      ...state.messages,
    ]);

    return { messages: [response] };
  };

  const routeAfterAgent = (state: typeof learningAgentStateSchema.State) =>
    toolsCondition(state) === "tools" ? "tools" : "finalizeArtifacts";

  return new StateGraph(learningAgentStateSchema)
    .addNode("agent", callAgent)
    .addNode("tools", new ToolNode(tools, { handleToolErrors: false }))
    .addNode("finalizeArtifacts", finalizeLearningArtifacts)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", routeAfterAgent, [
      "tools",
      "finalizeArtifacts",
    ])
    .addEdge("tools", "agent")
    .addEdge("finalizeArtifacts", END)
    .compile();
}
