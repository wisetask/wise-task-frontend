import { describe, expect, it } from "vitest";
import {
  burstSparks,
  EMPTY_GRAPH_NOTE,
  emptyGraphNote,
  REPEAT_JOKES,
  repeatJoke,
  successTitle,
} from "./checkMotion";

describe("check motion", () => {
  it("throws all sparks upwards", () => {
    const sparks = burstSparks(18);
    expect(sparks.length).toBe(18);
    for (const spark of sparks) {
      expect(spark.dy).toBeLessThan(0);
      expect(spark.color).toBeLessThan(4);
    }
  });

  it("has no joke before the first repeat and then goes round", () => {
    expect(repeatJoke(0)).toBe("");
    expect(repeatJoke(1)).toBe(REPEAT_JOKES[0]);
    expect(repeatJoke(REPEAT_JOKES.length + 1)).toBe(REPEAT_JOKES[0]);
  });

  it("changes the success title from time to time", () => {
    expect(successTitle(0)).toBe("Верно!");
    expect(successTitle(1)).not.toBe(successTitle(0));
    expect(successTitle(3)).toBe("Верно!");
  });

  it("jokes only about an empty graph", () => {
    expect(emptyGraphNote(0)).toBe(EMPTY_GRAPH_NOTE);
    expect(emptyGraphNote(3)).toBe("");
  });
});
