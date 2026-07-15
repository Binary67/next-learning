import type { ConceptMap } from "./concept-map";

const nodeWidth = 260;
const nodeHeight = 150;

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

function rectangleBoundary(from: Point, to: Point) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  if (deltaX === 0 && deltaY === 0) {
    return { x: from.x, y: from.y - nodeHeight / 2 };
  }

  const horizontalScale =
    deltaX === 0 ? Number.POSITIVE_INFINITY : nodeWidth / 2 / Math.abs(deltaX);
  const verticalScale =
    deltaY === 0
      ? Number.POSITIVE_INFINITY
      : nodeHeight / 2 / Math.abs(deltaY);
  const scale = Math.min(horizontalScale, verticalScale);

  return {
    x: from.x + deltaX * scale,
    y: from.y + deltaY * scale,
  };
}

function number(value: number) {
  return value.toFixed(1);
}

export function renderConceptMapSvg(conceptMap: ConceptMap) {
  const padding = 80;
  const titleHeight = 90;
  const radius =
    conceptMap.nodes.length === 1
      ? 0
      : Math.max(
          260,
          (conceptMap.nodes.length * (nodeWidth + 80)) / (2 * Math.PI),
        );
  const graphWidth = radius * 2 + nodeWidth + padding * 2;
  const graphHeight = radius * 2 + nodeHeight + padding * 2;
  const width = Math.ceil(graphWidth);
  const height = Math.ceil(graphHeight + titleHeight);
  const centerX = graphWidth / 2;
  const centerY = titleHeight + graphHeight / 2;
  const positions = new Map<string, Point>();

  conceptMap.nodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / conceptMap.nodes.length;

    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  const edges = conceptMap.edges
    .map((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);

      if (!source || !target) {
        return "";
      }

      if (edge.source === edge.target) {
        const top = source.y - nodeHeight / 2;

        return `<g class="edge">
  <path d="M ${number(source.x + 45)} ${number(top)} C ${number(source.x + 120)} ${number(top - 95)}, ${number(source.x - 120)} ${number(top - 95)}, ${number(source.x - 45)} ${number(top)}" marker-end="url(#arrowhead)" />
  <text x="${number(source.x)}" y="${number(top - 82)}">${escapeXml(edge.label)}</text>
</g>`;
      }

      const start = rectangleBoundary(source, target);
      const end = rectangleBoundary(target, source);
      const labelX = (start.x + end.x) / 2;
      const labelY = (start.y + end.y) / 2 - 8;

      return `<g class="edge">
  <path d="M ${number(start.x)} ${number(start.y)} L ${number(end.x)} ${number(end.y)}" marker-end="url(#arrowhead)" />
  <text x="${number(labelX)}" y="${number(labelY)}">${escapeXml(edge.label)}</text>
</g>`;
    })
    .join("\n");

  const nodes = conceptMap.nodes
    .map((node) => {
      const position = positions.get(node.id);

      if (!position) {
        return "";
      }

      const labelLines = wrapText(node.label, 30, 2);
      const descriptionLines = wrapText(node.description, 38, 3);
      const labelStartY = position.y - 43;
      const descriptionStartY = position.y + 15;
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

      return `<g class="node">
  <title>${escapeXml(`${node.label}: ${node.description}`)}</title>
  <rect x="${number(position.x - nodeWidth / 2)}" y="${number(position.y - nodeHeight / 2)}" width="${nodeWidth}" height="${nodeHeight}" rx="16" />
  <text class="node-label">${labels}</text>
  <line x1="${number(position.x - nodeWidth / 2 + 20)}" y1="${number(position.y + 1)}" x2="${number(position.x + nodeWidth / 2 - 20)}" y2="${number(position.y + 1)}" />
  <text class="node-description">${descriptions}</text>
</g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="concept-map-title">
  <title id="concept-map-title">${escapeXml(conceptMap.title)}</title>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
    </marker>
    <style>
      .edge path { fill: none; stroke: #64748b; stroke-width: 2; }
      .edge text { fill: #334155; font: 13px system-ui, sans-serif; text-anchor: middle; paint-order: stroke; stroke: #f8fafc; stroke-width: 5px; stroke-linejoin: round; }
      .node rect { fill: #ffffff; stroke: #2563eb; stroke-width: 2; }
      .node line { stroke: #dbeafe; stroke-width: 1; }
      .node text { fill: #0f172a; font-family: system-ui, sans-serif; text-anchor: middle; }
      .node-label { font-size: 16px; font-weight: 700; }
      .node-description { font-size: 13px; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#f8fafc" />
  <text x="${number(centerX)}" y="52" fill="#0f172a" font-family="system-ui, sans-serif" font-size="28" font-weight="700" text-anchor="middle">${escapeXml(conceptMap.title)}</text>
  ${edges}
  ${nodes}
</svg>
`;
}
