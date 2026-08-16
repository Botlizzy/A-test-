import { describe, expect, it } from "vitest";
import { buildTextToSpeechQuery, extractBase64Audio, extractSpeechAudioLinks, isAudioContentType, safeSpeechFilename } from "./textToSpeech";

describe("Text2Speech V3 helpers", () => {
  it("builds text, language, and voice query parameters", () => {
    const query = buildTextToSpeechQuery({ text: " Hello world ", language: "en-US", voice: "narrator", pitch: "2", rate: "1.2" });
    expect(query.get("text")).toBe("Hello world");
    expect(query.get("lang")).toBe("en-US");
    expect(query.get("voice")).toBe("narrator");
    expect(query.get("pitch")).toBe("2");
    expect(query.get("rate")).toBe("1.2");
  });
  it("recognizes binary audio responses", () => {
    expect(isAudioContentType("audio/mpeg")).toBe(true);
    expect(isAudioContentType("application/json")).toBe(false);
  });
  it("extracts direct speech audio URLs and filters the provider endpoint", () => {
    expect(extractSpeechAudioLinks({ audio_url: "https://cdn.example.com/speech.mp3", api: "https://apis.davidcyril.name.ng/tools/speechma" })).toEqual(["https://cdn.example.com/speech.mp3"]);
  });
  it("extracts sufficiently long base64 audio payloads", () => {
    const encoded = "A".repeat(128);
    expect(extractBase64Audio({ audio: encoded })).toBe(encoded);
  });
  it("uses an audio-specific download filename", () => {
    expect(safeSpeechFilename("audio/wav")).toBe("eliminator-speech.wav");
    expect(safeSpeechFilename("audio/mpeg")).toBe("eliminator-speech.mp3");
  });
});
