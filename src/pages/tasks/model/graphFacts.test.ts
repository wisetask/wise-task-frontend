import { describe, expect, it } from "vitest";
import { GRAPH_FACTS, nextFactIndex, shapePicture } from "./graphFacts";

describe("graph facts", () => {
  it("draws the shapes with the right number of edges", () => {
    expect(shapePicture("tree").edges.length).toBe(shapePicture("tree").points.length - 1);
    expect(shapePicture("k5").edges.length).toBe(10);
    expect(shapePicture("k4").edges.length).toBe(6);
    expect(shapePicture("bipartite").edges.length).toBe(9);
    expect(shapePicture("petersen").points.length).toBe(10);
    expect(shapePicture("petersen").edges.length).toBe(15);
  });

  it("goes round the facts", () => {
    expect(nextFactIndex(0, GRAPH_FACTS.length)).toBe(1);
    expect(nextFactIndex(GRAPH_FACTS.length - 1, GRAPH_FACTS.length)).toBe(0);
    expect(nextFactIndex(3, 0)).toBe(0);
  });
});
