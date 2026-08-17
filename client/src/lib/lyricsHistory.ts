export type LyricsHistoryEntry = {
  id: string;
  theme: string;
  title: string;
  lyrics: string;
  createdAt: number;
};

export const LYRICS_HISTORY_KEY = "elizzy-domain:lyrics-history";
export const MAX_LYRICS_HISTORY = 8;

function isEntry(value: unknown): value is LyricsHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.theme === "string" && typeof entry.title === "string" && typeof entry.lyrics === "string" && typeof entry.createdAt === "number";
}

export function readLyricsHistory(storage: Pick<Storage, "getItem"> | null | undefined): LyricsHistoryEntry[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LYRICS_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isEntry).sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_LYRICS_HISTORY) : [];
  } catch {
    return [];
  }
}

export function writeLyricsHistory(storage: Pick<Storage, "setItem"> | null | undefined, entries: LyricsHistoryEntry[]): void {
  if (!storage) return;
  try { storage.setItem(LYRICS_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_LYRICS_HISTORY))); } catch { /* Storage may be unavailable or full. */ }
}

export function addLyricsHistoryEntry(current: LyricsHistoryEntry[], entry: LyricsHistoryEntry): LyricsHistoryEntry[] {
  return [entry, ...current.filter((item) => item.theme !== entry.theme || item.lyrics !== entry.lyrics)].slice(0, MAX_LYRICS_HISTORY);
}

export function formatLyricsDownload(entry: Pick<LyricsHistoryEntry, "title" | "theme" | "lyrics">): string {
  return `${entry.title}\nTheme: ${entry.theme}\n\n${entry.lyrics}\n`;
}
