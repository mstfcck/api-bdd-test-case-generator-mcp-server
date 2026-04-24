import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "../src/lib/json.js";

describe("safeJsonStringify", () => {
  it("serializes plain objects", () => {
    expect(safeJsonStringify({ ok: true })).toBe('{"ok":true}');
  });

  it("pretty-prints when requested", () => {
    expect(safeJsonStringify({ ok: true }, true)).toBe('{\n  "ok": true\n}');
  });

  it("serializes BigInt values instead of throwing", () => {
    const result = safeJsonStringify({ n: BigInt(42) });
    expect(result).toBe('{"n":"[BigInt: 42]"}');
  });

  it("returns fallback JSON for circular references instead of throwing", () => {
    const obj: Record<string, unknown> = {};
    obj["self"] = obj;
    const result = safeJsonStringify(obj);
    expect(result).toContain("Unserializable");
  });
});
