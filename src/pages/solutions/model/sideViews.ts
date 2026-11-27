import type { SolutionListItem, TaskGroup } from "./solutionList";

export const GOLDEN_ANGLE = 2.399963;
export const MAP_LIMIT = 40;

export interface MapNode {
  key: string;
  x: number;
  y: number;
  r: number;
  solved: boolean;
  category: string;
  taskName: string;
  attempts: number;
  delay: string;
  duration: string;
  drift: number;
}

export interface MapLayout {
  nodes: MapNode[];
  edges: number[][];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function taskMapLayout(groups: TaskGroup[], width: number, height: number): MapLayout {
  const shown = groups.slice(0, MAP_LIMIT);
  const nodes: MapNode[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2 - 14;
  const radiusY = height / 2 - 14;
  for (let index = 0; index < shown.length; index++) {
    const group = shown[index];
    const angle = index * GOLDEN_ANGLE;
    const spread = Math.sqrt((index + 0.5) / shown.length);
    nodes.push({
      key: group.key,
      x: round(centerX + Math.cos(angle) * radiusX * spread),
      y: round(centerY + Math.sin(angle) * radiusY * spread),
      r: round(4 + Math.min(group.attempts.length, 9) * 0.7),
      solved: group.solved,
      category: group.category,
      taskName: group.taskName,
      attempts: group.attempts.length,
      delay: round((index * 0.37) % 3) + "s",
      duration: round(4 + (index % 5) * 0.6) + "s",
      drift: index % 3,
    });
  }
  const edges: number[][] = [];
  const lastOfCategory: Record<string, number> = {};
  for (let index = 0; index < nodes.length; index++) {
    const category = nodes[index].category.trim();
    if (category === "") {
      continue;
    }
    const previous = lastOfCategory[category];
    if (previous !== undefined) {
      edges.push([previous, index]);
    }
    lastOfCategory[category] = index;
  }
  return { nodes: nodes, edges: edges };
}

export interface StarLeaf {
  x: number;
  y: number;
  isCorrect: boolean;
}

export function starLeaves(
  attempts: { isCorrect: boolean }[],
  center: number,
  radius: number,
): StarLeaf[] {
  const leaves: StarLeaf[] = [];
  for (let index = 0; index < attempts.length; index++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / attempts.length;
    leaves.push({
      x: round(center + Math.cos(angle) * radius),
      y: round(center + Math.sin(angle) * radius),
      isCorrect: attempts[index].isCorrect,
    });
  }
  return leaves;
}

export interface FeedItem {
  id: string;
  taskName: string;
  isCorrect: boolean;
}

export function recentFeed(items: SolutionListItem[], limit: number): FeedItem[] {
  const result: FeedItem[] = [];
  for (let index = items.length - 1; index >= 0 && result.length < limit; index--) {
    result.push({
      id: items[index].id,
      taskName: items[index].taskName,
      isCorrect: items[index].isCorrect,
    });
  }
  return result;
}
