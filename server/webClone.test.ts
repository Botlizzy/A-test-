import { describe, expect, it } from "vitest";
import { parseCloneResponse, validateCloneTarget } from "./webClone";

function mockResponse(body: string, ok = true, status = 200): Response {
  return { ok, status, headers: new Headers({ "content-type": "application/json" }), text: async () => body } as Response;
}

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

describe("web clone response parsing", () => {
  it("rejects an empty successful body with a readable message", async () => {
    await expect(parseCloneResponse(mockResponse(""))).rejects.toThrow("empty response");
  });

  it("rejects malformed JSON without exposing the browser parser error", async () => {
    await expect(parseCloneResponse(mockResponse("{\"status\":", true))).rejects.toThrow("unreadable response");
  });

  it("accepts a valid JSON object", async () => {
    await expect(parseCloneResponse(mockResponse(JSON.stringify({ status: true, result: { url: "https://files.example.com/site.zip" } })))).resolves.toMatchObject({ status: true });
  });

  it("uses a concise HTTP message for an empty failed body", async () => {
    await expect(parseCloneResponse(mockResponse("", false, 502))).rejects.toThrow("HTTP 502");
  });
});
