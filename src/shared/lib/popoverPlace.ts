export interface PopoverPlace {
  left: number;
  top: number;
}

export function popoverPlace(
  card: { left: number; right: number; top: number },
  viewportWidth: number,
  viewportHeight: number,
  width: number,
  height: number,
): PopoverPlace | null {
  const gap = 14;
  let left = card.right + gap;
  if (viewportWidth - card.right < width + gap * 2) {
    if (card.left < width + gap * 2) {
      return null;
    }
    left = card.left - width - gap;
  }
  const lowest = Math.max(viewportHeight - height - gap, gap);
  const top = Math.min(Math.max(card.top, 72), lowest);
  return { left: Math.round(left), top: Math.round(top) };
}
