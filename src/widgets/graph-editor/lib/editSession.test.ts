import { describe, expect, it } from "vitest";
import { createEditSession } from "./editSession";

describe("edit session", () => {
  it("starts once while the same field is edited", () => {
    let starts = 0;
    const session = createEditSession(() => {
      starts = starts + 1;
    });
    session.edit("vertex:1:label");
    session.edit("vertex:1:label");
    session.edit("vertex:1:label");
    expect(starts).toBe(1);
  });

  it("starts again for another field or after finish", () => {
    let starts = 0;
    const session = createEditSession(() => {
      starts = starts + 1;
    });
    session.edit("vertex:1:label");
    session.edit("vertex:1:weight");
    expect(starts).toBe(2);
    session.finish();
    session.edit("vertex:1:weight");
    expect(starts).toBe(3);
  });
});
