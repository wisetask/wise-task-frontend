import { describe, expect, it } from "vitest";
import { addEdge, addVertex } from "@/entities/graph";
import { createTaskDraft, type TaskDraft } from "../model/taskDraft";
import {
  clearDraft,
  DRAFT_KEY,
  draftFromText,
  draftToText,
  loadDraft,
  saveDraft,
  type DraftStorage,
} from "./savedDraft";

function memoryStorage(): DraftStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => {
      const value = items.get(key);
      return value === undefined ? null : value;
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

function sampleDraft(): TaskDraft {
  const draft = createTaskDraft();
  draft.name = "Правильная раскраска";
  draft.category = "Раскраска графов";
  draft.description = "Раскрасьте вершины";
  draft.hasGraph = true;
  draft.isHiddenMistake = true;
  draft.rules.canAdd = false;
  draft.rules.direction = "undirected";
  let graph = addVertex(draft.graph, 10, 20);
  graph = addVertex(graph, 110, 20);
  draft.graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
  return draft;
}

describe("saved constructor draft", () => {
  it("gets back the same task after saving", () => {
    const storage = memoryStorage();
    expect(saveDraft(storage, sampleDraft())).toBe(true);
    const loaded = loadDraft(storage);
    expect(loaded).not.toBeNull();
    if (loaded === null) {
      return;
    }
    expect(loaded.name).toBe("Правильная раскраска");
    expect(loaded.hasGraph).toBe(true);
    expect(loaded.isHiddenMistake).toBe(true);
    expect(loaded.rules).toEqual(sampleDraft().rules);
    expect(loaded.graph.vertices.length).toBe(2);
    expect(loaded.graph.edges.length).toBe(1);
    expect(loaded.graph.vertices[1].x).toBe(110);
  });

  it("returns nothing when nothing was saved or storage is off", () => {
    expect(loadDraft(memoryStorage())).toBeNull();
    expect(loadDraft(null)).toBeNull();
    expect(saveDraft(null, sampleDraft())).toBe(false);
  });

  it("ignores broken or foreign data", () => {
    expect(draftFromText("not json")).toBeNull();
    expect(draftFromText("[]")).toBeNull();
    const data = JSON.parse(draftToText(sampleDraft()));
    data.rules.direction = "sideways";
    expect(draftFromText(JSON.stringify(data))).toBeNull();
    const noGraph = JSON.parse(draftToText(sampleDraft()));
    noGraph.graph = "{}";
    expect(draftFromText(JSON.stringify(noGraph))).toBeNull();
  });

  it("forgets the draft after clearing", () => {
    const storage = memoryStorage();
    saveDraft(storage, sampleDraft());
    clearDraft(storage);
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
    expect(loadDraft(storage)).toBeNull();
  });
});
