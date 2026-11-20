import { describe, expect, it } from "vitest";
import {
  areaBetween,
  createViewport,
  fitArea,
  isTouchpadWheel,
  keepInArea,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  parseZoomPercent,
  pointsArea,
  screenToWorld,
  visibleArea,
  wheelFactor,
  wheelGesture,
  worldToScreen,
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

  it("finds the area taken by the vertices", () => {
    expect(pointsArea([])).toBeNull();
    const points = [
      { x: 10, y: 50 },
      { x: -20, y: 30 },
      { x: 40, y: 90 },
    ];
    expect(pointsArea(points)).toEqual({ left: -20, top: 30, right: 40, bottom: 90 });
  });

  it("puts the whole graph in the middle of the canvas", () => {
    const area = { left: 100, top: 100, right: 300, bottom: 200 };
    const viewport = fitArea(area, 800, 600, 0);
    expect(viewport.scale).toBe(1);
    expect(screenToWorld(viewport, { x: 400, y: 300 })).toEqual({ x: 200, y: 150 });
  });

  it("zooms out when the graph does not fit", () => {
    const area = { left: 0, top: 0, right: 1500, bottom: 100 };
    const viewport = fitArea(area, 800, 600, 50);
    expect(viewport.scale).toBe(0.5);
    const shown = visibleArea(viewport, 800, 600);
    expect(shown.left).toBeLessThanOrEqual(0);
    expect(shown.right).toBeGreaterThanOrEqual(1500);
  });

  it("does not zoom out too far to fit a huge graph", () => {
    const area = { left: 0, top: 0, right: 100000, bottom: 100 };
    expect(fitArea(area, 800, 600, 0).scale).toBe(MIN_SCALE);
  });

  it("builds a frame from two corners in any order", () => {
    const expected = { left: 10, top: 20, right: 50, bottom: 80 };
    expect(areaBetween({ x: 10, y: 20 }, { x: 50, y: 80 })).toEqual(expected);
    expect(areaBetween({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual(expected);
    expect(areaBetween({ x: 50, y: 20 }, { x: 10, y: 80 })).toEqual(expected);
  });

  it("turns world points back into screen points", () => {
    const viewport = { x: 30, y: -20, scale: 2 };
    expect(worldToScreen(viewport, { x: 10, y: 15 })).toEqual({ x: 50, y: 10 });
    const back = screenToWorld(viewport, worldToScreen(viewport, { x: 7, y: 9 }));
    expect(back).toEqual({ x: 7, y: 9 });
  });

  it("tells a touchpad from a mouse wheel", () => {
    const wheel = { deltaX: 0, deltaY: 100, deltaMode: 0, ctrlKey: false };
    const lines = { deltaX: 0, deltaY: 3, deltaMode: 1, ctrlKey: false };
    const fingers = { deltaX: 0, deltaY: 6, deltaMode: 0, ctrlKey: false };
    const sideways = { deltaX: 120, deltaY: 0, deltaMode: 0, ctrlKey: false };
    expect(isTouchpadWheel(wheel)).toBe(false);
    expect(isTouchpadWheel(lines)).toBe(false);
    expect(isTouchpadWheel(fingers)).toBe(true);
    expect(isTouchpadWheel(sideways)).toBe(true);
  });

  it("pans with two fingers and zooms with a pinch or the wheel", () => {
    const fingers = wheelGesture({ deltaX: 4, deltaY: -6, deltaMode: 0, ctrlKey: false });
    expect(fingers).toEqual({ kind: "pan", dx: -4, dy: 6 });
    const pinch = wheelGesture({ deltaX: 0, deltaY: -10, deltaMode: 0, ctrlKey: true });
    expect(pinch.kind).toBe("zoom");
    if (pinch.kind === "zoom") {
      expect(pinch.factor).toBe(Math.exp(0.1));
    }
    const wheel = wheelGesture({ deltaX: 0, deltaY: 100, deltaMode: 0, ctrlKey: false });
    expect(wheel).toEqual({ kind: "zoom", factor: wheelFactor(100, 0) });
    const ctrlWheel = wheelGesture({ deltaX: 0, deltaY: 100, deltaMode: 0, ctrlKey: true });
    expect(ctrlWheel).toEqual({ kind: "zoom", factor: wheelFactor(100, 0) });
  });
});
