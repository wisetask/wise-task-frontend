import type { GraphStatistics } from "@/entities/graph";

export interface StatsItem {
  label: string;
  value: number;
}

export function buildStatsItems(stats: GraphStatistics): StatsItem[] {
  return [
    { label: "Вершин", value: stats.vertices },
    { label: "Рёбер", value: stats.edges },
    { label: "Петель", value: stats.loops },
    { label: "Листьев", value: stats.leaves },
    { label: "Изолированных", value: stats.isolated },
    { label: "Компонент", value: stats.components },
  ];
}
