import { describe, expect, it } from "vitest";
import { coordLabel, ENVELOPE_ORDER, nextSketch, sketchPlan, SKETCH_ORDER } from "./blueprint";

describe("blueprint sketches", () => {
  it("places vertices before edges", () => {
    const plan = sketchPlan("cycle", 400, 300, 1);
    expect(plan.vertices.length).toBe(6);
    expect(plan.edges.length).toBe(6);
    expect(plan.guide).toEqual({ cx: 400, cy: 300, r: 150 });
    const lastVertex = plan.vertices[plan.vertices.length - 1].delay;
    expect(plan.edges[0].delay).toBeGreaterThan(lastVertex);
    expect(plan.duration).toBeGreaterThan(plan.edges[plan.edges.length - 1].delay);
  });

  it("draws the envelope in one stroke through every edge", () => {
    const plan = sketchPlan("envelope", 0, 0, 1);
    expect(plan.guide).toBeNull();
    expect(plan.stroke.split("L").length).toBe(ENVELOPE_ORDER.length);
    const seen = new Set<string>();
    for (let index = 1; index < ENVELOPE_ORDER.length; index++) {
      const first = Math.min(ENVELOPE_ORDER[index - 1], ENVELOPE_ORDER[index]);
      const second = Math.max(ENVELOPE_ORDER[index - 1], ENVELOPE_ORDER[index]);
      seen.add(first + "-" + second);
    }
    expect(seen.size).toBe(8);
  });

  it("goes through the sketches and lets an easter egg cut in", () => {
    expect(nextSketch(0, "")).toBe(SKETCH_ORDER[0]);
    expect(nextSketch(SKETCH_ORDER.length, "")).toBe(SKETCH_ORDER[0]);
    expect(nextSketch(3, "envelope")).toBe("envelope");
  });

  it("writes grid coordinates", () => {
    expect(coordLabel(240, 49)).toBe("x = 10, y = 2");
  });
});
