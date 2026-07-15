import { z } from "zod";

const flowDiagramNodeSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  kind: z.enum(["start", "step", "decision", "end"]),
});

const flowDiagramEdgeSchema = z.object({
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const flowDiagramSchema = z
  .object({
    title: z.string().trim().min(1),
    nodes: z.array(flowDiagramNodeSchema).min(2),
    edges: z.array(flowDiagramEdgeSchema).min(1),
  })
  .superRefine((flowDiagram, context) => {
    const nodeIds = new Set<string>();

    flowDiagram.nodes.forEach((node, index) => {
      if (nodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate node id: ${node.id}`,
          path: ["nodes", index, "id"],
        });
      }

      nodeIds.add(node.id);
    });

    flowDiagram.edges.forEach((edge, index) => {
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

export type FlowDiagram = z.infer<typeof flowDiagramSchema>;
