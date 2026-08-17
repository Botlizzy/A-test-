import { describe, expect, it } from "vitest";
import { validateCloneTarget } from "./webClone";

describe("authorized web clone target validation", () => {
  it("accepts public http and https URLs", () => {
    expect(validateCloneTarget("https://example.com/path").hostname).toBe("example.com");
    expect(validateCloneTarget("http://example.org").protocol).toBe("http:");
  });

  it("rejects incomplete, non-http, and private targets", () => {
    expect(() => validateCloneTarget("example.com")).toThrow("complete public website URL");
    expect(() => validateCloneTarget("javascript:alert(1)")).toThrow("public http(s)");
    expect(() => validateCloneTarget("http://127.0.0.1:3000")).toThrow("public http(s)");
    expect(() => validateCloneTarget("http://192.168.0.8")).toThrow("public http(s)");
  });
});
