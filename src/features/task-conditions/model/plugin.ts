export type PluginType =
  "GRAPH_PROPERTY" | "GRAPH_CHARACTERISTIC" | "GRAPH_NEW_GRAPH" | "GRAPH_STRING";

export type GraphType = "DIRECT" | "UNDIRECT" | "ANY";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  pluginType: PluginType;
  graphType: GraphType;
  isValid: boolean;
}

export function pluginFitsTask(plugin: Plugin, graphType: GraphType): boolean {
  return graphType === "ANY" || plugin.graphType === "ANY" || plugin.graphType === graphType;
}
