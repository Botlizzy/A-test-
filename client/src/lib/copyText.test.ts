import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./copyText";

const writeText = vi.fn<(_: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

describe("copyText", () => {
  it("rejects empty answers without touching the clipboard", async () => {
    expect(await copyText("")).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies through the Clipboard API when available", async () => {
    expect(await copyText("A generated answer")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("A generated answer");
  });
});
