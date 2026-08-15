import { describe, expect, it } from "vitest";
import { isCustomerId, normalizeCustomerId } from "./adminLookup";

describe("Premium Admin customer lookup helpers", () => {
  it("normalizes mobile clipboard whitespace and invisible characters", () => {
    expect(normalizeCustomerId("  483AFF58-3BBF-4E87-9849-19528DE38E86\u200B ")).toBe("483aff58-3bbf-4e87-9849-19528de38e86");
  });

  it("accepts valid UUIDs and rejects malformed IDs", () => {
    expect(isCustomerId("483aff58-3bbf-4e87-9849-19528de38e86")).toBe(true);
    expect(isCustomerId("483aff58-3bbf-4e87-9849-19528de38e8")).toBe(false);
    expect(isCustomerId("customer-123")).toBe(false);
  });
});
