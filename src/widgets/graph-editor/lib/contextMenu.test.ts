import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, updateVertex } from "@/entities/graph";
import { makeSelection } from "./selection";
import {
  buildMenuItems,
  hasColorChoice,
  MENU_WIDTH,
  menuPosition,
  targetColor,
} from "./contextMenu";

function actionsOf(items: { action: string }[]): string[] {
  const actions: string[] = [];
  for (const item of items) {
    actions.push(item.action);
  }
  return actions;
}

describe("editor context menu", () => {
  it("offers a loop and deletion for a vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const id = graph.vertices[0].id;
    expect(actionsOf(buildMenuItems(graph, { kind: "vertex", id: id }))).toEqual([
      "add-loop",
      "delete",
    ]);
  });

  it("does not offer a second loop", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const id = graph.vertices[0].id;
    graph = addEdge(graph, id, id);
    expect(actionsOf(buildMenuItems(graph, { kind: "vertex", id: id }))).toEqual(["delete"]);
  });

  it("offers a vertex and zoom reset on an empty place", () => {
    const items = buildMenuItems(createEmptyGraph(false), { kind: "canvas", x: 5, y: 5 });
    expect(actionsOf(items)).toEqual(["add-vertex", "reset-zoom"]);
    expect(hasColorChoice({ kind: "canvas", x: 5, y: 5 })).toBe(false);
    expect(hasColorChoice({ kind: "edge", id: "e1" })).toBe(true);
  });

  it("offers to show the whole graph when there are vertices", () => {
    const graph = addVertex(createEmptyGraph(false), 0, 0);
    const items = buildMenuItems(graph, { kind: "canvas", x: 5, y: 5 });
    expect(actionsOf(items)).toEqual(["add-vertex", "fit-view", "reset-zoom"]);
  });

  it("opens the menu to the left and up near the edges of the canvas", () => {
    expect(menuPosition(10, 10, 100, 800, 600)).toEqual({ left: 10, top: 10 });
    expect(menuPosition(790, 590, 100, 800, 600)).toEqual({ left: 790 - MENU_WIDTH, top: 490 });
  });

  it("knows the color of the vertex or edge under the menu", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const id = graph.vertices[0].id;
    graph = updateVertex(graph, id, { color: "BLUE" });
    expect(targetColor(graph, { kind: "vertex", id: id }, null)).toBe("BLUE");
    expect(targetColor(graph, { kind: "vertex", id: "missing" }, null)).toBeNull();
    expect(targetColor(graph, { kind: "canvas", x: 0, y: 0 }, null)).toBeNull();
  });

  it("offers to delete or paint a selected group", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    const group = makeSelection([graph.vertices[0].id, graph.vertices[1].id], []);
    expect(actionsOf(buildMenuItems(graph, { kind: "group" }))).toEqual(["delete"]);
    expect(hasColorChoice({ kind: "group" })).toBe(true);
    expect(targetColor(graph, { kind: "group" }, group)).toBe("GRAY");
  });

  it("only offers zoom in the view-only mode", () => {
    const graph = addVertex(createEmptyGraph(false), 0, 0);
    expect(actionsOf(buildMenuItems(graph, { kind: "view" }))).toEqual(["fit-view", "reset-zoom"]);
    expect(hasColorChoice({ kind: "view" })).toBe(false);
  });
});
