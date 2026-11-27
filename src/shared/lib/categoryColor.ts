export const CATEGORY_COLORS = 6;

export function categoryColor(category: string): number {
  const text = category.trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100003;
  }
  return hash % CATEGORY_COLORS;
}
