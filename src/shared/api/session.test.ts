import { describe, expect, it } from "vitest";
import { shouldEndSession } from "./session";

describe("shouldEndSession", () => {
  it("ends the session on HTTP 401, even when the request asks to keep it", () => {
    expect(shouldEndSession({ httpStatus: 401, classifications: [], keepSession: false })).toBe(
      true,
    );
    expect(shouldEndSession({ httpStatus: 401, classifications: [], keepSession: true })).toBe(
      true,
    );
  });

  it("ends the session on UNAUTHORIZED in the response", () => {
    expect(
      shouldEndSession({ httpStatus: null, classifications: ["UNAUTHORIZED"], keepSession: false }),
    ).toBe(true);
  });

  it("keeps the session on UNAUTHORIZED when the request asks for it", () => {
    expect(
      shouldEndSession({ httpStatus: null, classifications: ["UNAUTHORIZED"], keepSession: true }),
    ).toBe(false);
  });

  it("keeps the session on other errors", () => {
    expect(
      shouldEndSession({ httpStatus: 500, classifications: ["BAD_REQUEST"], keepSession: false }),
    ).toBe(false);
  });
});
