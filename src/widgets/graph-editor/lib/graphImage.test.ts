import { describe, expect, it } from "vitest";
import {
  addEdge,
  addVertex,
  createEmptyGraph,
  updateEdge,
  updateVertex,
  type Graph,
} from "@/entities/graph";
import { escapeXml, graphToSvg, IMAGE_MARGIN, imageFileName } from "./graphImage";

function count(text: string, part: string): number {
  return text.split(part).length - 1;
}

function twoVertices(isDirected: boolean): Graph {
  let graph = createEmptyGraph(isDirected);
  graph = addVertex(graph, 100, 50);
  graph = addVertex(graph, 300, 150);
  return addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
}

describe("graph image", () => {
  it("crops the picture to the graph with a margin", () => {
    const image = graphToSvg(twoVertices(false));
    expect(image.width).toBe(200 + IMAGE_MARGIN * 2);
    expect(image.height).toBe(100 + IMAGE_MARGIN * 2);
    const viewBox = 100 - IMAGE_MARGIN + " " + (50 - IMAGE_MARGIN);
    expect(image.svg).toContain('viewBox="' + viewBox + " " + image.width);
  });

  it("draws every vertex and edge", () => {
    const svg = graphToSvg(twoVertices(false)).svg;
    expect(count(svg, "<circle")).toBe(2);
    expect(count(svg, "<path")).toBe(1);
    expect(svg).not.toContain("marker");
  });

  it("adds arrows only to a directed graph", () => {
    const svg = graphToSvg(twoVertices(true)).svg;
    expect(svg).toContain('marker-end="url(#arrow-gray)"');
    expect(count(svg, "<marker")).toBe(4);
  });

  it("uses the colors, weights and labels of the graph", () => {
    let graph = twoVertices(false);
    graph = updateVertex(graph, graph.vertices[0].id, { color: "RED", weight: 7 });
    graph = updateEdge(graph, graph.edges[0].id, { label: "a<b", weight: 3 });
    const svg = graphToSvg(graph).svg;
    expect(svg).toContain('stroke="#cf222e"');
    expect(svg).toContain(">7</text>");
    expect(svg).toContain(">a&lt;b · 3</text>");
  });

  it("makes a small blank picture for an empty graph", () => {
    const image = graphToSvg(createEmptyGraph(false));
    expect(image.width).toBe(IMAGE_MARGIN * 2);
    expect(image.svg).not.toContain("<circle");
  });

  it("escapes text for XML", () => {
    expect(escapeXml('1 < 2 & "x" > 0')).toBe("1 &lt; 2 &amp; &quot;x&quot; &gt; 0");
  });

  it("names the picture after the graph", () => {
    const graph = createEmptyGraph(false);
    expect(imageFileName(graph, "png")).toBe("graph.png");
    graph.name = "Дерево";
    expect(imageFileName(graph, "svg")).toBe("Дерево.svg");
  });
});
