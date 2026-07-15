import "server-only";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";

config({ override: true, quiet: true });

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function createAzureOpenAIModel(): BaseChatModel {
  return new ChatOpenAI({
    model: requiredEnv("AZURE_OPENAI_MODEL"),
    apiKey: requiredEnv("AZURE_OPENAI_API_KEY"),
    useResponsesApi: true,
    configuration: {
      baseURL: requiredEnv("AZURE_OPENAI_BASE_URL"),
    },
  });
}
