import type { BackendGraph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { GetFullGraphQuery } from "../api/getGraph";
import { graphToLoad } from "./taskView";

export async function loadFullGraph(
  graph: BackendGraph | null | undefined,
): Promise<BackendGraph | null> {
  const graphId = graphToLoad(graph);
  if (graphId === null) {
    return graph ?? null;
  }
  const { data } = await apolloClient.query({
    query: GetFullGraphQuery,
    variables: { id: graphId },
    fetchPolicy: "network-only",
  });
  return data.getGraphById;
}

export async function tryLoadFullGraph(
  graph: BackendGraph | null | undefined,
): Promise<BackendGraph | null> {
  try {
    return await loadFullGraph(graph);
  } catch {
    return null;
  }
}
