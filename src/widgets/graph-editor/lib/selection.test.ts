import { describe, expect, it } from "vitest";
import {
  addEdge,
  addVertex,
  createEmptyGraph,
  removeVertex,
  updateVertex,
  type Graph,
} from "@/entities/graph";
import {
  commonColor,
  isSelected,
  isSelectionValid,
  makeSelection,
  paintSelected,
  removeSelected,
  selectAll,
  selectInArea,
  toggleSelected,
  verticesToMove,
} from "./selection";

function triangleWithTail(): Graph {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 0, 0);
  graph = addVertex(graph, 100, 0);
  graph = addVertex(graph, 50, 80);
  graph = addVertex(graph, 300, 300);
  const ids = graph.vertices.map((vertex) => vertex.id);
  graph = addEdge(graph, ids[0], ids[1]);
  graph = addEdge(graph, ids[1], ids[2]);
  graph = addEdge(graph, ids[2], ids[0]);
  graph = addEdge(graph, ids[2], ids[3]);
  return graph;
}

describe("editor selection", () => {
  it("checks that the selected vertex or edge still exists", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const vertexId = graph.vertices[0].id;
    const edgeId = graph.edges[0].id;
    expect(isSelectionValid(graph, { kind: "vertex", id: vertexId })).toBe(true);
    expect(isSelectionValid(graph, { kind: "edge", id: edgeId })).toBe(true);
    expect(isSelectionValid(graph, null)).toBe(false);
    graph = removeVertex(graph, vertexId);
    expect(isSelectionValid(graph, { kind: "vertex", id: vertexId })).toBe(false);
    expect(isSelectionValid(graph, { kind: "edge", id: edgeId })).toBe(false);
  });

  it("checks every item of a group", () => {
    const graph = triangleWithTail();
    const group = makeSelection([graph.vertices[0].id, graph.vertices[1].id], []);
    expect(isSelectionValid(graph, group)).toBe(true);
    const smaller = removeVertex(graph, graph.vertices[1].id);
    expect(isSelectionValid(smaller, group)).toBe(false);
  });

  it("tells whether an item is selected", () => {
    const selection = { kind: "edge" as const, id: "e1" };
    expect(isSelected(selection, "edge", "e1")).toBe(true);
    expect(isSelected(selection, "vertex", "e1")).toBe(false);
    expect(isSelected(null, "edge", "e1")).toBe(false);
    const group = makeSelection(["v1", "v2"], ["e1"]);
    expect(isSelected(group, "vertex", "v2")).toBe(true);
    expect(isSelected(group, "edge", "e1")).toBe(true);
    expect(isSelected(group, "vertex", "v3")).toBe(false);
  });

  it("turns a single item into a plain selection, not a group", () => {
    expect(makeSelection([], [])).toBeNull();
    expect(makeSelection(["v1"], [])).toEqual({ kind: "vertex", id: "v1" });
    expect(makeSelection([], ["e1"])).toEqual({ kind: "edge", id: "e1" });
    expect(makeSelection(["v1", "v2"], [])).toEqual({
      kind: "group",
      vertexIds: ["v1", "v2"],
      edgeIds: [],
    });
  });

  it("adds and removes items with Shift+click", () => {
    let selection = toggleSelected(null, "vertex", "v1");
    expect(selection).toEqual({ kind: "vertex", id: "v1" });
    selection = toggleSelected(selection, "vertex", "v2");
    expect(isSelected(selection, "vertex", "v1")).toBe(true);
    expect(isSelected(selection, "vertex", "v2")).toBe(true);
    selection = toggleSelected(selection, "vertex", "v1");
    expect(selection).toEqual({ kind: "vertex", id: "v2" });
    selection = toggleSelected(selection, "vertex", "v2");
    expect(selection).toBeNull();
  });

  it("selects vertices inside the frame and edges between them", () => {
    const graph = triangleWithTail();
    const selection = selectInArea(graph, { left: -10, top: -10, right: 120, bottom: 100 });
    expect(selection).toEqual({
      kind: "group",
      vertexIds: [graph.vertices[0].id, graph.vertices[1].id, graph.vertices[2].id],
      edgeIds: [graph.edges[0].id, graph.edges[1].id, graph.edges[2].id],
    });
  });

  it("selects nothing with an empty frame", () => {
    const graph = triangleWithTail();
    expect(selectInArea(graph, { left: 500, top: 500, right: 600, bottom: 600 })).toBeNull();
  });

  it("selects everything", () => {
    const graph = triangleWithTail();
    const selection = selectAll(graph);
    expect(isSelected(selection, "vertex", graph.vertices[3].id)).toBe(true);
    expect(isSelected(selection, "edge", graph.edges[3].id)).toBe(true);
    expect(selectAll(createEmptyGraph(false))).toBeNull();
  });

  it("drags the whole group only when the grabbed vertex is in it", () => {
    const group = makeSelection(["v1", "v2"], []);
    expect(verticesToMove(group, "v1")).toEqual(["v1", "v2"]);
    expect(verticesToMove(group, "v3")).toEqual(["v3"]);
    expect(verticesToMove(null, "v3")).toEqual(["v3"]);
  });

  it("deletes the selected vertices and edges", () => {
    const graph = triangleWithTail();
    const group = makeSelection([graph.vertices[0].id], [graph.edges[3].id]);
    const result = removeSelected(graph, group);
    expect(result.vertices.length).toBe(3);
    expect(result.edges.map((edge) => edge.id)).toEqual([graph.edges[1].id]);
  });

  it("paints the group and finds its common color", () => {
    const graph = triangleWithTail();
    const group = makeSelection([graph.vertices[0].id, graph.vertices[1].id], [graph.edges[0].id]);
    expect(commonColor(graph, group)).toBe("GRAY");
    const painted = paintSelected(graph, group, "RED");
    expect(commonColor(painted, group)).toBe("RED");
    expect(painted.vertices[2].color).toBe("GRAY");
    const mixed = updateVertex(painted, graph.vertices[0].id, { color: "BLUE" });
    expect(commonColor(mixed, group)).toBeNull();
    expect(commonColor(graph, null)).toBeNull();
  });
});
