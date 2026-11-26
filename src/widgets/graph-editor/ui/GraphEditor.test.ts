// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import type { EditorRules } from "../lib/rules";
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

function taskRules(): EditorRules {
  return {
    canAdd: false,
    canDelete: false,
    canEditLabels: false,
    canColor: true,
    canMove: true,
    direction: "undirected",
  };
}

function mountWithRules(graph: Graph, tool: EditorTool, rules: EditorRules) {
  const wrapper = mount(GraphEditor, {
    attachTo: document.body,
    props: {
      graph: graph,
      tool: tool,
      rules: rules,
      "onUpdate:graph": (value: Graph) => wrapper.setProps({ graph: value }),
      "onUpdate:tool": (value: EditorTool) => wrapper.setProps({ tool: value }),
    },
  });
  return wrapper;
}

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

async function pressWith(code: string, shift: boolean, repeat: boolean) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code: code, shiftKey: shift, repeat: repeat }),
  );
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

  it("lays out a chain automatically and restores it with one undo", async () => {
    let graph = threeVertices();
    const [first, second, third] = graph.vertices;
    graph = addEdge(graph, first.id, second.id);
    graph = addEdge(graph, second.id, third.id);
    const wrapper = mountEditor(graph, "select");

    await wrapper
      .find("svg.graph-canvas__svg")
      .trigger("contextmenu", { clientX: 10, clientY: 10 });
    await flushPromises();
    await wrapper.find(".graph-menu__group").trigger("mouseenter");
    const auto = wrapper.findAll(".graph-menu__submenu .graph-menu__item")[0];
    expect(auto.text()).toBe("Автоматически");
    await auto.trigger("click");
    await flushPromises();

    const heights = graphOf(wrapper).vertices.map((vertex) => vertex.y);
    expect(new Set(heights).size).toBe(1);
    await press("KeyZ", true);
    expect(graphOf(wrapper)).toEqual(graph);
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

  it("moves the selected vertices with arrows and undoes a held key in one step", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await clickVertex(wrapper, 0, false);
    await clickVertex(wrapper, 1, true);
    await pressWith("ArrowRight", false, false);
    await pressWith("ArrowDown", true, false);
    let vertices = graphOf(wrapper).vertices;
    expect(vertices[0].x).toBe(101);
    expect(vertices[1].x).toBe(301);
    expect(vertices[1].y).toBe(110);
    expect(vertices[2].x).toBe(200);
    await pressWith("ArrowLeft", false, false);
    await pressWith("ArrowLeft", false, true);
    await pressWith("ArrowLeft", false, true);
    expect(graphOf(wrapper).vertices[0].x).toBe(98);
    await press("KeyZ", true);
    vertices = graphOf(wrapper).vertices;
    expect(vertices[0].x).toBe(101);
    expect(vertices[0].y).toBe(110);
  });

  it("opens the hotkey help and ignores other keys while it is open", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await pressWith("Slash", true, false);
    expect(wrapper.find(".graph-help").exists()).toBe(true);
    expect(wrapper.find(".graph-help").text()).toContain("Сдвинуть выделенные вершины");
    await press("Digit2", false);
    expect(wrapper.props("tool")).toBe("select");
    await press("Escape", false);
    expect(wrapper.find(".graph-help").exists()).toBe(false);
    await wrapper.find(".graph-toolbar__button--bottom").trigger("click");
    expect(wrapper.find(".graph-help").exists()).toBe(true);
    await wrapper.find(".graph-help__close").trigger("click");
    expect(wrapper.find(".graph-help").exists()).toBe(false);
  });

  it("renames a vertex with a double click and undoes it", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    await wrapper.findAll(".graph-vertex")[0].trigger("dblclick");
    const field = wrapper.find(".graph-rename");
    expect((field.element as HTMLInputElement).value).toBe("1");
    await field.setValue("A");
    await field.trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(wrapper.find(".graph-rename").exists()).toBe(false);
    expect(graphOf(wrapper).vertices[0].label).toBe("A");
    await press("KeyZ", true);
    expect(graphOf(wrapper).vertices[0].label).toBe("1");
  });

  it("renames the selected edge with F2 and keeps the label after Esc", async () => {
    let graph = threeVertices();
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const wrapper = mountEditor(graph, "select");
    await wrapper.find(".graph-edge").trigger("click");
    await press("F2", false);
    const field = wrapper.find(".graph-rename");
    await field.setValue("путь");
    await field.trigger("keydown", { key: "Escape" });
    await flushPromises();
    expect(wrapper.find(".graph-rename").exists()).toBe(false);
    expect(graphOf(wrapper).edges[0].label).toBe("");
  });

  it("draws an edge by dragging from one vertex to another", async () => {
    const wrapper = mountEditor(threeVertices(), "edge");
    await wrapper.findAll(".graph-vertex")[0].trigger("pointerdown", {
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 100 }));
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 302, clientY: 104 }));
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 302, clientY: 104 }));
    await flushPromises();
    const graph = graphOf(wrapper);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe(graph.vertices[0].id);
    expect(graph.edges[0].target).toBe(graph.vertices[1].id);
    expect(graph.vertices[0].x).toBe(100);
  });

  it("pans with two fingers and zooms with a pinch on a touchpad", async () => {
    const wrapper = mountEditor(threeVertices(), "select");
    const svg = wrapper.find("svg.graph-canvas__svg");
    await svg.trigger("wheel", { deltaX: 5, deltaY: 10 });
    expect(wrapper.find("svg.graph-canvas__svg > g").attributes("transform")).toBe(
      "translate(-5 -10) scale(1)",
    );
    await svg.trigger("wheel", { deltaX: 0, deltaY: -10, ctrlKey: true });
    expect(wrapper.find("svg.graph-canvas__svg > g").attributes("transform")).toContain(
      "scale(1.10",
    );
  });

  it("hides forbidden tools and ignores their keys", async () => {
    const wrapper = mountWithRules(threeVertices(), "select", taskRules());
    await wrapper.setProps({ tool: "vertex" });
    await flushPromises();
    expect(wrapper.props("tool")).toBe("select");
    expect(wrapper.findAll(".graph-toolbar__button[aria-pressed]").length).toBe(2);
    await press("Digit2", false);
    expect(wrapper.props("tool")).toBe("select");
    await clickVertex(wrapper, 0, false);
    await press("Delete", false);
    expect(graphOf(wrapper).vertices.length).toBe(3);
    await press("KeyD", true);
    expect(graphOf(wrapper).vertices.length).toBe(3);
    await pressWith("ArrowRight", false, false);
    expect(graphOf(wrapper).vertices[0].x).toBe(101);
  });

  it("locks the properties the task does not let you change", async () => {
    const wrapper = mountWithRules(threeVertices(), "select", taskRules());
    expect(wrapper.find(".graph-properties").text()).toContain("В этой задаче нельзя");
    await clickVertex(wrapper, 0, false);
    const inputs = wrapper.findAll(".graph-properties input");
    expect(inputs.length).toBe(2);
    expect(inputs[0].attributes("disabled")).toBeDefined();
    expect(inputs[1].attributes("disabled")).toBeDefined();
    expect(wrapper.find(".graph-properties__delete").exists()).toBe(false);
    expect(wrapper.find(".graph-swatches__option").attributes("disabled")).toBeUndefined();
    await wrapper.findAll(".graph-vertex")[0].trigger("dblclick");
    expect(wrapper.find(".graph-rename").exists()).toBe(false);
  });

  it("does not drag vertices when moving is forbidden", async () => {
    const rules = taskRules();
    rules.canMove = false;
    const wrapper = mountWithRules(threeVertices(), "select", rules);
    await wrapper.findAll(".graph-vertex")[0].trigger("pointerdown", {
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 150, clientY: 160 }));
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 150, clientY: 160 }));
    await flushPromises();
    expect(graphOf(wrapper).vertices[0].x).toBe(100);
    await clickVertex(wrapper, 0, false);
    await pressWith("ArrowRight", false, false);
    expect(graphOf(wrapper).vertices[0].x).toBe(100);
  });
});
