import { describe, expect, it } from "vitest";
import { groupSolutions, type SolutionListItem } from "./solutionList";
import { MAP_LIMIT, recentFeed, starLeaves, taskMapLayout } from "./sideViews";

function solution(
  id: string,
  taskId: string,
  category: string,
  isCorrect: boolean,
): SolutionListItem {
  return {
    id: id,
    taskId: taskId,
    taskName: "Задача " + taskId,
    category: category,
    isCorrect: isCorrect,
    isGraph: true,
  };
}

describe("side views", () => {
  it("puts every task inside the map and links tasks of one category", () => {
    const groups = groupSolutions([
      solution("s1", "t1", "Деревья", true),
      solution("s2", "t2", "Раскраска", false),
      solution("s3", "t3", "Деревья", false),
      solution("s4", "t3", "Деревья", false),
    ]);
    const layout = taskMapLayout(groups, 200, 160);
    expect(layout.nodes.length).toBe(3);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThan(0);
      expect(node.x).toBeLessThan(200);
      expect(node.y).toBeGreaterThan(0);
      expect(node.y).toBeLessThan(160);
    }
    expect(layout.edges).toEqual([[0, 2]]);
    expect(layout.nodes[0].r).toBeGreaterThan(layout.nodes[1].r);
  });

  it("shows at most the newest tasks", () => {
    const items: SolutionListItem[] = [];
    for (let index = 0; index < MAP_LIMIT + 5; index++) {
      items.push(solution("s" + index, "t" + index, "", false));
    }
    expect(taskMapLayout(groupSolutions(items), 200, 160).nodes.length).toBe(MAP_LIMIT);
  });

  it("puts the attempts around the task like a star", () => {
    const leaves = starLeaves(
      [{ isCorrect: false }, { isCorrect: true }, { isCorrect: false }, { isCorrect: false }],
      30,
      20,
    );
    expect(leaves.length).toBe(4);
    expect(leaves[0]).toEqual({ x: 30, y: 10, isCorrect: false });
    expect(leaves[1]).toEqual({ x: 50, y: 30, isCorrect: true });
    expect(leaves[2]).toEqual({ x: 30, y: 50, isCorrect: false });
    expect(starLeaves([], 30, 20)).toEqual([]);
  });

  it("lists the latest attempts first", () => {
    const feed = recentFeed(
      [
        solution("s1", "t1", "", false),
        solution("s2", "t2", "", true),
        solution("s3", "t1", "", true),
      ],
      2,
    );
    expect(feed).toEqual([
      { id: "s3", taskName: "Задача t1", isCorrect: true },
      { id: "s2", taskName: "Задача t2", isCorrect: true },
    ]);
  });
});
