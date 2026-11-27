import { motionAllowed } from "./motion";

export const EXPAND_TIME = 420;
export const FADE_TIME = 260;
export const TITLE_LEFT = 16;
export const TITLE_TOP = 64;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function boxFrame(box: Box, radius: number): Keyframe {
  return {
    left: Math.round(box.left) + "px",
    top: Math.round(box.top) + "px",
    width: Math.round(box.width) + "px",
    height: Math.round(box.height) + "px",
    borderRadius: radius + "px",
  };
}

export function titleFrames(from: Box, to: Box): Keyframe[] {
  return [
    { transform: "translate(0px, 0px)" },
    {
      transform:
        "translate(" +
        Math.round(to.left + TITLE_LEFT - from.left - 20) +
        "px, " +
        Math.round(to.top + TITLE_TOP - from.top - 16) +
        "px) scale(1.15)",
    },
  ];
}

export function canExpand(event: MouseEvent): boolean {
  if (event.button !== 0) {
    return false;
  }
  return !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

export function expandGhost(from: HTMLElement, to: HTMLElement | null, title: string) {
  if (!motionAllowed() || to === null || typeof from.animate !== "function") {
    return;
  }
  const start = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();

  const ghost = document.createElement("div");
  ghost.className = "expand-ghost";
  ghost.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.className = "expand-ghost__title";
  text.textContent = title;
  ghost.appendChild(text);
  document.body.appendChild(ghost);

  const grow = ghost.animate([boxFrame(start, 14), boxFrame(end, 0)], {
    duration: EXPAND_TIME,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fill: "forwards",
  });
  text.animate(titleFrames(start, end), {
    duration: EXPAND_TIME,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fill: "forwards",
  });
  grow.finished
    .then(() => {
      const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: FADE_TIME,
        easing: "ease-out",
        fill: "forwards",
      });
      return fade.finished;
    })
    .catch(() => undefined)
    .finally(() => {
      ghost.remove();
    });
}
