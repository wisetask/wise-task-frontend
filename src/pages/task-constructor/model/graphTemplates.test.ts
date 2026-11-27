import { describe, expect, it } from "vitest";
import { buildTemplate, findTemplate, GRAPH_TEMPLATES, templateShape } from "./graphTemplates";

describe("graph templates", () => {
  it("builds every template with the right size", () => {
    const sizes: Record<string, number[]> = {
      path: [5, 4],
      cycle: [6, 6],
      complete: [5, 10],
      star: [7, 6],
      bipartite: [6, 9],
      tree: [7, 6],
      cube: [8, 12],
      petersen: [10, 15],
    };
    for (const template of GRAPH_TEMPLATES) {
      const graph = buildTemplate(template.id, false);
      expect([graph.vertices.length, graph.edges.length]).toEqual(sizes[template.id]);
    }
  });

  it("keeps the kind of graph and gives labels in order", () => {
    const graph = buildTemplate("cycle", true);
    expect(graph.isDirected).toBe(true);
    const labels: string[] = [];
    for (const vertex of graph.vertices) {
      labels.push(vertex.label);
    }
    expect(labels).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("links only existing points", () => {
    for (const template of GRAPH_TEMPLATES) {
      const shape = templateShape(template.id);
      for (const link of shape.links) {
        expect(link[0]).toBeLessThan(shape.points.length);
        expect(link[1]).toBeLessThan(shape.points.length);
        expect(link[0]).not.toBe(link[1]);
      }
    }
  });

  it("finds a template by id", () => {
    expect(findTemplate("petersen").title).toBe("Граф Петерсена");
  });
});
