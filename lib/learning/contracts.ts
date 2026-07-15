import { z } from "zod";

import type { ConceptMap } from "./concept-map";

export const learningRequestSchema = z
  .object({
    message: z.string().trim().min(1),
  })
  .strict();

export type LearningRequest = z.infer<typeof learningRequestSchema>;

export type LearningResponse = {
  message: string;
  conceptMap: ConceptMap | null;
};
