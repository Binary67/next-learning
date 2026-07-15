import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { createAzureOpenAIModel } from "./providers/azure-openai";

export function createModel(): BaseChatModel {
  return createAzureOpenAIModel();
}
