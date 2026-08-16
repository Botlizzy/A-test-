import { describe, expect, it } from "vitest";
import { buildMurekaCreatePayload, extractMurekaAudioTracks, extractMurekaTaskId, isMurekaTerminal, safeMurekaFilename } from "./murekaMusic";

describe("Mureka music helpers", () => {
  it("builds a clean vocal or instrumental payload", () => {
    expect(buildMurekaCreatePayload({ prompt: " hopeful pop ", title: " Night Signal ", style: "", lyrics: "", instrumental: true })).toEqual({ prompt: "hopeful pop", title: "Night Signal", instrumental: true });
  });
  it("extracts async task identifiers", () => {
    expect(extractMurekaTaskId({ data: { task_id: "mureka-123" } })).toBe("mureka-123");
    expect(extractMurekaTaskId({ jobId: 9 })).toBe("9");
  });
  it("recognizes terminal statuses", () => {
    expect(isMurekaTerminal({ status: "processing" })).toBe(false);
    expect(isMurekaTerminal({ status: "completed" })).toBe(true);
  });
  it("keeps direct audio links and filters provider URLs", () => {
    expect(extractMurekaAudioTracks({ audio_url: "https://cdn.example.com/tracks/one.mp3", api: "https://apis.davidcyril.name.ng/aimusic/mureka/status?id=1" })).toEqual(["https://cdn.example.com/tracks/one.mp3"]);
  });
  it("adds a safe extension to extensionless audio links", () => {
    expect(safeMurekaFilename("https://cdn.example.com/download?id=2", 2)).toBe("download.mp3");
  });
});
