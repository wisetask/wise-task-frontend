/**
 * @jest-environment jsdom
 */
import { createApp, defineComponent, h, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";

(global as any).localStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
};

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

global.DOMMatrixReadOnly = class {
  m22: number;
  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([1-9.])\)/)?.[1];
    this.m22 = scale !== undefined ? +scale : 1;
  }
} as any;

global.SVGElement.prototype.getBBox = () =>
  ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect);

describe("graphToEditor integration with vue-flow", () => {
  it("renders edges loaded by applyEditorGraphState", async () => {
    setActivePinia(createPinia());
    const { VueFlow, ConnectionMode, useVueFlow } = await import("@vue-flow/core");
    const { useNodeStore } = await import("@/features/graph/stores/nodes");
    const { GRAPH_VUE_FLOW_ID } = await import("@/features/graph/stores/vueFlowBus");
    const { applyEditorGraphState, gqlGraphToEditorState } = await import("../graphToEditor");

    const nodeStore = useNodeStore();

    const graph = {
      vertexList: [
        { id: 1, label: "A", weight: 0, color: "GRAY", xCoordinate: 0, yCoordinate: 0 },
        { id: 2, label: "B", weight: 0, color: "GRAY", xCoordinate: 200, yCoordinate: 0 },
      ],
      edgeList: [{ source: 1, target: 2, label: "", color: "GRAY", weight: 0 }],
      isDirect: true,
      name: "",
    } as any;

    applyEditorGraphState(gqlGraphToEditorState(graph));

    const Host = defineComponent({
      setup() {
        const vueFlowState = useVueFlow(GRAPH_VUE_FLOW_ID);
        vueFlowState.setState({ connectionMode: ConnectionMode.Loose });
        return () =>
          h(VueFlow, {
            id: GRAPH_VUE_FLOW_ID,
            nodes: nodeStore.nodes as any,
            edges: nodeStore.edges as any,
            "onUpdate:nodes": (v: any) => (nodeStore.nodes = v),
            "onUpdate:edges": (v: any) => (nodeStore.edges = v),
          });
      },
    });

    const root = document.createElement("div");
    document.body.appendChild(root);
    const app = createApp(Host);
    app.use(createPinia());
    app.mount(root);
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await nextTick();

    const edgeElements = document.querySelectorAll(".vue-flow__edge");

    app.unmount();
    root.remove();

    expect(edgeElements.length).toBe(1);
  });
});
