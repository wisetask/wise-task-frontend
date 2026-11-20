import { graphFileName, type Graph, type GraphColor } from "@/entities/graph";
import { colorClass } from "./colors";
import { buildEdgeShapes, VERTEX_RADIUS } from "./geometry";
import { pointsArea } from "./viewport";

export const IMAGE_MARGIN = VERTEX_RADIUS * 4;

const BACKGROUND = "#ffffff";
const TEXT_COLOR = "#1f2328";
const MUTED_COLOR = "#59636e";
const COLORS: GraphColor[] = ["GRAY", "RED", "GREEN", "BLUE"];

interface ColorPair {
  fill: string;
  stroke: string;
}

const IMAGE_COLORS: Record<GraphColor, ColorPair> = {
  GRAY: { fill: "#e6e6e6", stroke: "#59636e" },
  RED: { fill: "#ffd8d3", stroke: "#cf222e" },
  GREEN: { fill: "#d2f4d9", stroke: "#1a7f37" },
  BLUE: { fill: "#d6e8ff", stroke: "#0550ae" },
};

export interface GraphImage {
  svg: string;
  width: number;
  height: number;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function arrowId(color: GraphColor): string {
  return "arrow-" + colorClass(color);
}

function arrowMarkers(): string[] {
  const lines: string[] = ["<defs>"];
  for (const color of COLORS) {
    lines.push(
      '<marker id="' +
        arrowId(color) +
        '" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="11" markerHeight="11"' +
        ' markerUnits="userSpaceOnUse" orient="auto">' +
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="' +
        IMAGE_COLORS[color].stroke +
        '"/></marker>',
    );
  }
  lines.push("</defs>");
  return lines;
}

export function graphToSvg(graph: Graph): GraphImage {
  let area = pointsArea(graph.vertices);
  if (area === null) {
    area = { left: 0, right: 0, top: 0, bottom: 0 };
  }
  const left = Math.floor(area.left - IMAGE_MARGIN);
  const top = Math.floor(area.top - IMAGE_MARGIN);
  const width = Math.ceil(area.right + IMAGE_MARGIN) - left;
  const height = Math.ceil(area.bottom + IMAGE_MARGIN) - top;

  const lines: string[] = [];
  lines.push(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      width +
      '" height="' +
      height +
      '" viewBox="' +
      left +
      " " +
      top +
      " " +
      width +
      " " +
      height +
      '" font-family="system-ui, sans-serif">',
  );
  lines.push(
    '<rect x="' +
      left +
      '" y="' +
      top +
      '" width="' +
      width +
      '" height="' +
      height +
      '" fill="' +
      BACKGROUND +
      '"/>',
  );
  if (graph.isDirected) {
    for (const line of arrowMarkers()) {
      lines.push(line);
    }
  }

  for (const shape of buildEdgeShapes(graph, VERTEX_RADIUS)) {
    let arrow = "";
    if (graph.isDirected) {
      arrow = ' marker-end="url(#' + arrowId(shape.color) + ')"';
    }
    lines.push(
      '<path d="' +
        shape.path +
        '" fill="none" stroke="' +
        IMAGE_COLORS[shape.color].stroke +
        '" stroke-width="2"' +
        arrow +
        "/>",
    );
    if (shape.text !== "") {
      lines.push(
        '<text x="' +
          shape.labelX +
          '" y="' +
          (shape.labelY + 4) +
          '" text-anchor="middle" font-size="13" fill="' +
          TEXT_COLOR +
          '" stroke="' +
          BACKGROUND +
          '" stroke-width="4" paint-order="stroke">' +
          escapeXml(shape.text) +
          "</text>",
      );
    }
  }

  for (const vertex of graph.vertices) {
    const colors = IMAGE_COLORS[vertex.color];
    lines.push(
      '<circle cx="' +
        vertex.x +
        '" cy="' +
        vertex.y +
        '" r="' +
        VERTEX_RADIUS +
        '" fill="' +
        colors.fill +
        '" stroke="' +
        colors.stroke +
        '" stroke-width="2"/>',
    );
    lines.push(
      '<text x="' +
        vertex.x +
        '" y="' +
        (vertex.y + 5) +
        '" text-anchor="middle" font-size="14" fill="' +
        TEXT_COLOR +
        '">' +
        escapeXml(vertex.label) +
        "</text>",
    );
    if (vertex.weight !== 0) {
      lines.push(
        '<text x="' +
          (vertex.x + VERTEX_RADIUS + 4) +
          '" y="' +
          (vertex.y - VERTEX_RADIUS + 6) +
          '" font-size="12" fill="' +
          MUTED_COLOR +
          '">' +
          vertex.weight +
          "</text>",
      );
    }
  }

  lines.push("</svg>");
  return { svg: lines.join("\n"), width: width, height: height };
}

export function imageFileName(graph: Graph, extension: string): string {
  return graphFileName(graph).replace(/\.json$/, "." + extension);
}
