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

describe("normalizeView", () => {
  it("does not throw on edges without sourceNode", async () => {
    setActivePinia(createPinia());
    const { useNodeStore } = await import("@/features/graph/stores/nodes");

    const nodeStore = useNodeStore();
    nodeStore.nodes = [
      {
        id: "1",
        type: "special",
        position: { x: 0, y: 0 },
        data: { label: "A", weight: 0, color: "#949494" },
      },
      {
        id: "2",
        type: "special",
        position: { x: 200, y: 0 },
        data: { label: "B", weight: 0, color: "#949494" },
      },
    ] as any;
    nodeStore.edges = [
      {
        id: "edge-0",
        source: "1",
        target: "2",
        type: "special",
        label: "",
        data: { color: "#949494", weight: 0 },
      },
    ] as any;

    const normalize = () => nodeStore.normalizeView();

    expect(normalize).not.toThrow();
    expect(nodeStore.nodes.length).toBe(2);
    expect(nodeStore.edges.length).toBe(1);
  });
});
