import { describe, expect, it } from "vitest";
import { findReturnedMediaLinks, getBoostStatusUrl, isTerminalBoostStatus, PREMIUM_DOWNLOADER_PATHS } from "./PremiumRoom";

describe("Premium booster status helpers", () => {
  it("accepts supported status URL fields", () => {
    expect(getBoostStatusUrl({ status_url: "https://apis.davidcyril.name.ng/status/123" })).toBe("https://apis.davidcyril.name.ng/status/123");
    expect(getBoostStatusUrl({ statusUrl: "https://example.com/status/123" })).toBe("https://example.com/status/123");
  });

  it("rejects missing or unsafe status URLs", () => {
    expect(getBoostStatusUrl({ status_url: "not-a-url" })).toBeNull();
    expect(getBoostStatusUrl({})).toBeNull();
  });

  it("distinguishes pending jobs from terminal provider results", () => {
    expect(isTerminalBoostStatus({ status: "pending" })).toBe(false);
    expect(isTerminalBoostStatus({ status: "completed" })).toBe(true);
    expect(isTerminalBoostStatus({ success: true })).toBe(true);
    expect(isTerminalBoostStatus({ success: false })).toBe(true);
  });
});

describe("Premium downloader integrations", () => {
  it("uses the documented Facebook, TikTok V4, and YouTube MP4 V2 paths", () => {
    expect(PREMIUM_DOWNLOADER_PATHS).toEqual({ facebook: "/facebook3", tiktok: "/download/tiktokv4", youtube: "/download/ytmp444" });
  });

  it("extracts extensionless direct media URLs returned under downloader keys", () => {
    const links = findReturnedMediaLinks({ url: "https://dl.snapcdn.app/download?token=abc", cover: "https://cdn.example.com/cover.jpg" });
    expect(links).toEqual(["https://dl.snapcdn.app/download?token=abc"]);
  });

  it("never exposes API endpoints or original social-page URLs as downloadable files", () => {
    const links = findReturnedMediaLinks({
      api: "https://apis.davidcyril.name.ng/download/tiktokv4?url=source",
      source: "https://www.tiktok.com/@creator/video/123",
      download_url: "https://cdn.example.com/media/result.mp4"
    });
    expect(links).toEqual(["https://cdn.example.com/media/result.mp4"]);
  });
});
