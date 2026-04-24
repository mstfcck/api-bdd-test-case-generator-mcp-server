export function safeJsonStringify(value: unknown, pretty = false): string {
  try {
    return JSON.stringify(
      value,
      (_key, val: unknown) =>
        typeof val === "bigint" ? `[BigInt: ${val.toString()}]` : val,
      pretty ? 2 : 0
    );
  } catch {
    return JSON.stringify({ error: "[Unserializable value]" });
  }
}
