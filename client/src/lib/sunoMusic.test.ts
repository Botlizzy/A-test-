import { describe, expect, it } from "vitest";
import { buildSunoCreatePayload, extractSunoAudioTracks, extractSunoTaskId, isSunoTerminal, safeSunoFilename } from "./sunoMusic";

describe("Suno music helpers", () => {
  it("builds a clean creative payload without empty optional fields", () => {
    expect(buildSunoCreatePayload({ prompt: "  hopeful afrobeat  ", title: "  Signal  ", style: "", lyrics: "", instrumental: false })).toEqual({ prompt: "hopeful afrobeat", title: "Signal", instrumental: false });
  });

  it("extracts task IDs from common async response shapes", () => {
    expect(extractSunoTaskId({ data: { task_id: "task-123" } })).toBe("task-123");
    expect(extractSunoTaskId({ jobId: 42 })).toBe("42");
    expect(extractSunoTaskId({ status: "pending" })).toBeNull();
  });

  it("recognizes terminal provider states", () => {
    expect(isSunoTerminal({ status: "processing" })).toBe(false);
    expect(isSunoTerminal({ data: { status: "completed" } })).toBe(true);
  });

  it("returns direct audio files and filters the provider endpoint", () => {
    expect(extractSunoAudioTracks({ audio_url: "https://cdn.example.com/music/track.mp3", api: "https://apis.davidcyril.name.ng/aimusic/suno/status?id=1" })).toEqual(["https://cdn.example.com/music/track.mp3"]);
  });

  it("adds a safe mp3 extension when the provider URL has none", () => {
    expect(safeSunoFilename("https://cdn.example.com/download/track?id=4", 2)).toBe("track.mp3");
  });
});
