export type ZoomKeyAction = "zoom-in" | "zoom-out" | "reset" | "fit";

export function zoomKeyAction(code: string, shiftKey: boolean): ZoomKeyAction | null {
  if (shiftKey && code === "Digit1") {
    return "fit";
  }
  if (code === "Equal" || code === "NumpadAdd") {
    return "zoom-in";
  }
  if (code === "Minus" || code === "NumpadSubtract") {
    return "zoom-out";
  }
  if (!shiftKey && (code === "Digit0" || code === "Numpad0")) {
    return "reset";
  }
  return null;
}
