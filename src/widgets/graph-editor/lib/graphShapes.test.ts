import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, updateVertex, type Graph } from "@/entities/graph";
import { eulerCircuit, grafWord, konigsbergLands, starShape } from "./graphShapes";

function withVertices(count: number): Graph {
  let graph = createEmptyGraph(false);
  for (let i = 0; i < count; i++) {
    graph = addVertex(graph, i * 40, (i % 3) * 40);
  }
  return graph;
}

function connect(graph: Graph, pairs: number[][]): Graph {
  let result = graph;
  for (const pair of pairs) {
    result = addEdge(result, result.vertices[pair[0]].id, result.vertices[pair[1]].id);
  }
  return result;
}

const KONIGSBERG = [
  [0, 4],
  [4, 1],
  [0, 5],
  [5, 1],
  [0, 6],
  [6, 2],
  [0, 7],
  [7, 2],
  [0, 8],
  [8, 3],
  [1, 9],
  [9, 3],
  [2, 10],
  [10, 3],
];

describe("eulerCircuit", () => {
  it("walks every edge of a bow tie once and comes back", () => {
    const bowTie = connect(withVertices(5), [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [3, 4],
      [4, 0],
    ]);
    const circuit = eulerCircuit(bowTie);
    expect(circuit).not.toBeNull();
    const path = circuit as string[];
    expect(path.length).toBe(7);
    expect(path[0]).toBe(path[6]);
  });

  it("refuses odd degrees and small graphs", () => {
    const path = connect(withVertices(4), [
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(eulerCircuit(path)).toBeNull();
    const triangle = connect(withVertices(3), [
      [0, 1],
      [1, 2],
      [2, 0],
    ]);
    expect(eulerCircuit(triangle)).toBeNull();
  });

  it("refuses two separate cycles", () => {
    const twoTriangles = connect(withVertices(6), [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
      [4, 5],
      [5, 3],
    ]);
    expect(eulerCircuit(twoTriangles)).toBeNull();
  });
});

describe("konigsbergLands", () => {
  it("finds the four lands of the bridges", () => {
    const graph = connect(withVertices(11), KONIGSBERG);
    const lands = konigsbergLands(graph);
    expect(lands).not.toBeNull();
    expect((lands as string[]).length).toBe(4);
    expect((lands as string[])[0]).toBe(graph.vertices[0].id);
  });

  it("does not see it when one bridge leads elsewhere", () => {
    const changed = KONIGSBERG.slice(0, 13).concat([[10, 1]]);
    expect(konigsbergLands(connect(withVertices(11), changed))).toBeNull();
  });
});

describe("grafWord", () => {
  it("finds Г-Р-А-Ф in a chain", () => {
    let graph = connect(withVertices(4), [
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    const letters = ["г", "Р", " А ", "Ф"];
    for (let i = 0; i < 4; i++) {
      graph = updateVertex(graph, graph.vertices[i].id, { label: letters[i] });
    }
    expect(grafWord(graph)).toEqual(graph.vertices.map((vertex) => vertex.id));
    const broken = updateVertex(graph, graph.vertices[3].id, { label: "Б" });
    expect(grafWord(broken)).toBeNull();
  });
});

describe("starShape", () => {
  it("finds a centre with eight leaves", () => {
    const pairs: number[][] = [];
    for (let i = 1; i <= 8; i++) {
      pairs.push([0, i]);
    }
    const star = connect(withVertices(9), pairs);
    const shape = starShape(star);
    expect(shape).not.toBeNull();
    expect((shape as { centerId: string }).centerId).toBe(star.vertices[0].id);
    const notStar = connect(star, [[1, 2]]);
    expect(starShape(notStar)).toBeNull();
  });
});
