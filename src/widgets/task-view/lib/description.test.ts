import { describe, expect, it } from "vitest";
import { descriptionParts, linkLabel } from "./description";

const WIKI =
  "https://ru.wikipedia.org/wiki/%D0%A1%D1%82%D0%B5%D0%BF%D0%B5%D0%BD%D1%8C_%D0%B2%D0%B5%D1%80%D1%88%D0%B8%D0%BD%D1%8B";

describe("description links", () => {
  it("makes a short readable label for a link", () => {
    expect(linkLabel(WIKI)).toBe("ru.wikipedia.org › Степень вершины");
    expect(linkLabel("https://www.example.com/")).toBe("example.com");
    expect(linkLabel("not a link")).toBe("not a link");
  });

  it("splits text into plain parts and links, leaving punctuation outside", () => {
    const parts = descriptionParts("Степени чётные " + WIKI + ". Вершин 6");
    expect(parts).toEqual([
      { text: "Степени чётные ", href: "" },
      { text: "ru.wikipedia.org › Степень вершины", href: WIKI },
      { text: ". Вершин 6", href: "" },
    ]);
  });

  it("keeps text without links as one part", () => {
    expect(descriptionParts("Постройте дерево")).toEqual([{ text: "Постройте дерево", href: "" }]);
    expect(descriptionParts("")).toEqual([]);
  });
});
