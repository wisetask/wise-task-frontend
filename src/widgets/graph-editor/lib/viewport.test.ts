import { describe, expect, it } from "vitest";
import {
  createViewport,
  keepInArea,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  parseZoomPercent,
  screenToWorld,
  visibleArea,
  wheelFactor,
  zoomAt,
  zoomPercent,
  zoomToPercent,
} from "./viewport";

describe("canvas viewport", () => {
  it("does nothing to points at the start", () => {
    const viewport = createViewport();
    expect(screenToWorld(viewport, { x: 30, y: 40 })).toEqual({ x: 30, y: 40 });
  });

  it("keeps the point under the cursor in place while zooming", () => {
    const cursor = { x: 200, y: 100 };
    const before = createViewport();
    const after = zoomAt(before, cursor, 2);
    expect(after.scale).toBe(2);
    expect(screenToWorld(after, cursor)).toEqual(screenToWorld(before, cursor));
  });

  it("does not zoom out or in too far", () => {
    const center = { x: 0, y: 0 };
    expect(zoomAt(createViewport(), center, 100).scale).toBe(MAX_SCALE);
    expect(zoomAt(createViewport(), center, 0.001).scale).toBe(MIN_SCALE);
  });

  it("moves the picture when panning", () => {
    const viewport = panBy(createViewport(), 50, -20);
    expect(screenToWorld(viewport, { x: 50, y: -20 })).toEqual({ x: 0, y: 0 });
  });

  it("finds the visible part of the graph", () => {
    const viewport = zoomAt(createViewport(), { x: 0, y: 0 }, 2);
    expect(visibleArea(viewport, 400, 300)).toEqual({ left: 0, top: 0, right: 200, bottom: 150 });
  });

  it("keeps a dragged vertex inside the visible part", () => {
    const area = { left: 0, top: 0, right: 200, bottom: 100 };
    expect(keepInArea({ x: -50, y: 500 }, area, 10)).toEqual({ x: 10, y: 90 });
    expect(keepInArea({ x: 70, y: 40 }, area, 10)).toEqual({ x: 70, y: 40 });
  });

  it("shows the zoom in percent", () => {
    expect(zoomPercent(createViewport())).toBe(100);
    expect(zoomPercent(zoomAt(createViewport(), { x: 0, y: 0 }, 1.25))).toBe(125);
  });

  it("zooms in on wheel up and out on wheel down", () => {
    expect(wheelFactor(-100, 0)).toBeGreaterThan(1);
    expect(wheelFactor(100, 0)).toBeLessThan(1);
  });

  it("treats wheel lines like pixels, as Firefox reports them", () => {
    expect(wheelFactor(3, 1)).toBeCloseTo(wheelFactor(120, 0));
  });

  it("reads a zoom value typed by the user", () => {
    expect(parseZoomPercent("150")).toBe(150);
    expect(parseZoomPercent("150%")).toBe(150);
    expect(parseZoomPercent(" 75 % ")).toBe(75);
    expect(parseZoomPercent("62,5")).toBe(62.5);
    expect(parseZoomPercent("")).toBeNull();
    expect(parseZoomPercent("abc")).toBeNull();
    expect(parseZoomPercent("-50")).toBeNull();
    expect(parseZoomPercent("0")).toBeNull();
  });

  it("zooms to a typed percent and keeps it within the limits", () => {
    const center = { x: 200, y: 100 };
    const zoomed = zoomToPercent(createViewport(), center, 150);
    expect(zoomed.scale).toBe(1.5);
    expect(screenToWorld(zoomed, center)).toEqual(screenToWorld(createViewport(), center));
    expect(zoomToPercent(createViewport(), center, 1000).scale).toBe(MAX_SCALE);
    expect(zoomToPercent(createViewport(), center, 5).scale).toBe(MIN_SCALE);
  });
});
