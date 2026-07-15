import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const learningMaterialSchema = z.object({
  filename: z.string().min(1),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, "Learning material is empty."),
});

export async function loadLearningMaterial() {
  const dataDirectory = path.join(process.cwd(), "data");
  const entries = await readdir(dataDirectory, { withFileTypes: true });
  const markdownFiles = entries.filter(
    (entry) =>
      entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
  );

  if (markdownFiles.length !== 1) {
    throw new Error(
      `Expected exactly one Markdown file in ${dataDirectory}, found ${markdownFiles.length}.`,
    );
  }

  const filename = markdownFiles[0].name;
  const content = await readFile(path.join(dataDirectory, filename), "utf8");

  return learningMaterialSchema.parse({ filename, content });
}
