import { describe, expect, it } from "vitest";
import { isConnected, MAX_SIZE, maxPairs, MIN_SIZE, minPairs } from "@/entities/relation";
import {
  clampPairs,
  defaultRelation,
  DEFAULT_SIZE,
  kindDescription,
  KIND_OPTIONS,
  pairsOptions,
  sizeOptions,
  toRelationKind,
} from "./relationSetup";

describe("toRelationKind", () => {
  it("knows the four kinds", () => {
    expect(toRelationKind("any")).toBe("any");
    expect(toRelationKind("symmetric")).toBe("symmetric");
    expect(toRelationKind("antisymmetric")).toBe("antisymmetric");
    expect(toRelationKind("asymmetric")).toBe("asymmetric");
  });

  it("falls back to «any» for anything else", () => {
    expect(toRelationKind("strange")).toBe("any");
    expect(toRelationKind("")).toBe("any");
  });
});

describe("kindDescription", () => {
  it("has a text for every kind in the list", () => {
    for (const option of KIND_OPTIONS) {
      expect(kindDescription(toRelationKind(option.value)).length).toBeGreaterThan(10);
    }
  });

  it("gives different texts to different kinds", () => {
    const texts = new Set<string>();
    for (const option of KIND_OPTIONS) {
      texts.add(kindDescription(toRelationKind(option.value)));
    }
    expect(texts.size).toBe(KIND_OPTIONS.length);
  });
});

describe("sizeOptions", () => {
  it("goes from the smallest size to the largest", () => {
    const options = sizeOptions();
    expect(options[0].value).toBe(String(MIN_SIZE));
    expect(options[options.length - 1].value).toBe(String(MAX_SIZE));
    expect(options).toHaveLength(MAX_SIZE - MIN_SIZE + 1);
  });
});

describe("pairsOptions", () => {
  it("goes from the minimum to the maximum for the size and kind", () => {
    const options = pairsOptions(5, "any");
    expect(options[0].value).toBe(String(minPairs(5)));
    expect(options[options.length - 1].value).toBe(String(maxPairs(5, "any")));
  });

  it("shrinks for asymmetric relations", () => {
    const any = pairsOptions(4, "any");
    const asymmetric = pairsOptions(4, "asymmetric");
    expect(asymmetric.length).toBeLessThan(any.length);
    expect(asymmetric[asymmetric.length - 1].value).toBe("6");
  });
});

describe("clampPairs", () => {
  it("keeps a value that fits", () => {
    expect(clampPairs(7, 5, "any")).toBe(7);
  });

  it("raises a value that is too small", () => {
    expect(clampPairs(1, 5, "any")).toBe(4);
  });

  it("lowers a value that is too large", () => {
    expect(clampPairs(25, 5, "asymmetric")).toBe(10);
    expect(clampPairs(100, 3, "any")).toBe(9);
  });
});

describe("defaultRelation", () => {
  it("is a connected relation on the default number of elements", () => {
    const matrix = defaultRelation();
    expect(matrix).toHaveLength(DEFAULT_SIZE);
    expect(isConnected(matrix)).toBe(true);
  });
});
