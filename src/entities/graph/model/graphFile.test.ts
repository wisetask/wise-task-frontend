import { describe, expect, it } from "vitest";
import { graphFileName, graphFromFileText, graphToFileText } from "./graphFile";
import { addEdge, addVertex, createEmptyGraph, updateVertex } from "./operations";
import type { Graph } from "./types";

function sampleGraph(): Graph {
  let graph = createEmptyGraph(true);
  graph = addVertex(graph, 10, 20);
  graph = addVertex(graph, 110, 20);
  graph = updateVertex(graph, graph.vertices[1].id, { color: "RED", weight: 3 });
  graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
  return {
    name: "Мой граф",
    isDirected: graph.isDirected,
    vertices: graph.vertices,
    edges: graph.edges,
  };
}

describe("graph files", () => {
  it("writes the graph in the backend format", () => {
    const data = JSON.parse(graphToFileText(sampleGraph()));
    expect(data.isDirect).toBe(true);
    expect(data.name).toBe("Мой граф");
    expect(data.vertexCount).toBe(2);
    expect(data.vertexList[1]).toEqual({
      id: 2,
      weight: 3,
      label: "2",
      xCoordinate: 110,
      yCoordinate: 20,
      color: "RED",
    });
    expect(data.edgeList[0].source).toBe(1);
    expect(data.edgeList[0].target).toBe(2);
  });

  it("reads back what it wrote", () => {
    const graph = sampleGraph();
    const result = graphFromFileText(graphToFileText(graph));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.skippedEdges).toBe(0);
      expect(result.graph.name).toBe("Мой граф");
      expect(result.graph.isDirected).toBe(true);
      expect(result.graph.vertices.map((vertex) => vertex.x)).toEqual([10, 110]);
      expect(result.graph.vertices[1].color).toBe("RED");
      expect(result.graph.edges.length).toBe(1);
    }
  });

  it("explains what is wrong with a bad file", () => {
    expect(graphFromFileText("not json")).toEqual({
      ok: false,
      error: "Файл не похож на JSON. Откройте файл, который скачали из редактора.",
    });
    const noLists = graphFromFileText('{"vertices": []}');
    expect(noLists.ok).toBe(false);
    const badVertex = graphFromFileText('{"vertexList": [{"id": 1}, {"id": "x"}], "edgeList": []}');
    expect(badVertex).toEqual({ ok: false, error: "Вершина № 2 без числового id." });
    const badEdge = graphFromFileText('{"vertexList": [], "edgeList": [{"source": 1}]}');
    expect(badEdge).toEqual({ ok: false, error: "Ребро № 1 без числовых source и target." });
  });

  it("counts edges it had to skip", () => {
    const text = JSON.stringify({
      isDirect: false,
      vertexList: [{ id: 1 }, { id: 2 }],
      edgeList: [
        { source: 1, target: 2 },
        { source: 2, target: 1 },
        { source: 1, target: 5 },
      ],
    });
    const result = graphFromFileText(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.edges.length).toBe(1);
      expect(result.skippedEdges).toBe(2);
    }
  });

  it("names the file after the graph", () => {
    expect(graphFileName(sampleGraph())).toBe("Мой граф.json");
    expect(graphFileName(createEmptyGraph(false))).toBe("graph.json");
    const strange = createEmptyGraph(false);
    expect(
      graphFileName({ name: "a/b:c", isDirected: false, vertices: [], edges: strange.edges }),
    ).toBe("a_b_c.json");
  });
});
