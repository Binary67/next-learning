import { z } from "zod";

const conceptMapNodeSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const conceptMapEdgeSchema = z.object({
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const conceptMapSchema = z
  .object({
    title: z.string().trim().min(1),
    nodes: z.array(conceptMapNodeSchema).min(1),
    edges: z.array(conceptMapEdgeSchema),
  })
  .superRefine((conceptMap, context) => {
    const nodeIds = new Set<string>();

    conceptMap.nodes.forEach((node, index) => {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate node id: ${node.id}`,
          path: ["nodes", index, "id"],
        });
      }

      nodeIds.add(node.id);
    });

    conceptMap.edges.forEach((edge, index) => {
      if (!nodeIds.has(edge.source)) {
        context.addIssue({
          code: "custom",
          message: `Unknown source node: ${edge.source}`,
          path: ["edges", index, "source"],
        });
      }

      if (!nodeIds.has(edge.target)) {
        context.addIssue({
          code: "custom",
          message: `Unknown target node: ${edge.target}`,
          path: ["edges", index, "target"],
        });
      }
    });
  });

export type ConceptMap = z.infer<typeof conceptMapSchema>;
