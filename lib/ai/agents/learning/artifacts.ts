import "server-only";

import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { conceptMapSchema } from "@/lib/learning/concept-map";
import { renderConceptMapSvg } from "@/lib/learning/concept-map-svg";

import { learningAgentStateSchema } from "./state";

export const finalizeLearningArtifacts: typeof learningAgentStateSchema.Node =
  async (state) => {
    const conceptMap = state.conceptMap
      ? conceptMapSchema.parse(state.conceptMap)
      : null;
    const outputDirectory = path.join(process.cwd(), "output");

    await mkdir(outputDirectory, { recursive: true });

    const existingFiles = await readdir(outputDirectory, {
      withFileTypes: true,
    });

    await Promise.all(
      existingFiles
        .filter(
          (entry) =>
            entry.isFile() &&
            (entry.name.endsWith(".concept-map.json") ||
              entry.name.endsWith(".concept-map.svg")),
        )
        .map((entry) => unlink(path.join(outputDirectory, entry.name))),
    );

    if (!conceptMap) {
      return {};
    }

    const outputStem = path.parse(state.learningMaterial.filename).name;

    await writeFile(
      path.join(outputDirectory, `${outputStem}.concept-map.json`),
      `${JSON.stringify(conceptMap, null, 2)}\n`,
      "utf8",
    );

    const svg = renderConceptMapSvg(conceptMap);

    await writeFile(
      path.join(outputDirectory, `${outputStem}.concept-map.svg`),
      svg,
      "utf8",
    );

    return {};
  };
