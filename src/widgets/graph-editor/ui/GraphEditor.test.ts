// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import type { EditorTool } from "../lib/selection";
import GraphEditor from "./GraphEditor.vue";

enableAutoUnmount(afterEach);

function mountEditor(graph: Graph, tool: EditorTool, readonly = false) {
  const wrapper = mount(GraphEditor, {
    attachTo: document.body,
    props: {
      graph: graph,
      tool: tool,
      readonly: readonly,
      "onUpdate:graph": (value: Graph) => wrapper.setProps({ graph: value }),
      "onUpdate:tool": (value: EditorTool) => wrapper.setProps({ tool: value }),
    },
  });
  return wrapper;
}

type EditorWrapper = ReturnType<typeof mountEditor>;

function graphOf(wrapper: EditorWrapper): Graph {
  return wrapper.props("graph");
}

function threeVertices(): Graph {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 100, 100);
  graph = addVertex(graph, 300, 100);
  graph = addVertex(graph, 200, 250);
  return graph;
}

async function press(code: string, ctrl: boolean) {
  window.dispatchEvent(new KeyboardEvent("keydown", { code: code, ctrlKey: ctrl }));
  await flushPromises();
}

async function clickVertex(wrapper: EditorWrapper, index: number, ctrl: boolean) {
  await wrapper.findAll(".graph-vertex")[index].trigger("click", { ctrlKey: ctrl });
  await flushPromises();
}

function panelTitle(wrapper: EditorWrapper): string {
  return wrapper.find(".graph-properties__title").text();
}

describe("graph editor", () => {
  it("adds a vertex where you click with the vertex tool", async () => {
    const wrapper = mountEditor(createEmptyGraph(false), "vertex");
    await wrapper.find("svg.graph-canvas__svg").trigger("click", { clientX: 120, clientY: 80 });
    await flushPromises();
    const graph = graphOf(wrapper);
    expect(graph.vertices.length).toBe(1);
    expect(graph.vertices[0].x).toBe(120);
    expect(graph.vertices[0].y).toBe(80);
    expect(wrapper.findAll(".graph-vertex").length).toBe(1);
  });

  it("switches tools with the number keys and H", async () => {
    const wrapper = mountEditor(createEmptyGraph(false), "vertex");
    await press("Digit3", false);
    expect(wrapper.props("tool")).toBe("edge");
    await press("KeyH", false);
    expect(wrapper.props("tool")).toBe("pan");
    await press("Digit1", false);
    expect(wrapper.props("tool")).toBe("select");
  });

  it("connects two vertices with the edge tool", async () => {
    const wrapper = mountEditor(threeVertices(), "edge");
    await clickVertex(wrapper, 0, false);
    await clickVertex(wrapper, 2, false);
    const graph = graphOf(wrapper);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe(graph.vertices[0].id);
    expect(graph.edges[0].target).toBe(graph.vertices[2].id);
  });

  it("undoes and redoes with Ctrl+Z and Ctrl+Y", async () => {
    const wrapper = mountEditor(createEmptyGraph(false), "vertex");
    await wrapper.find("svg.graph-canvas__svg").trigger("click", { clientX: 50, clientY: 50 });
    await flushPromises();
    expect(graphOf(wrapper).vertices.length).toBe(1);
    await press("KeyZ", true);
    expect(graphOf(wrapper).vertices.length).toBe(0);
    await press("KeyY", true);
    expect(graphOf(wrapper).vertices.length).toBe(1);
  });

  it("selects several vertices with Ctrl+click and deletes them with Delete", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 0, false);
    await clickVertex(wrapper, 1, true);
    expect(panelTitle(wrapper)).toBe("Выбрано: 2 вершины");
    await clickVertex(wrapper, 1, true);
    expect(panelTitle(wrapper)).not.toContain("Выбрано");
    await clickVertex(wrapper, 2, true);
    await press("Delete", false);
    const graph = graphOf(wrapper);
    expect(graph.vertices.length).toBe(1);
    expect(graph.vertices[0].x).toBe(300);
  });

  it("selects vertices inside a frame", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    const svg = wrapper.find("svg.graph-canvas__svg");
    await svg.trigger("pointerdown", { button: 0, clientX: 50, clientY: 50 });
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 150 }));
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 350, clientY: 150 }));
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 350, clientY: 150 }));
    await flushPromises();
    expect(panelTitle(wrapper)).toBe("Выбрано: 2 вершины");
  });

  it("selects everything with Ctrl+A", async () => {
    let graph = threeVertices();
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const wrapper = mountEditor(graph, "select");
    await press("KeyA", true);
    expect(panelTitle(wrapper)).toBe("Выбрано: 3 вершины, 1 ребро");
    await press("Escape", false);
    expect(panelTitle(wrapper)).not.toContain("Выбрано");
  });

  it("lays the graph out from the context menu and undoes it in one step", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    const before = graphOf(wrapper);
    await wrapper
      .find("svg.graph-canvas__svg")
      .trigger("contextmenu", { clientX: 10, clientY: 10 });
    await flushPromises();
    await wrapper.find(".graph-menu__group").trigger("mouseenter");
    const circle = wrapper
      .findAll(".graph-menu__submenu .graph-menu__item")
      .filter((button) => button.text() === "По кругу");
    expect(circle.length).toBe(1);
    await circle[0].trigger("click");
    await flushPromises();
    expect(graphOf(wrapper).vertices[0]).not.toEqual(before.vertices[0]);
    expect(wrapper.find(".graph-menu").exists()).toBe(false);
    await press("KeyZ", true);
    expect(graphOf(wrapper).vertices).toEqual(before.vertices);
  });

  it("does not accept a fractional weight", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 0, false);
    const weightInput = wrapper.findAll(".ui-text-field__input")[1];
    await weightInput.setValue("2,5");
    expect(wrapper.text()).toContain("Нужно целое число");
    expect(graphOf(wrapper).vertices[0].weight).toBe(0);
    await weightInput.setValue("4");
    await flushPromises();
    expect(graphOf(wrapper).vertices[0].weight).toBe(4);
  });

  it("only shows the graph in view-only mode", async () => {
    const wrapper = mountEditor(threeVertices(), "vertex", true);
    expect(wrapper.find(".graph-toolbar").exists()).toBe(false);
    expect(wrapper.find(".graph-properties").exists()).toBe(false);
    await wrapper.find("svg.graph-canvas__svg").trigger("click", { clientX: 20, clientY: 20 });
    await press("Digit2", false);
    await press("Delete", false);
    expect(wrapper.emitted("update:graph")).toBeUndefined();
    expect(wrapper.emitted("update:tool")).toBeUndefined();
  });

  it("hides and shows the properties panel", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await wrapper.find(".graph-editor__collapse").trigger("click");
    expect(wrapper.find(".graph-properties").exists()).toBe(false);
    await clickVertex(wrapper, 0, false);
    await wrapper.find(".graph-editor__collapse").trigger("click");
    expect(wrapper.find(".graph-properties").exists()).toBe(true);
    expect(panelTitle(wrapper)).not.toBe("Свойства");
  });

  it("copies and pastes the selection and undoes the paste in one step", async () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 100, 100);
    graph = addVertex(graph, 200, 100);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const wrapper = mountEditor(graph, "select");
    await press("KeyA", true);
    await press("KeyC", true);
    await press("KeyV", true);
    expect(graphOf(wrapper).vertices.length).toBe(4);
    expect(graphOf(wrapper).edges.length).toBe(2);
    expect(graphOf(wrapper).vertices[2].x).toBe(140);
    expect(panelTitle(wrapper)).toBe("Выбрано: 2 вершины, 1 ребро");
    await press("KeyZ", true);
    expect(graphOf(wrapper).vertices.length).toBe(2);
    expect(graphOf(wrapper).edges.length).toBe(1);
  });

  it("shifts every next paste further", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 0, false);
    await press("KeyC", true);
    await press("KeyV", true);
    await press("KeyV", true);
    const vertices = graphOf(wrapper).vertices;
    expect(vertices.length).toBe(5);
    expect(vertices[3].x).toBe(140);
    expect(vertices[4].x).toBe(180);
    expect(vertices.map((vertex) => vertex.label)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("cuts the selection and pastes it back", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 2, false);
    await press("KeyX", true);
    expect(graphOf(wrapper).vertices.length).toBe(2);
    await press("KeyV", true);
    expect(graphOf(wrapper).vertices.length).toBe(3);
    expect(graphOf(wrapper).vertices[2].x).toBe(240);
  });

  it("duplicates the selection with Ctrl+D", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 1, false);
    await press("KeyD", true);
    expect(graphOf(wrapper).vertices.length).toBe(4);
    expect(graphOf(wrapper).vertices[3].x).toBe(340);
  });

  it("pastes under the mouse when it is over the canvas", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 0, false);
    await press("KeyC", true);
    const svg = wrapper.find("svg.graph-canvas__svg");
    await svg.trigger("pointermove", { clientX: 500, clientY: 400 });
    await press("KeyV", true);
    await press("KeyV", true);
    const vertices = graphOf(wrapper).vertices;
    expect(vertices[3].x).toBe(500);
    expect(vertices[3].y).toBe(400);
    expect(vertices[4].x).toBe(540);
    expect(vertices[4].y).toBe(440);
    await svg.trigger("pointermove", { clientX: 50, clientY: 60 });
    await press("KeyV", true);
    expect(graphOf(wrapper).vertices[5].x).toBe(50);
    expect(graphOf(wrapper).vertices[5].y).toBe(60);
  });
});
