import "server-only";

import { isAIMessage } from "@langchain/core/messages";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { conceptMapSchema } from "@/lib/learning/concept-map";
import { renderConceptMapSvg } from "@/lib/learning/concept-map-svg";
import { flowDiagramSchema } from "@/lib/learning/flow-diagram";
import { renderFlowDiagramSvg } from "@/lib/learning/flow-diagram-svg";

import { learningAgentStateSchema } from "./state";

export const finalizeLearningArtifacts: typeof learningAgentStateSchema.Node =
  async (state) => {
    const lastAssistantMessage = state.messages.findLast(isAIMessage);

    if (!lastAssistantMessage) {
      throw new Error("The learning agent did not return an assistant message.");
    }

    const conceptMap = state.conceptMap
      ? conceptMapSchema.parse(state.conceptMap)
      : null;
    const flowDiagram = state.flowDiagram
      ? flowDiagramSchema.parse(state.flowDiagram)
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
            (entry.name.endsWith(".explanation.md") ||
              entry.name.endsWith(".concept-map.json") ||
              entry.name.endsWith(".concept-map.svg") ||
              entry.name.endsWith(".flow-diagram.json") ||
              entry.name.endsWith(".flow-diagram.svg")),
        )
        .map((entry) => unlink(path.join(outputDirectory, entry.name))),
    );

    const outputStem = path.parse(state.learningMaterial.filename).name;

    await writeFile(
      path.join(outputDirectory, `${outputStem}.explanation.md`),
      `${lastAssistantMessage.text}\n`,
      "utf8",
    );

    if (conceptMap) {
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
    }

    if (flowDiagram) {
      await writeFile(
        path.join(outputDirectory, `${outputStem}.flow-diagram.json`),
        `${JSON.stringify(flowDiagram, null, 2)}\n`,
        "utf8",
      );

      const svg = renderFlowDiagramSvg(flowDiagram);

      await writeFile(
        path.join(outputDirectory, `${outputStem}.flow-diagram.svg`),
        svg,
        "utf8",
      );
    }

    return {};
  };
