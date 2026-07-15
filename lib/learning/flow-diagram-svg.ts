import type { FlowDiagram } from "./flow-diagram";

const stepWidth = 280;
const stepHeight = 150;
const decisionWidth = 320;
const decisionHeight = 180;

type FlowNode = FlowDiagram["nodes"][number];

type Point = {
  x: number;
  y: number;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value: string, maximumLength: number, maximumLines: number) {
  const lines: string[] = [];
  let remaining = value.trim().replace(/\s+/g, " ");

  while (remaining && lines.length < maximumLines) {
    if (remaining.length <= maximumLength) {
      lines.push(remaining);
      remaining = "";
      break;
    }

    const lastSpace = remaining.lastIndexOf(" ", maximumLength);
    const breakAt = lastSpace > 0 ? lastSpace : maximumLength;

    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }

  if (remaining && lines.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex]
      .slice(0, maximumLength - 1)
      .trimEnd()}…`;
  }

  return lines;
}

function number(value: number) {
  return value.toFixed(1);
}

function nodeSize(node: FlowNode) {
  return node.kind === "decision"
    ? { width: decisionWidth, height: decisionHeight }
    : { width: stepWidth, height: stepHeight };
}

function nodeBoundary(node: FlowNode, from: Point, to: Point) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const { width, height } = nodeSize(node);

  if (deltaX === 0 && deltaY === 0) {
    return { x: from.x, y: from.y - height / 2 };
  }

  if (node.kind === "decision") {
    const scale =
      1 / (Math.abs(deltaX) / (width / 2) + Math.abs(deltaY) / (height / 2));

    return {
      x: from.x + deltaX * scale,
      y: from.y + deltaY * scale,
    };
  }

  const horizontalScale =
    deltaX === 0 ? Number.POSITIVE_INFINITY : width / 2 / Math.abs(deltaX);
  const verticalScale =
    deltaY === 0 ? Number.POSITIVE_INFINITY : height / 2 / Math.abs(deltaY);
  const scale = Math.min(horizontalScale, verticalScale);

  return {
    x: from.x + deltaX * scale,
    y: from.y + deltaY * scale,
  };
}

function createLayers(flowDiagram: FlowDiagram) {
  const incoming = new Map(flowDiagram.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(
    flowDiagram.nodes.map((node) => [node.id, [] as string[]]),
  );

  flowDiagram.edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  });

  const queue = flowDiagram.nodes
    .filter((node) => incoming.get(node.id) === 0)
    .sort(
      (left, right) =>
        Number(right.kind === "start") - Number(left.kind === "start"),
    )
    .map((node) => node.id);
  const levels = new Map(queue.map((id) => [id, 0]));

  while (queue.length > 0) {
    const sourceId = queue.shift();

    if (!sourceId) {
      continue;
    }

    const sourceLevel = levels.get(sourceId) ?? 0;

    outgoing.get(sourceId)?.forEach((targetId) => {
      levels.set(
        targetId,
        Math.max(levels.get(targetId) ?? 0, sourceLevel + 1),
      );

      const remainingIncoming = (incoming.get(targetId) ?? 0) - 1;
      incoming.set(targetId, remainingIncoming);

      if (remainingIncoming === 0) {
        queue.push(targetId);
      }
    });
  }

  let nextLevel = Math.max(-1, ...levels.values()) + 1;

  flowDiagram.nodes.forEach((node) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, nextLevel);
      nextLevel += 1;
    }
  });

  const layers = new Map<number, FlowNode[]>();

  flowDiagram.nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    layers.set(level, [...(layers.get(level) ?? []), node]);
  });

  return [...layers.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, nodes]) => nodes);
}

export function renderFlowDiagramSvg(flowDiagram: FlowDiagram) {
  const padding = 80;
  const titleHeight = 100;
  const horizontalGap = 100;
  const verticalGap = 120;
  const layers = createLayers(flowDiagram);
  const maximumNodesInLayer = Math.max(...layers.map((layer) => layer.length));
  const graphWidth =
    maximumNodesInLayer * decisionWidth +
    Math.max(0, maximumNodesInLayer - 1) * horizontalGap;
  const graphHeight =
    layers.length * decisionHeight +
    Math.max(0, layers.length - 1) * verticalGap;
  const width = Math.ceil(graphWidth + padding * 2);
  const height = Math.ceil(graphHeight + titleHeight + padding * 2);
  const positions = new Map<string, Point>();

  layers.forEach((layer, layerIndex) => {
    const layerWidth =
      layer.length * decisionWidth +
      Math.max(0, layer.length - 1) * horizontalGap;
    const startX = (width - layerWidth) / 2 + decisionWidth / 2;
    const y =
      titleHeight +
      padding +
      decisionHeight / 2 +
      layerIndex * (decisionHeight + verticalGap);

    layer.forEach((node, nodeIndex) => {
      positions.set(node.id, {
        x: startX + nodeIndex * (decisionWidth + horizontalGap),
        y,
      });
    });
  });

  const nodesById = new Map(flowDiagram.nodes.map((node) => [node.id, node]));
  const edges = flowDiagram.edges
    .map((edge) => {
      const sourceNode = nodesById.get(edge.source);
      const targetNode = nodesById.get(edge.target);
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);

      if (!sourceNode || !targetNode || !source || !target) {
        return "";
      }

      const start = nodeBoundary(sourceNode, source, target);
      const end = nodeBoundary(targetNode, target, source);
      const middleY = (start.y + end.y) / 2;
      const labelX = (start.x + end.x) / 2;
      const labelY = middleY - 10;
      const label = wrapText(edge.label, 28, 1)[0] ?? "";

      return `<g class="edge">
  <path d="M ${number(start.x)} ${number(start.y)} C ${number(start.x)} ${number(middleY)}, ${number(end.x)} ${number(middleY)}, ${number(end.x)} ${number(end.y)}" marker-end="url(#arrowhead)" />
  <text x="${number(labelX)}" y="${number(labelY)}">${escapeXml(label)}</text>
</g>`;
    })
    .join("\n");

  const nodes = flowDiagram.nodes
    .map((node) => {
      const position = positions.get(node.id);

      if (!position) {
        return "";
      }

      const { width: nodeWidth, height: nodeHeight } = nodeSize(node);
      const labelLines = wrapText(node.label, 30, 2);
      const descriptionLines = wrapText(node.description, 38, 3);
      const labelStartY = position.y - 36;
      const descriptionStartY = position.y + 20;
      const labels = labelLines
        .map(
          (line, index) =>
            `<tspan x="${number(position.x)}" y="${number(labelStartY + index * 20)}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      const descriptions = descriptionLines
        .map(
          (line, index) =>
            `<tspan x="${number(position.x)}" y="${number(descriptionStartY + index * 18)}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      const shape =
        node.kind === "decision"
          ? `<path d="M ${number(position.x)} ${number(position.y - nodeHeight / 2)} L ${number(position.x + nodeWidth / 2)} ${number(position.y)} L ${number(position.x)} ${number(position.y + nodeHeight / 2)} L ${number(position.x - nodeWidth / 2)} ${number(position.y)} Z" />`
          : `<rect x="${number(position.x - nodeWidth / 2)}" y="${number(position.y - nodeHeight / 2)}" width="${nodeWidth}" height="${nodeHeight}" rx="${node.kind === "step" ? 16 : nodeHeight / 2}" />`;

      return `<g class="node node-${node.kind}">
  <title>${escapeXml(`${node.label}: ${node.description}`)}</title>
  ${shape}
  <text class="node-label">${labels}</text>
  <text class="node-description">${descriptions}</text>
</g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="flow-diagram-title">
  <title id="flow-diagram-title">${escapeXml(flowDiagram.title)}</title>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
    </marker>
    <style>
      .edge path { fill: none; stroke: #64748b; stroke-width: 2; }
      .edge text { fill: #334155; font: 13px system-ui, sans-serif; text-anchor: middle; paint-order: stroke; stroke: #f8fafc; stroke-width: 5px; stroke-linejoin: round; }
      .node rect, .node path { fill: #ffffff; stroke: #2563eb; stroke-width: 2; }
      .node-start rect { fill: #eff6ff; }
      .node-decision path { fill: #fff7ed; stroke: #ea580c; }
      .node-end rect { fill: #f0fdf4; stroke: #16a34a; }
      .node text { fill: #0f172a; font-family: system-ui, sans-serif; text-anchor: middle; }
      .node-label { font-size: 16px; font-weight: 700; }
      .node-description { font-size: 13px; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#f8fafc" />
  <text x="${number(width / 2)}" y="55" fill="#0f172a" font-family="system-ui, sans-serif" font-size="28" font-weight="700" text-anchor="middle">${escapeXml(flowDiagram.title)}</text>
  ${edges}
  ${nodes}
</svg>
`;
}
