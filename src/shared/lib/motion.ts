import { ref } from "vue";

export const MOTION_KEY = "wisetask.motion";

function readPageMotionOff(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.dataset.motion === "off";
}

const motionOff = ref(readPageMotionOff());

export function parseMotionOff(value: string | null | undefined): boolean {
  return value === "off";
}

export function isMotionOff(): boolean {
  return motionOff.value;
}

export function systemReducesMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionAllowed(): boolean {
  if (motionOff.value) {
    return false;
  }
  return !systemReducesMotion();
}

export function setMotionOff(value: boolean) {
  motionOff.value = value;
  document.documentElement.dataset.motion = value ? "off" : "on";
  try {
    window.localStorage.setItem(MOTION_KEY, value ? "off" : "on");
  } catch {
    return;
  }
}
