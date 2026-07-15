import { HumanMessage, isAIMessage } from "@langchain/core/messages";

import { getLearningAgent } from "@/lib/ai/runtime/learning-agent";
import {
  learningRequestSchema,
  type LearningResponse,
} from "@/lib/learning/contracts";

const invalidRequestResponse = () =>
  Response.json({ error: "Invalid request body." }, { status: 400 });

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidRequestResponse();
  }

  const requestResult = learningRequestSchema.safeParse(body);

  if (!requestResult.success) {
    return invalidRequestResponse();
  }

  try {
    const result = await getLearningAgent().invoke({
      messages: [new HumanMessage(requestResult.data.message)],
    });
    const lastAssistantMessage = result.messages.findLast(isAIMessage);

    if (!lastAssistantMessage) {
      throw new Error("The learning agent did not return an assistant message.");
    }

    const response: LearningResponse = {
      message: lastAssistantMessage.text,
      conceptMap: result.conceptMap ?? null,
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Unable to process the learning request." },
      { status: 500 },
    );
  }
}
