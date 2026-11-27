import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { graphFromHandoff, handOffAnswer, handoffText, takeHandedAnswer } from "./answerHandoff";

function memory() {
  const values: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return values[key] === undefined ? null : values[key];
    },
    setItem(key: string, value: string) {
      values[key] = value;
    },
    removeItem(key: string) {
      delete values[key];
    },
  };
}

function smallGraph() {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 0, 0);
  graph = addVertex(graph, 100, 0);
  return addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
}

describe("answer handoff", () => {
  it("gives the graph only to the same task", () => {
    const text = handoffText("7", smallGraph());
    expect(graphFromHandoff(text, "8")).toBeNull();
    const graph = graphFromHandoff(text, "7");
    expect(graph === null ? 0 : graph.vertices.length).toBe(2);
    expect(graph === null ? 0 : graph.edges.length).toBe(1);
  });

  it("ignores broken data", () => {
    expect(graphFromHandoff(null, "7")).toBeNull();
    expect(graphFromHandoff("not json", "7")).toBeNull();
    expect(graphFromHandoff('{"taskId":"7","graph":"{}"}', "7")).toBeNull();
  });

  it("hands the graph over once", () => {
    const storage = memory();
    handOffAnswer("7", smallGraph(), storage);
    expect(takeHandedAnswer("7", storage)).not.toBeNull();
    expect(takeHandedAnswer("7", storage)).toBeNull();
  });
});
