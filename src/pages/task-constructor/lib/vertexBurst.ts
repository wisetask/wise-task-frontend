import { motionAllowed } from "@/shared/lib/motion";

const COLORS = [
  "var(--color-accent)",
  "var(--graph-active)",
  "var(--color-success)",
  "var(--graph-red-stroke)",
];

const DOT_SIZE = 10;
const BURST_TIME = 1100;

export function burstPoints(count: number, radius: number): number[][] {
  const points: number[][] = [];
  for (let index = 0; index < count; index++) {
    const angle = (index * 2 * Math.PI) / count + (index % 2) * 0.22;
    const distance = radius * (0.7 + (index % 3) * 0.15);
    points.push([Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance)]);
  }
  return points;
}

export function vertexBurst(from: HTMLElement | null) {
  if (from === null || !motionAllowed() || typeof from.animate !== "function") {
    return;
  }
  const box = from.getBoundingClientRect();
  const centerX = box.left + box.width / 2 - DOT_SIZE / 2;
  const centerY = box.top + box.height / 2 - DOT_SIZE / 2;
  const layer = document.createElement("div");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.zIndex = "1000";
  layer.style.pointerEvents = "none";
  const points = burstPoints(16, 130);
  for (let index = 0; index < points.length; index++) {
    const dot = document.createElement("span");
    dot.style.position = "absolute";
    dot.style.left = centerX + "px";
    dot.style.top = centerY + "px";
    dot.style.width = DOT_SIZE + "px";
    dot.style.height = DOT_SIZE + "px";
    dot.style.border = "2px solid var(--color-surface)";
    dot.style.borderRadius = "50%";
    dot.style.background = COLORS[index % COLORS.length];
    layer.appendChild(dot);
    const x = points[index][0];
    const y = points[index][1];
    dot.animate(
      [
        { transform: "translate(0px, 0px) scale(0.3)", opacity: 1 },
        { transform: "translate(" + x + "px, " + y + "px) scale(1)", opacity: 1, offset: 0.55 },
        { transform: "translate(" + x + "px, " + (y + 40) + "px) scale(0.5)", opacity: 0 },
      ],
      { duration: BURST_TIME, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
    );
  }
  document.body.appendChild(layer);
  window.setTimeout(() => {
    layer.remove();
  }, BURST_TIME + 100);
}
