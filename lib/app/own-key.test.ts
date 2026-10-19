import { describe, expect, it } from "vitest";
import { ownValue } from "./own-key";

describe("ownValue", () => {
  const notices: Record<string, string> = { cancelled: "No payment was taken.", error: "Try again." };

  it("finds the map's own keys", () => {
    expect(ownValue(notices, "cancelled")).toBe("No payment was taken.");
    expect(ownValue(notices, "error")).toBe("Try again.");
  });

  it.each(["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf", "isPrototypeOf", "__defineGetter__"])(
    "ignores the inherited member %j",
    (key) => {
      expect(ownValue(notices, key)).toBeUndefined();
    },
  );

  it("ignores missing, empty, repeated and non-string values", () => {
    expect(ownValue(notices, undefined)).toBeUndefined();
    expect(ownValue(notices, null)).toBeUndefined();
    expect(ownValue(notices, "")).toBeUndefined();
    expect(ownValue(notices, "nope")).toBeUndefined();
    expect(ownValue(notices, ["cancelled", "error"])).toBeUndefined();
    expect(ownValue(notices, 1)).toBeUndefined();
  });
});
