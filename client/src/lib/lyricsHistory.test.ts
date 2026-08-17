import { describe, expect, it } from "vitest";
import { addLyricsHistoryEntry, formatLyricsDownload, MAX_LYRICS_HISTORY, readLyricsHistory, writeLyricsHistory, type LyricsHistoryEntry } from "./lyricsHistory";

const entry = (id: string, createdAt: number, theme = "hope"): LyricsHistoryEntry => ({ id, theme, title: "Hope song", lyrics: "Hold on", createdAt });

describe("lyrics generation history", () => {
  it("stores and reads valid recent entries in newest-first order", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
    writeLyricsHistory(storage, [entry("old", 1), entry("new", 2)]);
    expect(readLyricsHistory(storage).map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("deduplicates the same theme and lyric text and keeps history bounded", () => {
    let history: LyricsHistoryEntry[] = [];
    for (let index = 0; index < MAX_LYRICS_HISTORY + 2; index += 1) history = addLyricsHistoryEntry(history, entry(String(index), index, `theme-${index}`));
    history = addLyricsHistoryEntry(history, entry("duplicate", 99, "theme-1"));
    expect(history).toHaveLength(MAX_LYRICS_HISTORY);
    expect(history.filter((item) => item.theme === "theme-1")).toHaveLength(1);
  });

  it("formats a safe downloadable text file", () => {
    expect(formatLyricsDownload(entry("1", 1))).toContain("Theme: hope");
    expect(formatLyricsDownload(entry("1", 1))).toContain("Hold on");
  });
});
