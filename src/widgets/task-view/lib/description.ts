export interface DescriptionPart {
  text: string;
  href: string;
}

const LINK = /https?:\/\/[^\s<>"«»]+/g;
const TRAILING = /[.,;:!?)\]]+$/;
const MAX_LABEL = 48;

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export function linkLabel(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  const host = url.hostname.replace(/^www\./, "");
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  if (segments.length === 0) {
    return host;
  }
  let last = safeDecode(segments[segments.length - 1]).replace(/_/g, " ");
  if (last.length > MAX_LABEL) {
    last = last.slice(0, MAX_LABEL - 1).trim() + "…";
  }
  return host + " › " + last;
}

export function descriptionParts(text: string): DescriptionPart[] {
  const parts: DescriptionPart[] = [];
  let position = 0;
  for (const match of text.matchAll(LINK)) {
    const start = match.index === undefined ? 0 : match.index;
    let href = match[0];
    const tail = TRAILING.exec(href);
    if (tail !== null) {
      href = href.slice(0, href.length - tail[0].length);
    }
    if (start > position) {
      parts.push({ text: text.slice(position, start), href: "" });
    }
    parts.push({ text: linkLabel(href), href: href });
    position = start + href.length;
  }
  if (position < text.length) {
    parts.push({ text: text.slice(position), href: "" });
  }
  return parts;
}
