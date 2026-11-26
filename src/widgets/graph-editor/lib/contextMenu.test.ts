import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, updateVertex } from "@/entities/graph";
import { makeSelection } from "./selection";
import {
  buildMenuItems,
  hasColorChoice,
  menuHeight,
  menuHint,
  menuTitle,
  neighborNames,
  vertexSummary,
  layoutOfAction,
  MENU_WIDTH,
  menuPosition,
  submenuOnLeft,
  targetColor,
} from "./contextMenu";
import { allowEverything } from "./rules";

function actionsOf(items: { action: string }[]): string[] {
  const actions: string[] = [];
  for (const item of items) {
    actions.push(item.action);
  }
  return actions;
}

describe("editor context menu", () => {
  it("offers renaming, a loop and deletion for a vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const id = graph.vertices[0].id;
    expect(actionsOf(buildMenuItems(graph, { kind: "vertex", id: id }))).toEqual([
      "rename",
      "add-loop",
      "delete",
    ]);
  });

  it("does not offer a second loop", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const id = graph.vertices[0].id;
    graph = addEdge(graph, id, id);
    expect(actionsOf(buildMenuItems(graph, { kind: "vertex", id: id }))).toEqual([
      "rename",
      "delete",
    ]);
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

  it("puts the layouts that fit the graph into a submenu", () => {
    let graph = createEmptyGraph(false);
    for (let i = 0; i < 4; i++) {
      graph = addVertex(graph, i * 10, 0);
    }
    const ids = graph.vertices.map((vertex) => vertex.id);
    graph = addEdge(graph, ids[0], ids[1]);
    graph = addEdge(graph, ids[1], ids[2]);
    const square = addEdge(addEdge(graph, ids[2], ids[3]), ids[3], ids[0]);
    const items = buildMenuItems(square, { kind: "canvas", x: 0, y: 0 });
    expect(actionsOf(items)).toEqual(["add-vertex", "layout", "fit-view", "reset-zoom"]);
    expect(actionsOf(items[1].submenu)).toEqual([
      "layout-auto",
      "layout-circle",
      "layout-grid",
      "layout-levels",
      "layout-bipartite",
    ]);
    expect(items[0].submenu).toEqual([]);
    const triangle = addEdge(graph, ids[2], ids[0]);
    const triangleItems = buildMenuItems(triangle, { kind: "canvas", x: 0, y: 0 });
    expect(actionsOf(triangleItems[1].submenu).includes("layout-bipartite")).toBe(false);
  });

  it("has no layout submenu for a single vertex", () => {
    const graph = addVertex(createEmptyGraph(false), 0, 0);
    const items = buildMenuItems(graph, { kind: "canvas", x: 0, y: 0 });
    expect(actionsOf(items).includes("layout")).toBe(false);
  });

  it("opens the submenu to the left near the right edge", () => {
    expect(submenuOnLeft(100, 800)).toBe(false);
    expect(submenuOnLeft(500, 800)).toBe(true);
  });

  it("knows which layout each menu item means", () => {
    expect(layoutOfAction("layout-levels")).toBe("levels");
    expect(layoutOfAction("fit-view")).toBeNull();
  });

  it("leaves out what the task rules forbid", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    const rules = allowEverything();
    rules.canAdd = false;
    rules.canMove = false;
    rules.canEditLabels = false;
    const vertexItems = buildMenuItems(graph, { kind: "vertex", id: graph.vertices[0].id }, rules);
    expect(actionsOf(vertexItems)).toEqual(["delete"]);
    const canvasItems = buildMenuItems(graph, { kind: "canvas", x: 0, y: 0 }, rules);
    expect(actionsOf(canvasItems)).toEqual(["fit-view", "reset-zoom"]);
    rules.canColor = false;
    expect(hasColorChoice({ kind: "vertex", id: graph.vertices[0].id }, rules)).toBe(false);
  });

  it("names the vertex, its degree and neighbours in the menu title", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addVertex(graph, 100, 0);
    const first = graph.vertices[0].id;
    graph = addEdge(graph, first, graph.vertices[1].id);
    graph = addEdge(graph, first, graph.vertices[2].id);
    graph = addEdge(graph, first, first);
    expect(neighborNames(graph, first)).toEqual(["2", "3"]);
    expect(menuTitle(graph, { kind: "vertex", id: first })).toBe(
      "Вершина 1 · степень 4 · соседи 2, 3",
    );
    expect(menuTitle(graph, { kind: "vertex", id: graph.vertices[1].id })).toBe(
      "Вершина 2 · степень 1 · соседи 1",
    );
    expect(menuTitle(graph, { kind: "canvas", x: 0, y: 0 })).toBe("");
    expect(vertexSummary(graph, graph.vertices[2].id)).toBe("степень 1 · соседи 1");
  });

  it("names an edge by its ends", () => {
    let graph = createEmptyGraph(true);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    expect(menuTitle(graph, { kind: "edge", id: graph.edges[0].id })).toBe("Ребро 1 → 2");
  });

  it("shows hotkeys next to menu items", () => {
    expect(menuHint("delete")).toBe("Delete");
    expect(menuHint("rename")).toBe("F2");
    expect(menuHint("add-loop")).toBe("");
    expect(menuHeight(2, false, true)).toBeGreaterThan(menuHeight(2, false));
  });
});
