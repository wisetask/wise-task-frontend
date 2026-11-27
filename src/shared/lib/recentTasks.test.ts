import { describe, expect, it } from "vitest";
import { parseRecentTasks, RECENT_TASKS_LIMIT, withRecentTask } from "./recentTasks";

describe("recent tasks", () => {
  it("reads only good entries", () => {
    expect(parseRecentTasks(null)).toEqual([]);
    expect(parseRecentTasks("not json")).toEqual([]);
    expect(parseRecentTasks('{"id":"1"}')).toEqual([]);
    expect(parseRecentTasks('[{"id":"1","name":"A"},{"id":2},null,{"id":"","name":"B"}]')).toEqual([
      { id: "1", name: "A" },
    ]);
  });

  it("puts the opened task first without repeats", () => {
    const list = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ];
    expect(withRecentTask(list, { id: "2", name: "B2" })).toEqual([
      { id: "2", name: "B2" },
      { id: "1", name: "A" },
    ]);
  });

  it("keeps only the last few tasks", () => {
    let list = withRecentTask([], { id: "0", name: "0" });
    for (let index = 1; index < 10; index++) {
      list = withRecentTask(list, { id: String(index), name: String(index) });
    }
    expect(list.length).toBe(RECENT_TASKS_LIMIT);
    expect(list[0].id).toBe("9");
  });
});
