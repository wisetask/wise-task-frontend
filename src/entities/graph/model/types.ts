export type GraphColor = "RED" | "GREEN" | "BLUE" | "GRAY";

export interface Vertex {
  id: string;
  label: string;
  x: number;
  y: number;
  color: GraphColor;
  weight: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  color: GraphColor;
  weight: number;
}

export interface Graph {
  name: string;
  isDirected: boolean;
  vertices: Vertex[];
  edges: Edge[];
}
