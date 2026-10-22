export type SemanticTaskInput = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

export type SemanticTaskWithScore = SemanticTaskInput & { score: number };

export type SemanticPluginInput = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  graphType?: string;
  pluginType?: string;
};

export type SemanticPluginWithScore = SemanticPluginInput & { score: number };

const SEMANTIC_SEARCH_API_URL = "http://localhost:8001";

export async function searchTasks(
  query: string,
  topK = 3,
): Promise<SemanticTaskWithScore[]> {
  const response = await fetch(`${SEMANTIC_SEARCH_API_URL}/tasks/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to search tasks: ${response.status} ${errorBody}`);
  }

  return (await response.json()) as SemanticTaskWithScore[];
}

export async function searchPlugins(
  query: string,
  topK = 3,
): Promise<SemanticPluginWithScore[]> {
  const response = await fetch(`${SEMANTIC_SEARCH_API_URL}/plugins/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to search plugins: ${response.status} ${errorBody}`,
    );
  }

  return (await response.json()) as SemanticPluginWithScore[];
}
